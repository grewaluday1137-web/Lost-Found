from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.config import settings
from app.core.deps import get_database, get_current_user, get_optional_user
from app.models.report import (
    ReportType, ModerationStatus, ItemOutcome,
    LostReportCreate, FoundReportCreate, ReportResponse, FoundReportAdminResponse
)
from app.services.storage_provider import get_storage_provider
from app.services.matching_engine import evaluate_matches_for_report
from app.services.audit_service import log_audit_event, create_notification

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    storage = get_storage_provider()
    url = await storage.save_file(file, subfolder="reports")
    return {"url": url}

@router.post("/lost", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def report_lost_item(
    report_in: LostReportCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    initial_moderation = ModerationStatus.PUBLISHED if settings.AUTO_APPROVE_REPORTS else ModerationStatus.SUBMITTED
    report_doc = {
        "user_id": current_user["_id"],
        "type": ReportType.LOST,
        "item_name": report_in.item_name,
        "category": report_in.category,
        "description": report_in.description,
        "color": report_in.color,
        "brand": report_in.brand,
        "location": report_in.location,
        "event_time": report_in.event_time,
        "image_urls": report_in.image_urls,
        "custody_location": None,
        "moderation_status": initial_moderation,
        "item_outcome": ItemOutcome.OPEN,
        "rejection_reason": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = await db.reports.insert_one(report_doc)
    report_id = str(result.inserted_id)
    report_doc["_id"] = report_id

    await log_audit_event(
        actor_id=current_user["_id"],
        actor_email=current_user["email"],
        action="LOST_REPORT_SUBMITTED",
        target_type="report",
        target_id=report_id,
        db=db
    )

    if settings.AUTO_APPROVE_REPORTS:
        await evaluate_matches_for_report(report_id, db)
    else:
        await create_notification(
            user_id=current_user["_id"],
            notif_type="report_submitted",
            title="Lost Item Report Submitted",
            message=f"Your lost report for '{report_in.item_name}' is currently in review by campus administrators.",
            link=f"/reports/{report_id}",
            db=db
        )

    return report_doc

@router.post("/found", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def report_found_item(
    report_in: FoundReportCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    initial_moderation = ModerationStatus.PUBLISHED if settings.AUTO_APPROVE_REPORTS else ModerationStatus.SUBMITTED
    report_doc = {
        "user_id": current_user["_id"],
        "type": ReportType.FOUND,
        "item_name": report_in.item_name,
        "category": report_in.category,
        "description": report_in.description,
        "color": report_in.color,
        "brand": report_in.brand,
        "location": report_in.location,
        "event_time": report_in.event_time,
        "image_urls": report_in.image_urls,
        "custody_location": report_in.custody_location,
        "moderation_status": initial_moderation,
        "item_outcome": ItemOutcome.OPEN,
        "rejection_reason": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = await db.reports.insert_one(report_doc)
    report_id = str(result.inserted_id)
    report_doc["_id"] = report_id

    await log_audit_event(
        actor_id=current_user["_id"],
        actor_email=current_user["email"],
        action="FOUND_REPORT_SUBMITTED",
        target_type="report",
        target_id=report_id,
        db=db
    )

    if settings.AUTO_APPROVE_REPORTS:
        await evaluate_matches_for_report(report_id, db)
    else:
        await create_notification(
            user_id=current_user["_id"],
            notif_type="report_submitted",
            title="Found Item Report Submitted",
            message=f"Thank you for reporting found property ('{report_in.item_name}'). It is now pending administrator review.",
            link=f"/reports/{report_id}",
            db=db
        )

    # Sanitize custody location for regular response
    report_doc["custody_location"] = None
    return report_doc

@router.get("", response_model=List[ReportResponse])
async def search_reports(
    type: Optional[ReportType] = None,
    category: Optional[str] = None,
    color: Optional[str] = None,
    location: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    query: dict = {
        "moderation_status": ModerationStatus.PUBLISHED,
        "item_outcome": {"$ne": ItemOutcome.ARCHIVED}
    }

    if type:
        query["type"] = type
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if color:
        query["color"] = {"$regex": color, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if q:
        query["$text"] = {"$search": q}

    cursor = db.reports.find(query).sort("created_at", -1).skip(skip).limit(limit)
    reports = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        # Strictly sanitize custody location for public catalog
        doc["custody_location"] = None
        reports.append(doc)
    return reports

@router.get("/mine", response_model=List[ReportResponse])
async def get_my_reports(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    cursor = db.reports.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    reports = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        reports.append(doc)
    return reports

@router.get("/{id}")
async def get_report_detail(
    id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    try:
        report = await db.reports.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid report ID format")

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report["_id"] = str(report["_id"])

    # Access control: Unapproved reports only visible to owner or admin
    is_owner = current_user and current_user.get("_id") == report["user_id"]
    is_admin = current_user and current_user.get("role") == "admin"

    if report.get("moderation_status") != ModerationStatus.PUBLISHED and not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Report is under moderation and not publicly available.")

    # Only admin or owner can see exact custody location
    if not (is_admin or is_owner):
        report["custody_location"] = None

    return report

@router.get("/{id}/matches")
async def get_report_candidate_matches(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        report = await db.reports.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid report ID format")

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Only report owner or admin can view match candidates
    if report["user_id"] != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Permission denied to view matches for this report.")

    cursor = db.matches.find({
        "$or": [{"lost_report_id": id}, {"found_report_id": id}]
    }).sort("score", -1)

    matches = []
    async for m in cursor:
        m["_id"] = str(m["_id"])
        # Fetch opposite report summary
        opp_id = m["found_report_id"] if report["type"] == "lost" else m["lost_report_id"]
        opp_report = await db.reports.find_one({"_id": ObjectId(opp_id)})
        if opp_report:
            m["target_report"] = {
                "id": str(opp_report["_id"]),
                "item_name": opp_report.get("item_name"),
                "category": opp_report.get("category"),
                "color": opp_report.get("color"),
                "location": opp_report.get("location"),
                "event_time": opp_report.get("event_time"),
                "image_urls": opp_report.get("image_urls", [])[:1]
            }
        matches.append(m)
    return matches
