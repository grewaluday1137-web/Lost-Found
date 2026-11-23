import io
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import qrcode
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.config import settings
from app.core.security import generate_high_entropy_token, hash_token
from app.models.qr_token import TokenStatus

def create_qr_code_data_url(data: str) -> str:
    """Generates a base64 encoded PNG data URL for a given string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64_img = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_img}"

async def issue_verification_token(
    claim_id: str,
    found_report_id: str,
    claimant_id: str,
    db: AsyncIOMotorDatabase
) -> Tuple[str, str]:
    """
    Generates a secure, expiring, single-use token.
    Stores the hash in the DB, and returns (plaintext_token, qr_data_url).
    Plaintext token is only delivered to the claimant; server retains hash.
    """
    raw_token = generate_high_entropy_token()
    token_hash = hash_token(raw_token)
    qr_data_url = create_qr_code_data_url(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.QR_TOKEN_EXPIRE_HOURS)

    # Invalidate any prior active tokens for this claim
    await db.verification_tokens.update_many(
        {"claim_id": claim_id, "status": TokenStatus.ACTIVE},
        {"$set": {"status": TokenStatus.REVOKED}}
    )

    token_doc = {
        "claim_id": claim_id,
        "found_report_id": found_report_id,
        "claimant_id": claimant_id,
        "token_hash": token_hash,
        "qr_data_url": qr_data_url,
        "status": TokenStatus.ACTIVE,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
        "redeemed_at": None,
        "redeemed_by_admin_id": None
    }
    await db.verification_tokens.insert_one(token_doc)
    return raw_token, qr_data_url

async def verify_token_payload(raw_token: str, db: AsyncIOMotorDatabase) -> dict:
    """
    Validates a raw token string scanned by an admin.
    Checks existence, active state, expiration, and loads claim/report context.
    """
    token_hash = hash_token(raw_token.strip())
    token_doc = await db.verification_tokens.find_one({"token_hash": token_hash})
    if not token_doc:
        return {"valid": False, "message": "Verification token is invalid or does not exist."}

    # Check status
    if token_doc.get("status") == TokenStatus.USED:
        return {"valid": False, "message": "This verification token has already been redeemed and completed."}
    if token_doc.get("status") == TokenStatus.REVOKED:
        return {"valid": False, "message": "This verification token has been revoked."}
    
    # Check expiration
    expires_at = token_doc.get("expires_at")
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        await db.verification_tokens.update_one(
            {"_id": token_doc["_id"]},
            {"$set": {"status": TokenStatus.EXPIRED}}
        )
        return {"valid": False, "message": "This verification token has expired."}

    # Fetch associated claim and report details
    claim = await db.claims.find_one({"_id": ObjectId(token_doc["claim_id"])})
    report = None
    if claim:
        report = await db.reports.find_one({"_id": ObjectId(claim["found_report_id"])})

    return {
        "valid": True,
        "message": "Token is valid. Ready for administrator handover confirmation.",
        "token_id": str(token_doc["_id"]),
        "claim_id": token_doc["claim_id"],
        "found_report_id": token_doc["found_report_id"],
        "claimant_id": token_doc["claimant_id"],
        "item_name": report.get("item_name") if report else "Unknown Item",
        "category": report.get("category") if report else "Unknown",
        "distinctive_marks": claim.get("distinctive_marks") if claim else None,
        "secret_contents": claim.get("secret_contents") if claim else None,
        "token_status": token_doc.get("status")
    }
