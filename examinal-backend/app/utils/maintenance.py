"""
Maintenance tasks: purging expired tokens, old logs, etc.
"""

import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.refresh_token import RefreshToken
from app.models.password_reset_token import PasswordResetToken
from app.models.activity_log import ActivityLog

logger = logging.getLogger(__name__)

def run_cleanup(db: Session):
    """Purge expired data from the database."""
    now = datetime.now(timezone.utc)
    
    try:
        # 1. Purge expired refresh tokens
        rt_count = db.query(RefreshToken).filter(RefreshToken.expires_at < now).delete()
        
        # 2. Purge expired/used password reset tokens
        prt_count = db.query(PasswordResetToken).filter(
            (PasswordResetToken.expires_at < now) | (PasswordResetToken.used == True)
        ).delete()
        
        # 3. (Optional) Purge very old activity logs — e.g., older than 90 days
        # This is a safety measure to keep the audit trail manageable.
        # al_count = db.query(ActivityLog).filter(...)
        
        db.commit()
        
        if rt_count > 0 or prt_count > 0:
            logger.info(
                "Maintenance cleanup complete: purged %d expired refresh tokens, "
                "%d expired password reset tokens.",
                rt_count, prt_count
            )
            
    except Exception as e:
        db.rollback()
        logger.error("Maintenance cleanup failed: %s", e)
