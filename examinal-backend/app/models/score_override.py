from datetime import datetime, timezone

from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ScoreOverride(Base):
    """Audit trail for every manual score change (remark/override)."""
    __tablename__ = "score_overrides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    answer_id: Mapped[int] = mapped_column(Integer, ForeignKey("answer_responses.id"), nullable=False)
    submission_id: Mapped[int] = mapped_column(Integer, ForeignKey("exam_submissions.id"), nullable=False)
    reviewer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    old_score: Mapped[float] = mapped_column(Float, nullable=False)
    new_score: Mapped[float] = mapped_column(Float, nullable=False)
    old_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    old_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    reviewer = relationship("User")
