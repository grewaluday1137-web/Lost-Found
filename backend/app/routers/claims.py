from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.deps import get_database, get_current_user
from app.models.report import ModerationStatus, ItemOutcome
from app.models.claim import ClaimCreate, ClaimResponse, ClaimStatus, ClaimInfoResponse
from app.models.qr_token import TokenStatus
from app.services.audit_service import log_audit_event, create_notification

router = APIRouter(prefix="/claims", tags=["Claims"])

@router.post("/reports/{report_id}", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def submit_claim(
    report_id: str,
    claim_in: ClaimCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        report = await db.reports.find_one({"_id": ObjectId(report_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid report ID")

    if not report:
        raise HTTPException(status_code=404, detail="Found item report not found")

    if report.get("type") != "found":
        raise HTTPException(status_code=400, detail="Claims can only be filed against found item reports.")

    if report.get("moderation_status") != ModerationStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Item is not available for claiming.")

    if report.get("item_outcome") == ItemOutcome.RETURNED:
        raise HTTPException(status_code=400, detail="This item has already been verified and returned to its owner.")

    if report.get("user_id") == current_user["_id"]:
        raise HTTPException(status_code=400, detail="You cannot submit a claim for an item you reported as found.")

    # Check for existing active claim by this user for this item
    existing = await db.claims.find_one({
        "found_report_id": report_id,
        "claimant_id": current_user["_id"],
        "status": {"$in": [ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW, ClaimStatus.INFO_REQUESTED, ClaimStatus.APPROVED]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active claim submitted for this item.")

    claim_doc = {
        "found_report_id": report_id,
        "claimant_id": current_user["_id"],
        "distinctive_marks": claim_in.distinctive_marks,
        "secret_contents": claim_in.secret_contents,
        "loss_circumstances": claim_in.loss_circumstances,
        "evidence_image_urls": claim_in.evidence_image_urls,
        "status": ClaimStatus.SUBMITTED,
        "admin_id": None,
        "decision_reason": None,
        "admin_notes": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = await db.claims.insert_one(claim_doc)
    claim_id = str(result.inserted_id)
    claim_doc["_id"] = claim_id

    # Update item outcome to claim_pending if currently open
    await db.reports.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"item_outcome": ItemOutcome.CLAIM_PENDING, "updated_at": datetime.now(timezone.utc)}}
    )

    await log_audit_event(
        actor_id=current_user["_id"],
        actor_email=current_user["email"],
        action="CLAIM_SUBMITTED",
        target_type="claim",
        target_id=claim_id,
        metadata={"report_id": report_id},
        db=db
    )

    await create_notification(
        user_id=current_user["_id"],
        notif_type="claim_submitted",
        title="Ownership Claim Submitted",
        message=f"Your claim for '{report.get('item_name')}' has been submitted for administrative verification.",
        link=f"/dashboard/claims/{claim_id}",
        db=db
    )

    return claim_doc

@router.get("/mine")
async def get_my_claims(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    cursor = db.claims.find({"claimant_id": current_user["_id"]}).sort("created_at", -1)
    claims = []
    async for c in cursor:
        c["_id"] = str(c["_id"])
        # Fetch report summary
        report = await db.reports.find_one({"_id": ObjectId(c["found_report_id"])})
        if report:
            c["report"] = {
                "id": str(report["_id"]),
                "item_name": report.get("item_name"),
                "category": report.get("category"),
                "color": report.get("color"),
                "location": report.get("location"),
                "image_urls": report.get("image_urls", [])[:1]
            }
        claims.append(c)
    return claims

@router.get("/{id}")
async def get_claim_detail(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        claim = await db.claims.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid claim ID")

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    is_claimant = claim["claimant_id"] == current_user["_id"]
    is_admin = current_user.get("role") == "admin"
    if not (is_claimant or is_admin):
        raise HTTPException(status_code=403, detail="Access denied to private claim record.")

    claim["_id"] = str(claim["_id"])
    report = await db.reports.find_one({"_id": ObjectId(claim["found_report_id"])})
    if report:
        claim["report"] = {
            "id": str(report["_id"]),
            "item_name": report.get("item_name"),
            "category": report.get("category"),
            "color": report.get("color"),
            "location": report.get("location"),
            "custody_location": report.get("custody_location") if is_admin else None,
            "image_urls": report.get("image_urls", [])
        }
    return claim

@router.get("/{id}/qr")
async def get_claim_qr(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        claim = await db.claims.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid claim ID")

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim["claimant_id"] != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    if claim["status"] != ClaimStatus.APPROVED:
        raise HTTPException(
            status_code=400,
            detail=f"QR pass is only available for approved claims. Current status: {claim['status']}"
        )

    token_doc = await db.verification_tokens.find_one({
        "claim_id": id,
        "status": TokenStatus.ACTIVE
    })

    if not token_doc:
        raise HTTPException(status_code=404, detail="Active QR token not found for this claim.")

    return {
        "claim_id": id,
        "qr_data_url": token_doc.get("qr_data_url"),
        "expires_at": token_doc.get("expires_at"),
        "status": token_doc.get("status")
    }

@router.post("/{id}/additional-info")
async def provide_additional_claim_info(
    id: str,
    info_in: ClaimInfoResponse,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        claim = await db.claims.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid claim ID")

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim["claimant_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    await db.claims.update_one(
        {"_id": ObjectId(id)},
        {
            "$set": {
                "status": ClaimStatus.UNDER_REVIEW,
                "additional_evidence": info_in.additional_evidence,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    await log_audit_event(
        actor_id=current_user["_id"],
        actor_email=current_user["email"],
        action="CLAIM_ADDITIONAL_INFO_SUBMITTED",
        target_type="claim",
        target_id=id,
        db=db
    )

    return {"message": "Additional information submitted successfully. Claim is now under review."}
