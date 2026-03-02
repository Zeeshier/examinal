"""
SQLAlchemy Database Models
Defines the ORM models for Users, Exams, Questions, and Submissions.
"""

import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, 
    ForeignKey, Enum, JSON, Float, Table
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.db.session import Base


# Many-to-many: which students are assigned to which exams
exam_students = Table(
    "exam_students",
    Base.metadata,
    Column("exam_id", Integer, ForeignKey("exams.id", ondelete="CASCADE"), primary_key=True),
    Column("student_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("assigned_at", DateTime, default=datetime.utcnow),
)


class UserRole(enum.Enum):
    """Enumeration for user roles."""
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    STUDENT = "student"


class ExamType(enum.Enum):
    """Enumeration for exam types."""
    MCQ = "mcq"
    SUBJECTIVE = "subjective"
    MIXED = "mixed"


class QuestionType(enum.Enum):
    """Enumeration for question types."""
    OBJECTIVE = "objective"
    SUBJECTIVE = "subjective"


class User(Base):
    """
    User model for authentication and authorization.
    Supports admin, instructor, and student roles.
    """
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    
    # JWT Authentication fields
    refresh_token: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Profile fields
    full_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    # Who created this student (NULL for self-registered users)
    created_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    created_exams: Mapped[List["Exam"]] = relationship("Exam", back_populates="creator", cascade="all, delete-orphan", foreign_keys="Exam.creator_id")
    submissions: Mapped[List["Submission"]] = relationship("Submission", back_populates="student", cascade="all, delete-orphan")
    assigned_exams: Mapped[List["Exam"]] = relationship("Exam", secondary=exam_students, back_populates="assigned_students")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', role={self.role.value})>"


class Exam(Base):
    """
    Exam model for managing examinations.
    Created by instructors/admins.
    """
    __tablename__ = "exams"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    creator_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Exam configuration
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    total_marks: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    passing_marks: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    exam_type: Mapped[ExamType] = mapped_column(Enum(ExamType), default=ExamType.MCQ, nullable=False)
    
    # Access control
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    access_code: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True)
    
    # Scheduling
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    creator: Mapped["User"] = relationship("User", back_populates="created_exams", foreign_keys="Exam.creator_id")
    questions: Mapped[List["Question"]] = relationship("Question", back_populates="exam", cascade="all, delete-orphan")
    submissions: Mapped[List["Submission"]] = relationship("Submission", back_populates="exam", cascade="all, delete-orphan")
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="exam", cascade="all, delete-orphan")
    assigned_students: Mapped[List["User"]] = relationship("User", secondary=exam_students, back_populates="assigned_exams")
    
    def __repr__(self) -> str:
        return f"<Exam(id={self.id}, title='{self.title}', published={self.is_published})>"


class Question(Base):
    """
    Question model for exam questions.
    Supports both objective (MCQ) and subjective questions.
    """
    __tablename__ = "questions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    exam_id: Mapped[int] = mapped_column(Integer, ForeignKey("exams.id"), nullable=False)
    
    # Question content
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[QuestionType] = mapped_column(Enum(QuestionType), nullable=False)
    
    # For objective questions (MCQs)
    options: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # For subjective questions (AI grading)
    model_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Reference answer for semantic grading
    
    # Scoring
    marks: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    
    # Ordering
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    exam: Mapped["Exam"] = relationship("Exam", back_populates="questions")
    
    def __repr__(self) -> str:
        return f"<Question(id={self.id}, type={self.question_type.value}, marks={self.marks})>"


class Submission(Base):
    """
    Submission model for student exam submissions.
    Stores answers, scores, and AI feedback.
    """
    __tablename__ = "submissions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    exam_id: Mapped[int] = mapped_column(Integer, ForeignKey("exams.id"), nullable=False)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Submission data
    answers: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {question_id: answer}
    
    # Scoring
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # AI Feedback
    ai_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    detailed_feedback: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Per-question feedback
    
    # Status
    is_graded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Timestamps
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    graded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    exam: Mapped["Exam"] = relationship("Exam", back_populates="submissions")
    student: Mapped["User"] = relationship("User", back_populates="submissions")
    
    def __repr__(self) -> str:
        return f"<Submission(id={self.id}, exam_id={self.exam_id}, student_id={self.student_id}, score={self.score})>"
