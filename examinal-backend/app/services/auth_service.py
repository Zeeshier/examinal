"""
Authentication service:
  - Registration with role protection
  - Login with brute-force lockout & rate limiting
  - Server-side refresh token rotation + revocation
  - Forgot / Reset / Change password
  - Logout (token revocation)
"""

import hashlib
import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Request

from app.config import settings
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.password_reset_token import PasswordResetToken
from app.models.login_attempt import LoginAttempt
from app.schemas.user import UserCreate, Token
from app.utils.security import hash_password, verify_password
from app.utils.sanitize import sanitize_string
from app.utils.email import send_password_reset_email

# ── Constants ──
MAX_FAILED_ATTEMPTS = 5          # lock after N consecutive failures
LOCKOUT_MINUTES = 15             # lock duration
LOOKBACK_MINUTES = 15            # sliding window for counting failures
PASSWORD_RESET_EXPIRE_MINUTES = 30


def _sha256(value: str) -> str:
    """Return the SHA-256 hex digest of a string (for safe token storage)."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    # ──────────────────────────────────────────────
    # Register
    # ──────────────────────────────────────────────
    def register(self, payload: UserCreate) -> User:
        email = sanitize_string(payload.email).lower()
        username = sanitize_string(payload.username)
        full_name = sanitize_string(payload.full_name)

        if payload.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin accounts cannot be created through registration. Contact your system administrator.",
            )

        if self.db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        if self.db.query(User).filter(User.username == username).first():
            raise HTTPException(status_code=400, detail="Username already taken")

        user = User(
            email=email,
            username=username,
            hashed_password=hash_password(payload.password),
            full_name=full_name,
            role=payload.role,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    # ──────────────────────────────────────────────
    # Authenticate (login with lockout)
    # ──────────────────────────────────────────────
    def authenticate(self, username: str, password: str, ip_address: str | None = None) -> User:
        username = username.strip()
        user = self.db.query(User).filter(
            (User.username == username) | (User.email == username)
        ).first()

        # Check lockout before verifying password (prevents timing oracle)
        if user and user.locked_until:
            if datetime.now(timezone.utc) < user.locked_until.replace(tzinfo=timezone.utc):
                remaining = int((user.locked_until.replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)).total_seconds() // 60) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Account temporarily locked due to too many failed attempts. Try again in {remaining} minute(s).",
                )
            else:
                # Lock expired — reset counters
                user.failed_login_count = 0
                user.locked_until = None
                self.db.commit()

        # Always record attempt (even for unknown users) to slow enumeration
        attempt = LoginAttempt(
            identifier=username,
            ip_address=ip_address,
            success=False,
        )

        password_ok = user is not None and verify_password(password, user.hashed_password)

        if not user or not password_ok:
            self.db.add(attempt)
            if user:
                user.failed_login_count = (user.failed_login_count or 0) + 1
                if user.failed_login_count >= MAX_FAILED_ATTEMPTS:
                    user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
                    self.db.commit()
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Account locked for {LOCKOUT_MINUTES} minutes due to repeated failed login attempts.",
                    )
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account deactivated. Contact support.")

        # Success — reset failed count
        attempt.success = True
        self.db.add(attempt)
        user.failed_login_count = 0
        user.locked_until = None
        self.db.commit()
        return user

    # ──────────────────────────────────────────────
    # Token creation (JWT + DB-backed refresh)
    # ──────────────────────────────────────────────
    def _create_access_token(self, user: User) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return jwt.encode(
            {"sub": str(user.id), "role": user.role, "exp": expire},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )

    def _create_refresh_token(self, user: User) -> str:
        """Mint a raw refresh token, store its hash in DB, return raw value."""
        raw_token = os.urandom(32).hex()  # 256-bit secure random
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        db_token = RefreshToken(
            user_id=user.id,
            token_hash=_sha256(raw_token),
            expires_at=expires_at,
        )
        self.db.add(db_token)
        self.db.commit()
        return raw_token

    def create_tokens(self, user: User) -> Token:
        access = self._create_access_token(user)
        refresh = self._create_refresh_token(user)
        return Token(access_token=access, refresh_token=refresh)

    # ──────────────────────────────────────────────
    # Refresh (token rotation)
    # ──────────────────────────────────────────────
    def refresh(self, raw_refresh_token: str) -> Token:
        token_hash = _sha256(raw_refresh_token)
        db_token = self.db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()

        if not db_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        if db_token.revoked:
            raise HTTPException(status_code=401, detail="Refresh token has been revoked")
        if datetime.now(timezone.utc) > db_token.expires_at.replace(tzinfo=timezone.utc):
            raise HTTPException(status_code=401, detail="Refresh token has expired")

        user = self.db.query(User).filter(User.id == db_token.user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or deactivated")

        # Rotate: revoke old token, issue new pair
        db_token.revoked = True
        self.db.commit()
        return self.create_tokens(user)

    # ──────────────────────────────────────────────
    # Logout (revoke refresh token server-side)
    # ──────────────────────────────────────────────
    def logout(self, raw_refresh_token: str) -> None:
        token_hash = _sha256(raw_refresh_token)
        db_token = self.db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()
        if db_token:
            db_token.revoked = True
            self.db.commit()
        # No error if token not found — idempotent logout

    def logout_all(self, user_id: int) -> None:
        """Revoke ALL refresh tokens for a user (e.g., suspicious activity)."""
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,
        ).update({"revoked": True})
        self.db.commit()

    # ──────────────────────────────────────────────
    # Forgot Password (request reset link)
    # ──────────────────────────────────────────────
    def forgot_password(self, email: str) -> None:
        email = email.strip().lower()
        user = self.db.query(User).filter(User.email == email).first()

        # Always return success to prevent user enumeration
        if not user or not user.is_active:
            return

        # Invalidate any existing reset tokens for this user
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,
        ).update({"used": True})

        raw_token = os.urandom(32).hex()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES)

        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=_sha256(raw_token),
            expires_at=expires_at,
        )
        self.db.add(reset_token)
        self.db.commit()

        send_password_reset_email(to_email=user.email, reset_token=raw_token, username=user.username)

    # ──────────────────────────────────────────────
    # Reset Password (consume token)
    # ──────────────────────────────────────────────
    def reset_password(self, raw_token: str, new_password: str) -> None:
        token_hash = _sha256(raw_token)
        db_token = self.db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash
        ).first()

        if not db_token or db_token.used:
            raise HTTPException(status_code=400, detail="Invalid or already used reset token")
        if datetime.now(timezone.utc) > db_token.expires_at.replace(tzinfo=timezone.utc):
            raise HTTPException(status_code=400, detail="Reset token has expired. Request a new one.")

        user = self.db.query(User).filter(User.id == db_token.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.hashed_password = hash_password(new_password)
        user.failed_login_count = 0
        user.locked_until = None
        db_token.used = True

        # Revoke all refresh tokens on password reset (force re-login)
        self.logout_all(user.id)

        self.db.commit()

    # ──────────────────────────────────────────────
    # Change Password (logged-in user)
    # ──────────────────────────────────────────────
    def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        if current_password == new_password:
            raise HTTPException(status_code=400, detail="New password must differ from current password")

        user.hashed_password = hash_password(new_password)

        # Revoke all refresh tokens — force re-login on all other devices
        self.logout_all(user.id)
        self.db.commit()