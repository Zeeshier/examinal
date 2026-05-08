"""
LoginAttempt model — tracks failed login attempts for rate limiting & lockout.
"""

from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    identifier: Mapped[str] = mapped_column(String(255), nullable=False)  # username or email
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=False)
    attempted_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_login_attempts_identifier", "identifier"),
        Index("ix_login_attempts_ip_address", "ip_address"),
    )
