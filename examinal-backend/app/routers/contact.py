"""
Contact form router with:
  - HTTP 201 Created on submission
  - Server-side in-memory rate limiting (1 submission/IP per 60 seconds)
"""

from collections import defaultdict
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.contact import ContactCreate, ContactMessage as ContactSchema, ContactReplyCreate
from app.services.contact_service import create_contact_message, get_all_contact_messages, reply_to_message
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/contact", tags=["contact"])

# ── In-process rate limit store (IP → last submission timestamp) ──
# Simple enough for a low-traffic form; replace with Redis for production.
_contact_last_submission: dict[str, datetime] = defaultdict(lambda: datetime.min.replace(tzinfo=timezone.utc))
CONTACT_RATE_LIMIT_SECONDS = 60


def _get_client_ip(request: Request) -> str:
    """Return the real client IP, respecting X-Forwarded-For if present."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/", response_model=ContactSchema, status_code=status.HTTP_201_CREATED)
def submit_contact_form(
    msg: ContactCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = _get_client_ip(request)
    now = datetime.now(timezone.utc)
    last = _contact_last_submission[ip]

    elapsed = (now - last).total_seconds()
    if elapsed < CONTACT_RATE_LIMIT_SECONDS:
        wait = int(CONTACT_RATE_LIMIT_SECONDS - elapsed) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {wait} second(s) before submitting another message.",
        )

    _contact_last_submission[ip] = now
    return create_contact_message(db, msg)


@router.get("/", response_model=List[ContactSchema])
def get_contact_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Contact messages accessible by admin only",
        )
    return get_all_contact_messages(db)


@router.post("/{message_id}/reply", response_model=ContactSchema)
def reply_to_contact(
    message_id: int,
    reply_data: ContactReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can reply to messages",
        )

    msg = reply_to_message(db, message_id, reply_data.reply)
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    return msg
