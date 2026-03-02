"""
Exam Schemas
Pydantic models for exam request/response validation.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class ExamTypeEnum(str, Enum):
    MCQ = "mcq"
    SUBJECTIVE = "subjective"
    MIXED = "mixed"


class QuestionTypeEnum(str, Enum):
    OBJECTIVE = "objective"
    SUBJECTIVE = "subjective"


# --- Question Schemas ---

class QuestionCreate(BaseModel):
    """Schema for creating a question."""
    question_text: str = Field(..., min_length=1)
    question_type: QuestionTypeEnum
    options: Optional[List[str]] = None  # For MCQ: ["Option A", "Option B", ...]
    correct_answer: Optional[str] = None  # For MCQ
    model_answer: Optional[str] = None  # For subjective
    marks: float = Field(default=1.0, ge=0)


class QuestionResponse(BaseModel):
    """Schema for question response."""
    id: int
    question_text: str
    question_type: QuestionTypeEnum
    options: Optional[dict] = None
    correct_answer: Optional[str] = None
    model_answer: Optional[str] = None
    marks: float
    order: int
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionBatchCreate(BaseModel):
    """Schema for batch creating questions."""
    questions: List[QuestionCreate]


# --- Exam Schemas ---

class ExamCreate(BaseModel):
    """Schema for creating a new exam."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    duration_minutes: int = Field(default=60, ge=1, le=480)
    total_marks: float = Field(default=100.0, ge=0)
    passing_marks: Optional[float] = None
    exam_type: ExamTypeEnum = ExamTypeEnum.MCQ
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class ExamUpdate(BaseModel):
    """Schema for updating an exam."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=480)
    total_marks: Optional[float] = Field(None, ge=0)
    passing_marks: Optional[float] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_published: Optional[bool] = None


class ExamResponse(BaseModel):
    """Schema for exam response."""
    id: int
    title: str
    description: Optional[str] = None
    creator_id: int
    duration_minutes: int
    total_marks: float
    passing_marks: Optional[float] = None
    exam_type: ExamTypeEnum = ExamTypeEnum.MCQ
    is_published: bool
    access_code: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExamListResponse(BaseModel):
    """Schema for exam list (minimal info)."""
    id: int
    title: str
    description: Optional[str] = None
    duration_minutes: int
    total_marks: float
    exam_type: ExamTypeEnum = ExamTypeEnum.MCQ
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True
