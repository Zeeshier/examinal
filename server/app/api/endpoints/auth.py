"""
Authentication Endpoints
User registration and login with JWT tokens.
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.auth import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    create_refresh_token
)
from app.core.config import settings
from app.models.models import User, UserRole
from app.schemas.auth import (
    UserCreate, 
    UserLogin, 
    Token, 
    UserResponse,
    RegisterResponse
)

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user and return JWT tokens for auto-login.
    
    - **username**: Unique username (3-50 characters)
    - **email**: Valid email address
    - **password**: Password (min 6 characters)
    - **role**: User role (student, instructor, or admin)
    """
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=UserRole(user_data.role),
        full_name=user_data.full_name
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate tokens for auto-login
    access_token = create_access_token(
        data={"sub": str(new_user.id), "role": new_user.role.value}
    )
    
    refresh_token, expires_at = create_refresh_token(
        data={"sub": str(new_user.id)}
    )
    
    new_user.refresh_token = refresh_token
    new_user.token_expires_at = expires_at
    db.commit()
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT tokens.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns access token and refresh token.
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    # Create tokens
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )
    
    refresh_token, expires_at = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    # Store refresh token in database
    user.refresh_token = refresh_token
    user.token_expires_at = expires_at
    db.commit()
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token.
    """
    from app.core.auth import decode_token
    
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user or user.refresh_token != refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Create new tokens
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )
    
    new_refresh_token, expires_at = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    user.refresh_token = new_refresh_token
    user.token_expires_at = expires_at
    db.commit()
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )
