from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class TokenStatus(str, Enum):
    ACTIVE = "active"
    USED = "used"
    EXPIRED = "expired"
    REVOKED = "revoked"

class VerificationTokenInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    claim_id: str
    found_report_id: str
    claimant_id: str
    token_hash: str
    qr_data_url: Optional[str] = None
    status: TokenStatus = TokenStatus.ACTIVE
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    redeemed_at: Optional[datetime] = None
    redeemed_by_admin_id: Optional[str] = None

    class Config:
        populate_by_name = True

class QRVerificationRequest(BaseModel):
    token: str

class HandoverVerificationResponse(BaseModel):
    valid: bool
    message: str
    claim_id: Optional[str] = None
    found_report_id: Optional[str] = None
    claimant_id: Optional[str] = None
    item_name: Optional[str] = None
    category: Optional[str] = None
    distinctive_marks: Optional[str] = None
    secret_contents: Optional[str] = None
    token_status: Optional[str] = None
