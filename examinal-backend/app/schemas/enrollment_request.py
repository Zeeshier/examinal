from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.utils.sanitize import sanitize_string


class EnrollmentRequestCreate(BaseModel):
    exam_id: int
    message: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("message", mode="before")
    @classmethod
    def sanitize_message(cls, v):
        if isinstance(v, str):
            return sanitize_string(v)
        return v


class EnrollmentRequestUpdate(BaseModel):
    status: str = Field(pattern="^(approved|rejected)$")
    rejection_reason: Optional[str] = Field(default=None, max_length=500)

    @field_validator("rejection_reason", mode="before")
    @classmethod
    def sanitize_reason(cls, v):
        if isinstance(v, str):
            return sanitize_string(v)
        return v


class EnrollmentRequestOut(BaseModel):
    id: int
    exam_id: int
    student_id: int
    status: str
    access_key: Optional[str] = None
    message: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Enriched fields (populated by router)
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    exam_title: Optional[str] = None
    course_title: Optional[str] = None
    teacher_name: Optional[str] = None

    model_config = {"from_attributes": True}
