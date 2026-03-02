"""
Pydantic Schemas
Request/Response models for API validation.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


# ==================== Enums ====================

class UserRole(str, Enum):
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    STUDENT = "student"


class QuestionType(str, Enum):
    OBJECTIVE = "objective"
    SUBJECTIVE = "subjective"


# ==================== Health Check ====================

class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = "healthy"
    message: str = "Examinal API is running"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ==================== User Schemas ====================

class UserBase(BaseModel):
    """Base user schema with common fields."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.STUDENT


class UserResponse(UserBase):
    """Schema for user response (excludes sensitive data)."""
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Exam Schemas ====================

class ExamBase(BaseModel):
    """Base exam schema with common fields."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    duration_minutes: int = Field(default=60, ge=1)
    total_marks: float = Field(default=100.0, ge=0)
    passing_marks: Optional[float] = None


class ExamCreate(ExamBase):
    """Schema for creating a new exam."""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class ExamResponse(ExamBase):
    """Schema for exam response."""
    id: int
    creator_id: int
    is_published: bool
    access_code: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Question Schemas ====================

class QuestionBase(BaseModel):
    """Base question schema with common fields."""
    question_text: str = Field(..., min_length=1)
    question_type: QuestionType
    marks: float = Field(default=1.0, ge=0)


class QuestionCreate(QuestionBase):
    """Schema for creating a new question."""
    options: Optional[Dict[str, str]] = None  # For MCQs
    correct_answer: Optional[str] = None
    model_answer: Optional[str] = None  # For subjective questions
    order: int = 0


class QuestionResponse(QuestionBase):
    """Schema for question response."""
    id: int
    exam_id: int
    options: Optional[Dict[str, str]] = None
    order: int
    created_at: datetime
    
    # Note: correct_answer and model_answer excluded for student view
    
    class Config:
        from_attributes = True


class QuestionWithAnswer(QuestionResponse):
    """Schema for question with answer (for instructors/grading)."""
    correct_answer: Optional[str] = None
    model_answer: Optional[str] = None


# ==================== Submission Schemas ====================

class SubmissionBase(BaseModel):
    """Base submission schema."""
    answers: Optional[Dict[str, Any]] = None


class SubmissionCreate(SubmissionBase):
    """Schema for creating a submission."""
    exam_id: int


class SubmissionResponse(SubmissionBase):
    """Schema for submission response."""
    id: int
    exam_id: int
    student_id: int
    score: Optional[float] = None
    max_score: Optional[float] = None
    ai_feedback: Optional[str] = None
    is_graded: bool
    submitted_at: datetime
    graded_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
