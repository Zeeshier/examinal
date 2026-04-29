"""
In-app messaging model — communication between students, teachers, and admin.
"""

from datetime import datetime, timezone

from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InAppMessage(Base):
    __tablename__ = "in_app_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    exam_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("exams.id"), nullable=True)
    enrollment_request_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("enrollment_requests.id"), nullable=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_messages")
    exam = relationship("Exam", back_populates="messages")
    enrollment_request = relationship("EnrollmentRequest", back_populates="messages")
