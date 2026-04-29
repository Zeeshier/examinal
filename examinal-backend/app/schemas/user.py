from datetime import datetime
from typing import Optional
import re

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    role: str = Field(default="student", pattern="^(instructor|student)$")

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r'[0-9]', v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r'[^a-zA-Z0-9]', v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full name cannot be empty")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role: Optional[str] = Field(default=None, pattern="^(admin|instructor|student)$")


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: int
    role: str