from datetime import datetime, timezone
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

async def log_audit_event(
    actor_id: str,
    actor_email: str,
    action: str,
    target_type: str,
    target_id: str,
    reason: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    db: AsyncIOMotorDatabase = None
):
    if db is None:
        return
    log_doc = {
        "actor_id": str(actor_id),
        "actor_email": actor_email,
        "action": action,
        "target_type": target_type,
        "target_id": str(target_id),
        "reason": reason,
        "metadata": metadata or {},
        "timestamp": datetime.now(timezone.utc)
    }
    await db.audit_logs.insert_one(log_doc)

async def create_notification(
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    link: Optional[str] = None,
    db: AsyncIOMotorDatabase = None
):
    if db is None:
        return
    notif_doc = {
        "user_id": str(user_id),
        "type": notif_type,
        "title": title,
        "message": message,
        "link": link,
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(notif_doc)
