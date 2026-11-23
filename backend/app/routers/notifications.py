from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.deps import get_database, get_current_user
from app.models.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
async def get_my_notifications(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    cursor = db.notifications.find({"user_id": current_user["_id"]}).sort("created_at", -1).limit(50)
    notifs = []
    async for n in cursor:
        n["_id"] = str(n["_id"])
        notifs.append(n)
    return notifs

@router.patch("/{id}/read")
async def mark_notification_read(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        res = await db.notifications.update_one(
            {"_id": ObjectId(id), "user_id": current_user["_id"]},
            {"$set": {"is_read": True}}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    await db.notifications.update_many(
        {"user_id": current_user["_id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"success": True}
