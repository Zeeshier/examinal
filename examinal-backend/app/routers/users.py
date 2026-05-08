"""
User management endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import AdminUser, CurrentUser
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.models.message import InAppMessage
from app.models.contact import ContactMessage, ContactReply
from app.models.enrollment_request import EnrollmentRequest
from app.models.course import Course, CourseEnrollment
from app.models.exam import Exam
from app.models.submission import ExamSubmission

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=List[UserOut])
def list_users(
    role: str | None = None,
    skip: int = 0,
    limit: int = 50,
    _admin: AdminUser = None,  # type: ignore
    db: Session = Depends(get_db),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.offset(skip).limit(limit).all()


@router.get("/me/sidebar-badges")
def get_sidebar_badges(current_user: CurrentUser, db: Session = Depends(get_db)):
    badges = {}
    
    # Unread in-app messages (all users)
    unread_messages = db.query(InAppMessage).filter(
        InAppMessage.receiver_id == current_user.id,
        InAppMessage.is_read == False
    ).count()
    if unread_messages > 0:
        badges["messages"] = unread_messages

    if current_user.role == "admin":
        # Unread contact messages
        unread_contacts = db.query(ContactMessage).filter(ContactMessage.is_read == False).count()
        if unread_contacts > 0:
            badges["contact-messages"] = unread_contacts
            
    elif current_user.role == "instructor":
        # Pending enrollment requests for their exams
        pending_requests = db.query(EnrollmentRequest).join(
            Exam, EnrollmentRequest.exam_id == Exam.id
        ).join(
            Course, Exam.course_id == Course.id
        ).filter(
            Course.instructor_id == current_user.id,
            EnrollmentRequest.status == "pending"
        ).count()
        if pending_requests > 0:
            badges["enrollment-requests"] = pending_requests
            
    elif current_user.role == "student":
        # Available exams
        enrolled_course_ids = [
            e.course_id for e in 
            db.query(CourseEnrollment).filter(CourseEnrollment.student_id == current_user.id).all()
        ]
        
        if enrolled_course_ids:
            # Exams in enrolled courses
            available_exams_query = db.query(Exam).filter(
                Exam.course_id.in_(enrolled_course_ids),
                Exam.is_published == True
            )
            
            # Submissions by student
            submitted_exam_ids = [
                s.exam_id for s in
                db.query(ExamSubmission).filter(
                    ExamSubmission.student_id == current_user.id,
                    ExamSubmission.status.in_(["submitted", "graded", "auto_graded"])
                ).all()
            ]
            
            if submitted_exam_ids:
                available_exams_query = available_exams_query.filter(
                    Exam.id.notin_(submitted_exam_ids)
                )
                
            available_exams = available_exams_query.count()
            if available_exams > 0:
                badges["exams"] = available_exams

    return badges


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True)
    # Only admins can change role/active status
    if current_user.role != "admin":
        update_data.pop("role", None)
        update_data.pop("is_active", None)

    for k, v in update_data.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, _admin: AdminUser, db: Session = Depends(get_db)):  # type: ignore
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()