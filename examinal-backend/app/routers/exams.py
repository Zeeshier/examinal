"""
Exam CRUD, publish, assign.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser, InstructorUser
from app.models.exam import Exam, ExamAssignment
from app.models.course import Course, CourseEnrollment
from app.schemas.exam import ExamCreate, ExamUpdate, ExamOut, ExamAssign
from app.schemas.question import QuestionStudentView

router = APIRouter(prefix="/api/exams", tags=["Exams"])


@router.post("/", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
def create_exam(payload: ExamCreate, user: InstructorUser, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.instructor_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to create an exam for this course")
    exam = Exam(**payload.model_dump(), created_by=user.id)
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.get("/browse")
def browse_exams(
    current_user: CurrentUser,
    category: str | None = None,
    date: str | None = None, # YYYY-MM-DD
    db: Session = Depends(get_db)
):
    """Student endpoint to browse all published, current/future exams."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can browse exams")
    
    from datetime import datetime, timezone, timedelta
    from app.models.course import Course
    from app.models.user import User
    
    now = datetime.now(timezone.utc)
    
    q = db.query(Exam).filter(
        Exam.is_published == True,
        (Exam.end_time == None) | (Exam.end_time > now)
    )
    
    if category and category != "All":
        q = q.filter(Exam.category == category)
    
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            from sqlalchemy import func
            q = q.filter(func.date(Exam.start_time) == target_date)
        except ValueError:
            pass
    
    exams = q.order_by(Exam.start_time.is_(None), Exam.start_time.asc()).all()
    
    # Enrich with course and teacher info
    res = []
    for ex in exams:
        course = db.query(Course).filter(Course.id == ex.course_id).first()
        teacher = db.query(User).filter(User.id == ex.created_by).first()
        
        # Check if student already has a pending or approved request
        from app.models.enrollment_request import EnrollmentRequest
        req = (
            db.query(EnrollmentRequest)
            .filter(
                EnrollmentRequest.exam_id == ex.id,
                EnrollmentRequest.student_id == current_user.id
            )
            .order_by(EnrollmentRequest.created_at.desc())
            .first()
        )
        
        res.append({
            "id": ex.id,
            "title": ex.title,
            "description": ex.description,
            "duration_minutes": ex.duration_minutes,
            "total_marks": ex.total_marks,
            "start_time": ex.start_time,
            "end_time": ex.end_time,
            "course_title": course.title if course else "Unknown Course",
            "teacher_name": teacher.full_name if teacher else "Unknown",
            "category": ex.category,
            "enrollment_status": req.status if req else None
        })
    return res

@router.get("/", response_model=List[ExamOut])
def list_exams(
    current_user: CurrentUser,
    course_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Exam)
    if current_user.role == "instructor":
        q = q.filter(Exam.created_by == current_user.id)
    elif current_user.role == "student":
        assigned = db.query(ExamAssignment.exam_id).filter(
            ExamAssignment.student_id == current_user.id
        ).subquery()
        q = q.filter(Exam.id.in_(assigned), Exam.is_published == True)  # noqa: E712
    if course_id:
        q = q.filter(Exam.course_id == course_id)
    return q.all()


@router.get("/{exam_id}", response_model=ExamOut)
def get_exam(exam_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


@router.patch("/{exam_id}", response_model=ExamOut)
def update_exam(exam_id: int, payload: ExamUpdate, user: InstructorUser, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if user.role != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can edit exam details")
    if exam.created_by != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your exam")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(exam, k, v)
    db.commit()
    db.refresh(exam)
    return exam


@router.post("/{exam_id}/publish", response_model=ExamOut)
def publish_exam(exam_id: int, user: InstructorUser, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.created_by != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the exam owner can publish it")
    if not exam.questions:
        raise HTTPException(status_code=400, detail="Add questions before publishing")
    
    current_marks = sum(q.marks for q in exam.questions)
    if current_marks != exam.total_marks:
        raise HTTPException(
            status_code=400, 
            detail=f"Total marks mismatch. Questions sum to {current_marks}, but exam total is {exam.total_marks}. Please adjust question marks."
        )

    exam.is_published = True
    db.commit()
    db.refresh(exam)
    return exam


@router.post("/{exam_id}/unpublish", response_model=ExamOut)
def unpublish_exam(exam_id: int, user: InstructorUser, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.created_by != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the exam owner can unpublish it")
    exam.is_published = False
    db.commit()
    db.refresh(exam)
    return exam


@router.post("/{exam_id}/assign")
def assign_students(exam_id: int, payload: ExamAssign, user: InstructorUser, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.created_by != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the exam owner can assign students")

    created = 0
    for sid in payload.student_ids:
        existing = (
            db.query(ExamAssignment)
            .filter(ExamAssignment.exam_id == exam_id, ExamAssignment.student_id == sid)
            .first()
        )
        if not existing:
            db.add(ExamAssignment(exam_id=exam_id, student_id=sid))
            created += 1
    db.commit()
    return {"assigned": created, "total_requested": len(payload.student_ids)}


@router.post("/{exam_id}/assign-all")
def assign_all_enrolled(exam_id: int, user: InstructorUser, db: Session = Depends(get_db)):
    """Assign all enrolled students of the exam's course."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.created_by != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the exam owner can assign students")

    enrollments = db.query(CourseEnrollment).filter(CourseEnrollment.course_id == exam.course_id).all()
    created = 0
    for enrollment in enrollments:
        existing = (
            db.query(ExamAssignment)
            .filter(ExamAssignment.exam_id == exam_id, ExamAssignment.student_id == enrollment.student_id)
            .first()
        )
        if not existing:
            db.add(ExamAssignment(exam_id=exam_id, student_id=enrollment.student_id))
            created += 1
    db.commit()
    return {"assigned": created, "total_enrolled": len(enrollments)}


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(exam_id: int, user: InstructorUser, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.created_by != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your exam")
    db.delete(exam)
    db.commit()


@router.get("/{exam_id}/questions-student", response_model=List[QuestionStudentView])
def get_exam_questions_student(exam_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    """Return questions without correct answers (student view)."""
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot take exams")
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.is_published == True).first()  # noqa: E712
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found or not published")
    return exam.questions


@router.get("/{exam_id}/assignments")
def get_assigned_students(exam_id: int, user: InstructorUser, db: Session = Depends(get_db)):
    """Instructor endpoint to see who is assigned to an exam."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.created_by != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your exam")

    from app.models.user import User
    from app.models.enrollment_request import EnrollmentRequest

    assignments = db.query(ExamAssignment).filter(ExamAssignment.exam_id == exam_id).all()
    
    res = []
    for a in assignments:
        student = db.query(User).filter(User.id == a.student_id).first()
        req = db.query(EnrollmentRequest).filter(
            EnrollmentRequest.exam_id == exam_id,
            EnrollmentRequest.student_id == a.student_id
        ).order_by(EnrollmentRequest.created_at.desc()).first()

        res.append({
            "student_id": a.student_id,
            "student_name": student.full_name if student else "Unknown",
            "student_email": student.email if student else "Unknown",
            "assigned_at": a.assigned_at,
            "access_key": req.access_key if req else None
        })
    return res