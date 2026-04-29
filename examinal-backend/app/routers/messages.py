"""
In-app messaging endpoints — communication between students, teachers, and admin.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, case

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.message import InAppMessage
from app.models.user import User
from app.models.exam import Exam
from app.schemas.message import MessageCreate, MessageOut, ConversationPreview

router = APIRouter(prefix="/api/messages", tags=["Messages"])


def _enrich_message(msg: InAppMessage, db: Session) -> dict:
    sender = db.query(User).filter(User.id == msg.sender_id).first()
    receiver = db.query(User).filter(User.id == msg.receiver_id).first()
    exam = db.query(Exam).filter(Exam.id == msg.exam_id).first() if msg.exam_id else None
    return {
        "id": msg.id,
        "sender_id": msg.sender_id,
        "receiver_id": msg.receiver_id,
        "exam_id": msg.exam_id,
        "enrollment_request_id": msg.enrollment_request_id,
        "content": msg.content,
        "is_read": msg.is_read,
        "created_at": msg.created_at,
        "sender_name": sender.full_name if sender else None,
        "receiver_name": receiver.full_name if receiver else None,
        "exam_title": exam.title if exam else None,
    }


# ── Send message ──
@router.post("/", status_code=status.HTTP_201_CREATED)
def send_message(payload: MessageCreate, current_user: CurrentUser, db: Session = Depends(get_db)):
    receiver = db.query(User).filter(User.id == payload.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    if receiver.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    msg = InAppMessage(
        sender_id=current_user.id,
        receiver_id=payload.receiver_id,
        exam_id=payload.exam_id,
        content=payload.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _enrich_message(msg, db)


# ── Conversations list ──
@router.get("/conversations")
def get_conversations(current_user: CurrentUser, db: Session = Depends(get_db)):
    """Get list of conversations (grouped by other user) with last message preview."""
    uid = current_user.id

    # Get all messages involving current user
    all_msgs = (
        db.query(InAppMessage)
        .filter(or_(InAppMessage.sender_id == uid, InAppMessage.receiver_id == uid))
        .order_by(InAppMessage.created_at.desc())
        .all()
    )

    # Group by the other user
    conversations = {}
    for msg in all_msgs:
        other_id = msg.receiver_id if msg.sender_id == uid else msg.sender_id
        if other_id not in conversations:
            other_user = db.query(User).filter(User.id == other_id).first()
            unread = (
                db.query(func.count(InAppMessage.id))
                .filter(
                    InAppMessage.sender_id == other_id,
                    InAppMessage.receiver_id == uid,
                    InAppMessage.is_read == False,  # noqa
                )
                .scalar()
            )
            conversations[other_id] = {
                "user_id": other_id,
                "user_name": other_user.full_name if other_user else f"User #{other_id}",
                "user_role": other_user.role if other_user else "unknown",
                "last_message": msg.content[:100],
                "last_message_at": msg.created_at.isoformat(),
                "unread_count": unread or 0,
            }

    return sorted(conversations.values(), key=lambda x: x["last_message_at"], reverse=True)


# ── Conversation thread with specific user ──
@router.get("/conversation/{user_id}")
def get_conversation(user_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    uid = current_user.id
    messages = (
        db.query(InAppMessage)
        .filter(
            or_(
                and_(InAppMessage.sender_id == uid, InAppMessage.receiver_id == user_id),
                and_(InAppMessage.sender_id == user_id, InAppMessage.receiver_id == uid),
            )
        )
        .order_by(InAppMessage.created_at.asc())
        .all()
    )

    # Mark incoming as read
    for msg in messages:
        if msg.receiver_id == uid and not msg.is_read:
            msg.is_read = True
    db.commit()

    return [_enrich_message(m, db) for m in messages]


# ── Unread count ──
@router.get("/unread-count")
def unread_count(current_user: CurrentUser, db: Session = Depends(get_db)):
    count = (
        db.query(func.count(InAppMessage.id))
        .filter(
            InAppMessage.receiver_id == current_user.id,
            InAppMessage.is_read == False,  # noqa
        )
        .scalar()
    )
    return {"unread_count": count or 0}


# ── Mark single message as read ──
@router.patch("/{message_id}/read")
def mark_read(message_id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    msg = db.query(InAppMessage).filter(
        InAppMessage.id == message_id,
        InAppMessage.receiver_id == current_user.id,
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    db.commit()
    return {"status": "read"}
