"""
Enrollment request endpoints — students request exam access, teachers approve/reject.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser, InstructorUser
from app.models.enrollment_request import EnrollmentRequest, _generate_access_key
from app.models.exam import Exam
from app.models.message import InAppMessage
from app.models.user import User
from app.schemas.enrollment_request import (
    EnrollmentRequestCreate,
    EnrollmentRequestUpdate,
    EnrollmentRequestOut,
)

router = APIRouter(prefix="/api/enrollment-requests", tags=["Enrollment Requests"])


def _enrich(req: EnrollmentRequest, db: Session, hide_key_for: int | None = None) -> dict:
    """Build an enriched dict from an EnrollmentRequest."""
    student = db.query(User).filter(User.id == req.student_id).first()
    exam = db.query(Exam).filter(Exam.id == req.exam_id).first()
    course = exam.course if exam else None
    teacher = db.query(User).filter(User.id == exam.created_by).first() if exam else None

    data = {
        "id": req.id,
        "exam_id": req.exam_id,
        "student_id": req.student_id,
        "status": req.status,
        "access_key": req.access_key if hide_key_for is None or req.student_id == hide_key_for else None,
        "message": req.message,
        "rejection_reason": req.rejection_reason,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "student_name": student.full_name if student else None,
        "student_email": student.email if student else None,
        "exam_title": exam.title if exam else None,
        "course_title": course.title if course else None,
        "teacher_name": teacher.full_name if teacher else None,
    }
    return data


# ── Student: request enrollment ──
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_request(
    payload: EnrollmentRequestCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can request enrollment")

    exam = db.query(Exam).filter(Exam.id == payload.exam_id, Exam.is_published == True).first()  # noqa
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or not published")

    # Check duplicate
    existing = (
        db.query(EnrollmentRequest)
        .filter(
            EnrollmentRequest.exam_id == payload.exam_id,
            EnrollmentRequest.student_id == current_user.id,
            EnrollmentRequest.status.in_(["pending", "approved"]),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending or approved request for this exam")

    req = EnrollmentRequest(
        exam_id=payload.exam_id,
        student_id=current_user.id,
        message=payload.message,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Send notification message to teacher
    teacher_id = exam.created_by
    db.add(InAppMessage(
        sender_id=current_user.id,
        receiver_id=teacher_id,
        exam_id=exam.id,
        enrollment_request_id=req.id,
        content=f"📋 Enrollment request for \"{exam.title}\". {payload.message or ''}".strip(),
    ))
    db.commit()

    return _enrich(req, db, hide_key_for=current_user.id)


# ── Student: list my requests ──
@router.get("/my")
def my_requests(current_user: CurrentUser, db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students")
    reqs = (
        db.query(EnrollmentRequest)
        .filter(EnrollmentRequest.student_id == current_user.id)
        .order_by(EnrollmentRequest.created_at.desc())
        .all()
    )
    return [_enrich(r, db, hide_key_for=current_user.id) for r in reqs]


# ── Teacher: list requests for their exams ──
@router.get("/exam/{exam_id}")
def exam_requests(exam_id: int, user: InstructorUser, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.created_by != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your exam")

    reqs = (
        db.query(EnrollmentRequest)
        .filter(EnrollmentRequest.exam_id == exam_id)
        .order_by(EnrollmentRequest.created_at.desc())
        .all()
    )
    return [_enrich(r, db) for r in reqs]


# ── Teacher: list ALL pending requests across their exams ──
@router.get("/pending")
def pending_requests(user: InstructorUser, db: Session = Depends(get_db)):
    if user.role == "admin":
        reqs = (
            db.query(EnrollmentRequest)
            .filter(EnrollmentRequest.status == "pending")
            .order_by(EnrollmentRequest.created_at.desc())
            .all()
        )
    else:
        # Get exam IDs owned by this instructor
        exam_ids = [e.id for e in db.query(Exam).filter(Exam.created_by == user.id).all()]
        if not exam_ids:
            return []
        reqs = (
            db.query(EnrollmentRequest)
            .filter(
                EnrollmentRequest.exam_id.in_(exam_ids),
                EnrollmentRequest.status == "pending",
            )
            .order_by(EnrollmentRequest.created_at.desc())
            .all()
        )
    return [_enrich(r, db) for r in reqs]


# ── Teacher: approve or reject ──
@router.patch("/{request_id}")
def update_request(
    request_id: int,
    payload: EnrollmentRequestUpdate,
    user: InstructorUser,
    db: Session = Depends(get_db),
):
    req = db.query(EnrollmentRequest).filter(EnrollmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    exam = db.query(Exam).filter(Exam.id == req.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.created_by != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your exam")

    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request already {req.status}")

    req.status = payload.status

    if payload.status == "approved":
        # Generate unique access key
        key = _generate_access_key()
        req.access_key = key

        # Automatically assign student to the exam as well
        from app.models.exam import ExamAssignment
        existing_assignment = db.query(ExamAssignment).filter(
            ExamAssignment.exam_id == exam.id,
            ExamAssignment.student_id == req.student_id
        ).first()
        if not existing_assignment:
            db.add(ExamAssignment(exam_id=exam.id, student_id=req.student_id))

        # Send key to student via in-app message
        db.add(InAppMessage(
            sender_id=user.id,
            receiver_id=req.student_id,
            exam_id=exam.id,
            enrollment_request_id=req.id,
            content=f"✅ Your enrollment for \"{exam.title}\" has been approved!\n\n🔑 Your secret exam key: **{key}**\n\nUse this key when starting the exam. Do not share it.",
        ))
    elif payload.status == "rejected":
        req.rejection_reason = payload.rejection_reason
        db.add(InAppMessage(
            sender_id=user.id,
            receiver_id=req.student_id,
            exam_id=exam.id,
            enrollment_request_id=req.id,
            content=f"❌ Your enrollment for \"{exam.title}\" has been declined.{' Reason: ' + payload.rejection_reason if payload.rejection_reason else ''}",
        ))

    db.commit()
    db.refresh(req)
    return _enrich(req, db)
