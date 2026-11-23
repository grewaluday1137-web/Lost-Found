from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.deps import get_database, get_current_admin
from app.models.report import ModerationStatus, ItemOutcome, ModerationDecision
from app.models.claim import ClaimStatus, ClaimDecision
from app.models.qr_token import QRVerificationRequest, TokenStatus
from app.services.qr_service import issue_verification_token, verify_token_payload
from app.services.matching_engine import evaluate_matches_for_report
from app.services.audit_service import log_audit_event, create_notification

router = APIRouter(prefix="/admin", tags=["Campus Admin"])

@router.get("/overview")
async def get_admin_overview(
    admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    pending_reports = await db.reports.count_documents({"moderation_status": ModerationStatus.SUBMITTED})
    published_reports = await db.reports.count_documents({"moderation_status": ModerationStatus.PUBLISHED})
    pending_claims = await db.claims.count_documents({"status": {"$in": [ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW]}})
    completed_handovers = await db.claims.count_documents({"status": ClaimStatus.COMPLETED})
    total_users = await db.users.count_documents({})

    return {
        "pending_reports_count": pending_reports,
        "published_reports_count": published_reports,
        "pending_claims_count": pending_claims,
        "completed_handovers_count": completed_handovers,
        "total_users_count": total_users
    }

@router.get("/reports")
async def get_admin_reports(
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = {}
    if status:
        query["moderation_status"] = status

    cursor = db.reports.find(query).sort("created_at", -1).skip(skip).limit(limit)
    reports = []
    async for r in cursor:
        r["_id"] = str(r["_id"])
        reports.append(r)
    return reports

@router.post("/reports/{id}/decision")
async def make_report_decision(
    id: str,
    decision: ModerationDecision,
    admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        report = await db.reports.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid report ID")

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    action = decision.action.lower()
    if action not in ["publish", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'publish' or 'reject'")

    new_status = ModerationStatus.PUBLISHED if action == "publish" else ModerationStatus.REJECTED

    await db.reports.update_one(
        {"_id": ObjectId(id)},
        {
            "$set": {
                "moderation_status": new_status,
                "rejection_reason": decision.reason if action == "reject" else None,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    await log_audit_event(
        actor_id=admin["_id"],
        actor_email=admin["email"],
        action=f"REPORT_{action.upper()}ED",
        target_type="report",
        target_id=id,
        reason=decision.reason,
        db=db
    )

    if action == "publish":
        await evaluate_matches_for_report(id, db)
        await create_notification(
            user_id=report["user_id"],
            notif_type="report_approved",
            title="Report Approved & Published",
            message=f"Your report for '{report.get('item_name')}' has been approved and is now active in the campus search catalog.",
            link=f"/reports/{id}",
            db=db
        )
    else:
        await create_notification(
            user_id=report["user_id"],
            notif_type="report_rejected",
            title="Report Not Approved",
            message=f"Your report for '{report.get('item_name')}' was rejected. Reason: {decision.reason or 'Campus policy mismatch'}",
            link=f"/reports/{id}",
            db=db
        )

    return {"message": f"Report successfully {new_status.value}."}

@router.get("/claims")
async def get_admin_claims(
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = {}
    if status:
        query["status"] = status

    cursor = db.claims.find(query).sort("created_at", -1).skip(skip).limit(limit)
    claims = []
    async for c in cursor:
        c["_id"] = str(c["_id"])
        # Enrich with report & claimant info
        report = await db.reports.find_one({"_id": ObjectId(c["found_report_id"])})
        claimant = await db.users.find_one({"_id": ObjectId(c["claimant_id"])})
        if report:
            c["report"] = {
                "id": str(report["_id"]),
                "item_name": report.get("item_name"),
                "category": report.get("category"),
                "custody_location": report.get("custody_location"),
                "image_urls": report.get("image_urls", [])[:1]
            }
        if claimant:
            c["claimant"] = {
                "name": claimant.get("name"),
                "email": claimant.get("email"),
                "campus_id": claimant.get("campus_id"),
                "phone": claimant.get("phone")
            }
        claims.append(c)
    return claims

@router.post("/claims/{id}/decision")
async def make_claim_decision(
    id: str,
    decision: ClaimDecision,
    admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        claim = await db.claims.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid claim ID")

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    action = decision.action.lower()
    if action not in ["approve", "reject", "request_info"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve', 'reject', or 'request_info'")

    report = await db.reports.find_one({"_id": ObjectId(claim["found_report_id"])})

    if action == "approve":
        # Check if another claim is already approved for this item
        existing_approved = await db.claims.find_one({
            "found_report_id": claim["found_report_id"],
            "status": ClaimStatus.APPROVED,
            "_id": {"$ne": ObjectId(id)}
        })
        if existing_approved:
            raise HTTPException(
                status_code=400,
                detail="Another claim is already approved for this found item."
            )

        # Issue single-use QR verification token
        raw_token, qr_url = await issue_verification_token(
            claim_id=id,
            found_report_id=claim["found_report_id"],
            claimant_id=claim["claimant_id"],
            db=db
        )

        await db.claims.update_one(
            {"_id": ObjectId(id)},
            {
                "$set": {
                    "status": ClaimStatus.APPROVED,
                    "admin_id": admin["_id"],
                    "decision_reason": decision.reason,
                    "admin_notes": decision.admin_notes,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

        await log_audit_event(
            actor_id=admin["_id"],
            actor_email=admin["email"],
            action="CLAIM_APPROVED",
            target_type="claim",
            target_id=id,
            reason=decision.reason,
            db=db
        )

        await create_notification(
            user_id=claim["claimant_id"],
            notif_type="claim_approved",
            title="Claim Approved — Collection QR Ready!",
            message=f"Your claim for '{report.get('item_name') if report else 'Item'}' was approved. Open your dashboard to view your Collection QR pass.",
            link=f"/dashboard/claims/{id}",
            db=db
        )

        return {"message": "Claim approved and QR verification token generated.", "claim_status": ClaimStatus.APPROVED}

    elif action == "reject":
        await db.claims.update_one(
            {"_id": ObjectId(id)},
            {
                "$set": {
                    "status": ClaimStatus.REJECTED,
                    "admin_id": admin["_id"],
                    "decision_reason": decision.reason,
                    "admin_notes": decision.admin_notes,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

        # Revert report outcome to OPEN if no other active claims
        other_active = await db.claims.find_one({
            "found_report_id": claim["found_report_id"],
            "status": {"$in": [ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW, ClaimStatus.APPROVED]}
        })
        if not other_active:
            await db.reports.update_one(
                {"_id": ObjectId(claim["found_report_id"])},
                {"$set": {"item_outcome": ItemOutcome.OPEN, "updated_at": datetime.now(timezone.utc)}}
            )

        await log_audit_event(
            actor_id=admin["_id"],
            actor_email=admin["email"],
            action="CLAIM_REJECTED",
            target_type="claim",
            target_id=id,
            reason=decision.reason,
            db=db
        )

        await create_notification(
            user_id=claim["claimant_id"],
            notif_type="claim_rejected",
            title="Claim Rejected",
            message=f"Your claim for '{report.get('item_name') if report else 'Item'}' was not approved. Reason: {decision.reason or 'Insufficient evidence'}",
            link=f"/dashboard/claims/{id}",
            db=db
        )

        return {"message": "Claim rejected.", "claim_status": ClaimStatus.REJECTED}

    elif action == "request_info":
        await db.claims.update_one(
            {"_id": ObjectId(id)},
            {
                "$set": {
                    "status": ClaimStatus.INFO_REQUESTED,
                    "admin_id": admin["_id"],
                    "decision_reason": decision.reason,
                    "admin_notes": decision.admin_notes,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

        await log_audit_event(
            actor_id=admin["_id"],
            actor_email=admin["email"],
            action="CLAIM_INFO_REQUESTED",
            target_type="claim",
            target_id=id,
            reason=decision.reason,
            db=db
        )

        await create_notification(
            user_id=claim["claimant_id"],
            notif_type="claim_info_requested",
            title="More Information Requested on Your Claim",
            message=f"Administrator requested additional details: {decision.reason}",
            link=f"/dashboard/claims/{id}",
            db=db
        )

        return {"message": "Information requested from claimant.", "claim_status": ClaimStatus.INFO_REQUESTED}

@router.post("/qr/verify")
async def verify_qr_token(
    qr_in: QRVerificationRequest,
    admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    result = await verify_token_payload(qr_in.token, db)
    return result

@router.post("/claims/{id}/complete")
async def complete_handover(
    id: str,
    admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        claim = await db.claims.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid claim ID")

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim["status"] != ClaimStatus.APPROVED:
        raise HTTPException(status_code=400, detail=f"Cannot complete handover. Claim status is '{claim['status']}', expected 'approved'.")

    # Mark active verification token as USED
    await db.verification_tokens.update_many(
        {"claim_id": id, "status": TokenStatus.ACTIVE},
        {
            "$set": {
                "status": TokenStatus.USED,
                "redeemed_at": datetime.now(timezone.utc),
                "redeemed_by_admin_id": admin["_id"]
            }
        }
    )

    # Mark Claim as COMPLETED
    await db.claims.update_one(
        {"_id": ObjectId(id)},
        {
            "$set": {
                "status": ClaimStatus.COMPLETED,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    # Mark Report as RETURNED and CLOSED
    report = await db.reports.find_one({"_id": ObjectId(claim["found_report_id"])})
    await db.reports.update_one(
        {"_id": ObjectId(claim["found_report_id"])},
        {
            "$set": {
                "item_outcome": ItemOutcome.RETURNED,
                "moderation_status": ModerationStatus.CLOSED,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    await log_audit_event(
        actor_id=admin["_id"],
        actor_email=admin["email"],
        action="ITEM_HANDOVER_COMPLETED",
        target_type="claim",
        target_id=id,
        metadata={"report_id": claim["found_report_id"]},
        db=db
    )

    # Notify Claimant and Finder
    item_title = report.get("item_name") if report else "Item"
    await create_notification(
        user_id=claim["claimant_id"],
        notif_type="item_returned",
        title="Item Successfully Collected!",
        message=f"Physical handover of '{item_title}' has been verified and recorded by campus administration.",
        link=f"/dashboard/claims/{id}",
        db=db
    )

    if report and report.get("user_id"):
        await create_notification(
            user_id=report["user_id"],
            notif_type="item_returned",
            title="Found Item Successfully Returned to Owner",
            message=f"The item '{item_title}' you reported has been claimed, verified, and returned to its rightful owner. Thank you!",
            link=f"/reports/{claim['found_report_id']}",
            db=db
        )

    return {"message": "Handover successfully completed and recorded.", "status": "completed"}

@router.get("/audit")
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    cursor = db.audit_logs.find({}).sort("timestamp", -1).skip(skip).limit(limit)
    logs = []
    async for entry in cursor:
        entry["_id"] = str(entry["_id"])
        logs.append(entry)
    return logs
