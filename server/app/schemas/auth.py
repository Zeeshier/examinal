"""
Authentication Schemas
Pydantic models for auth request/response validation.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    STUDENT = "student"


class UserCreate(BaseModel):
    """Schema for user registration."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    role: UserRoleEnum = UserRoleEnum.STUDENT
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (excludes sensitive data)."""
    id: int
    username: str
    email: str
    role: UserRoleEnum
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegisterResponse(BaseModel):
    """Schema for registration response."""
    message: str
    user: UserResponse


class TokenData(BaseModel):
    """Schema for decoded token data."""
    user_id: Optional[int] = None
    role: Optional[str] = None
