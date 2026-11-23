from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class ClaimStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    INFO_REQUESTED = "info_requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"

class ClaimCreate(BaseModel):
    distinctive_marks: str = Field(..., description="Unique scratches, engravings, decals or flaws")
    secret_contents: Optional[str] = Field(None, description="Hidden compartment contents, wallpaper, or internal items")
    loss_circumstances: str = Field(..., description="Circumstances and timeline of how the item was lost")
    evidence_image_urls: List[str] = Field(default=[], description="Receipts, purchase proof, or photos of the owner with the item")

class ClaimResponse(BaseModel):
    id: str = Field(alias="_id")
    found_report_id: str
    claimant_id: str
    distinctive_marks: str
    secret_contents: Optional[str] = None
    loss_circumstances: str
    evidence_image_urls: List[str] = []
    status: ClaimStatus
    admin_id: Optional[str] = None
    decision_reason: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

class ClaimDecision(BaseModel):
    action: str = Field(..., description="'approve', 'reject', or 'request_info'")
    reason: Optional[str] = None
    admin_notes: Optional[str] = None

class ClaimInfoResponse(BaseModel):
    additional_evidence: str
