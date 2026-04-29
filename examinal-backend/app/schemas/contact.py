from pydantic import EmailStr, BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List

from app.utils.sanitize import sanitize_string


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    subject: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=10, max_length=5000)

    @field_validator("name", "subject", "message", mode="before")
    @classmethod
    def sanitize_fields(cls, v: str) -> str:
        if isinstance(v, str):
            return sanitize_string(v)
        return v


class ContactReplyCreate(BaseModel):
    reply: str = Field(min_length=1, max_length=5000)

    @field_validator("reply", mode="before")
    @classmethod
    def sanitize_reply(cls, v: str) -> str:
        if isinstance(v, str):
            return sanitize_string(v)
        return v


class ContactReply(BaseModel):
    id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ContactMessage(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    created_at: datetime
    replies: List[ContactReply] = []

    class Config:
        from_attributes = True
