"""
Authentication endpoints:
  POST /api/auth/register         — create account
  POST /api/auth/login            — login → JWT pair
  POST /api/auth/refresh          — rotate refresh token
  POST /api/auth/logout           — revoke refresh token (server-side)
  GET  /api/auth/me               — current user info
  POST /api/auth/forgot-password  — request password reset email
  POST /api/auth/reset-password   — consume token, set new password
  POST /api/auth/change-password  — change password while logged in
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser
from app.schemas.user import (
    UserCreate, UserOut, Token,
    ForgotPasswordRequest, ResetPasswordRequest,
    ChangePasswordRequest, RefreshTokenRequest,
    LogoutRequest, MessageResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.register(payload)


@router.post("/login", response_model=Token)
def login(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None
    service = AuthService(db)
    user = service.authenticate(form.username, form.password, ip_address=ip)
    return service.create_tokens(user)


@router.post("/refresh", response_model=Token)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.refresh(payload.refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout(payload: LogoutRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    service.logout(payload.refresh_token)
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: CurrentUser):
    return current_user


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    service.forgot_password(payload.email)
    # Always return the same message to prevent email enumeration
    return {"message": "If that email is registered, a password reset link has been sent."}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    service.reset_password(payload.token, payload.new_password)
    return {"message": "Password has been reset successfully. Please log in with your new password."}


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.change_password(current_user, payload.current_password, payload.new_password)
    return {"message": "Password changed successfully. All other sessions have been signed out."}