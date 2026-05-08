"""
Course CRUD + enrollment — with course ownership enforcement.

Ownership policy:
  - Admin: full access to all courses (read, write, enroll, delete)
  - Instructor: only their own courses
  - Student: enrolled courses only (read-only)
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.dependencies import CurrentUser, InstructorUser
from app.models.course import Course, CourseEnrollment
from app.models.user import User
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseOut,
    EnrollmentCreate, EnrollmentOut,
)

router = APIRouter(prefix="/api/courses", tags=["Courses"])


# ── Helper: resolve course + enforce ownership ─────────────────────────────────
def _get_course_or_403(course_id: int, user: User, db: Session) -> Course:
    """Fetch a course and raise 403 if the user doesn't own it (unless admin)."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if user.role == "instructor" and course.instructor_id != user.id:
        raise HTTPException(status_code=403, detail="Not your course")
    return course


# ═══════════════════════════════════════════
#  COURSE CRUD
# ═══════════════════════════════════════════


@router.post("/", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, user: InstructorUser, db: Session = Depends(get_db)):
    existing = db.query(Course).filter(Course.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")
    course = Course(**payload.model_dump(), instructor_id=user.id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/", response_model=List[CourseOut])
def list_courses(current_user: CurrentUser, db: Session = Depends(get_db)):
    if current_user.role == "admin":
        return db.query(Course).all()
    if current_user.role == "instructor":
        return db.query(Course).filter(Course.instructor_id == current_user.id).all()
    # student — enrolled courses only
    enrollments = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == current_user.id
    ).all()
    course_ids = [e.course_id for e in enrollments]
    if not course_ids:
        return []
    return db.query(Course).filter(Course.id.in_(course_ids)).all()


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role == "admin":
        return course

    if current_user.role == "instructor":
        if course.instructor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this course")
        return course

    # student — must be enrolled
    enrolled = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.student_id == current_user.id,
    ).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    return course


@router.patch("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    user: CurrentUser,  # admin OR instructor allowed
    db: Session = Depends(get_db),
):
    if user.role not in ("admin", "instructor"):
        raise HTTPException(status_code=403, detail="Only instructors or admins can edit courses")
    course = _get_course_or_403(course_id, user, db)

    # Check for duplicate code if code is being updated
    if payload.code and payload.code != course.code:
        existing = db.query(Course).filter(Course.code == payload.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Course code already exists")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(course, k, v)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, user: CurrentUser, db: Session = Depends(get_db)):
    if user.role not in ("admin", "instructor"):
        raise HTTPException(status_code=403, detail="Not authorized")
    course = _get_course_or_403(course_id, user, db)
    db.delete(course)
    db.commit()


# ═══════════════════════════════════════════
#  STUDENT SEARCH (for enrollment UI)
# ═══════════════════════════════════════════


@router.get("/{course_id}/search-students")
def search_students(
    course_id: int,
    q: str = Query(default="", min_length=0, description="Search by name, email, or username"),
    user: InstructorUser = None,  # InstructorUser is Annotated[User, Depends(...)]
    db: Session = Depends(get_db),
):
    """Search for students to enroll. Returns students NOT already enrolled."""
    _get_course_or_403(course_id, user, db)

    # Get already enrolled student IDs
    enrolled_ids = [
        e.student_id for e in
        db.query(CourseEnrollment.student_id)
        .filter(CourseEnrollment.course_id == course_id)
        .all()
    ]

    query = db.query(User).filter(User.role == "student", User.is_active == True)  # noqa: E712

    if enrolled_ids:
        query = query.filter(User.id.notin_(enrolled_ids))

    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search),
                User.email.ilike(search),
                User.username.ilike(search),
            )
        )

    students = query.limit(20).all()
    return [
        {"id": s.id, "full_name": s.full_name, "email": s.email, "username": s.username}
        for s in students
    ]


# ═══════════════════════════════════════════
#  ENROLLMENT
# ═══════════════════════════════════════════


def _resolve_student(payload: EnrollmentCreate, db: Session) -> User:
    """Find the student by ID, username, or email."""
    student = None

    if payload.student_id:
        student = db.query(User).filter(
            User.id == payload.student_id, User.role == "student",
        ).first()

    if not student and payload.username:
        student = db.query(User).filter(
            User.username == payload.username, User.role == "student",
        ).first()

    if not student and payload.email:
        student = db.query(User).filter(
            User.email == payload.email, User.role == "student",
        ).first()

    # Last resort: maybe they typed a username into the ID field
    if not student and payload.student_id:
        student = db.query(User).filter(
            User.username == str(payload.student_id), User.role == "student",
        ).first()

    return student


@router.post("/{course_id}/enroll", status_code=201)
def enroll_student(
    course_id: int,
    payload: EnrollmentCreate,
    user: InstructorUser,       # properly injected
    db: Session = Depends(get_db),
):
    """Enroll a student. Only the course owner or admin can do this."""
    _get_course_or_403(course_id, user, db)

    student = _resolve_student(payload, db)
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found. Search by name, email, or username using the search field.",
        )

    existing = (
        db.query(CourseEnrollment)
        .filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.student_id == student.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"{student.full_name} is already enrolled")

    enrollment = CourseEnrollment(course_id=course_id, student_id=student.id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return {
        "id": enrollment.id,
        "course_id": enrollment.course_id,
        "student_id": enrollment.student_id,
        "enrolled_at": enrollment.enrolled_at.isoformat(),
        "student_name": student.full_name,
        "student_email": student.email,
        "student_username": student.username,
    }


@router.get("/{course_id}/students")
def list_enrolled(
    course_id: int,
    user: InstructorUser,       # properly injected — admin or instructor only
    db: Session = Depends(get_db),
):
    """List enrolled students. Only the course owner or admin can view the roster."""
    _get_course_or_403(course_id, user, db)

    enrollments = (
        db.query(CourseEnrollment)
        .filter(CourseEnrollment.course_id == course_id)
        .all()
    )

    result = []
    for e in enrollments:
        student = db.query(User).filter(User.id == e.student_id).first()
        result.append({
            "id": e.id,
            "course_id": e.course_id,
            "student_id": e.student_id,
            "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
            "student_name": student.full_name if student else f"User #{e.student_id}",
            "student_email": student.email if student else "",
            "student_username": student.username if student else "",
        })
    return result


@router.delete("/{course_id}/enroll/{student_id}", status_code=204)
def unenroll_student(
    course_id: int,
    student_id: int,
    user: InstructorUser,       # properly injected
    db: Session = Depends(get_db),
):
    """Unenroll a student. Only the course owner or admin can do this."""
    _get_course_or_403(course_id, user, db)

    enrollment = (
        db.query(CourseEnrollment)
        .filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.student_id == student_id,
        )
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()