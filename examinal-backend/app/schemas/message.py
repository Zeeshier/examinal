from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.utils.sanitize import sanitize_string


class MessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(min_length=1, max_length=2000)
    exam_id: Optional[int] = None

    @field_validator("content", mode="before")
    @classmethod
    def sanitize_content(cls, v):
        if isinstance(v, str):
            return sanitize_string(v)
        return v


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    exam_id: Optional[int] = None
    enrollment_request_id: Optional[int] = None
    content: str
    is_read: bool
    created_at: datetime
    # Enriched
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    exam_title: Optional[str] = None

    model_config = {"from_attributes": True}


class ConversationPreview(BaseModel):
    user_id: int
    user_name: str
    user_role: str
    last_message: str
    last_message_at: datetime
    unread_count: int
