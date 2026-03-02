"""
Student Management Endpoints
Teachers can create, list, and delete student accounts.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr

from app.db.session import get_db
from app.api.deps import get_current_user, require_role
from app.models.models import User, UserRole
from app.core.security import get_password_hash
from app.schemas.auth import UserResponse

router = APIRouter()


# --- Schemas ---

class StudentCreate(BaseModel):
    """Schema for teacher creating a student."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class StudentListResponse(BaseModel):
    """Schema for student in list."""
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: str  # ISO format string

    class Config:
        from_attributes = True


# --- Endpoints ---

@router.post("/", response_model=StudentListResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreate,
    current_user: User = Depends(require_role(UserRole.INSTRUCTOR, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Teacher creates a new student account."""
    # Check duplicates
    if db.query(User).filter(User.username == student_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == student_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    student = User(
        username=student_data.username,
        email=student_data.email,
        hashed_password=get_password_hash(student_data.password),
        role=UserRole.STUDENT,
        full_name=student_data.full_name,
        created_by_id=current_user.id
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    return StudentListResponse(
        id=student.id,
        username=student.username,
        email=student.email,
        full_name=student.full_name,
        is_active=student.is_active,
        created_at=student.created_at.isoformat()
    )


@router.get("/", response_model=List[StudentListResponse])
async def list_students(
    current_user: User = Depends(require_role(UserRole.INSTRUCTOR, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """List all students created by this teacher."""
    students = db.query(User).filter(
        User.role == UserRole.STUDENT,
        User.created_by_id == current_user.id
    ).order_by(User.created_at.desc()).all()

    return [
        StudentListResponse(
            id=s.id,
            username=s.username,
            email=s.email,
            full_name=s.full_name,
            is_active=s.is_active,
            created_at=s.created_at.isoformat()
        )
        for s in students
    ]


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    current_user: User = Depends(require_role(UserRole.INSTRUCTOR, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Delete a student account (only if created by this teacher)."""
    student = db.query(User).filter(
        User.id == student_id,
        User.role == UserRole.STUDENT,
        User.created_by_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()
