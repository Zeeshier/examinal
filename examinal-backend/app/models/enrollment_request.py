"""
Enrollment request model — students request access to exams, teachers approve/reject.
"""

import secrets
from datetime import datetime, timezone

from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _generate_access_key() -> str:
    """Generate a unique 8-char alphanumeric access key."""
    return secrets.token_urlsafe(6)[:8].upper()


class EnrollmentRequest(Base):
    __tablename__ = "enrollment_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(Integer, ForeignKey("exams.id"), nullable=False)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | approved | rejected
    access_key: Mapped[str | None] = mapped_column(String(20), nullable=True)  # generated on approval
    message: Mapped[str | None] = mapped_column(Text, nullable=True)  # student's request note
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    exam = relationship("Exam", back_populates="enrollment_requests")
    student = relationship("User", backref="enrollment_requests")
    messages = relationship("InAppMessage", back_populates="enrollment_request", cascade="all, delete-orphan")
