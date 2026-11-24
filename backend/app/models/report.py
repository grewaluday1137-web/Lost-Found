from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class ReportType(str, Enum):
    LOST = "lost"
    FOUND = "found"

class ModerationStatus(str, Enum):
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    PUBLISHED = "published"
    REJECTED = "rejected"
    CLOSED = "closed"

class ItemOutcome(str, Enum):
    OPEN = "open"
    CLAIM_PENDING = "claim_pending"
    RETURNED = "returned"
    ARCHIVED = "archived"

class ReportBase(BaseModel):
    item_name: str
    category: str
    description: str
    color: Optional[str] = None
    brand: Optional[str] = None
    location: str
    event_time: datetime
    image_urls: List[str] = []

class LostReportCreate(ReportBase):
    pass

class FoundReportCreate(ReportBase):
    # Sensitive custody details are private and only visible to authorized administrators & report creator
    custody_location: str = "Finder's Possession"

class ReportUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    location: Optional[str] = None
    custody_location: Optional[str] = None

class ReportResponse(ReportBase):
    id: str = Field(alias="_id")
    user_id: str
    type: ReportType
    moderation_status: ModerationStatus
    item_outcome: ItemOutcome
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(populate_by_name=True)

class FoundReportAdminResponse(ReportResponse):
    custody_location: Optional[str] = None

class ModerationDecision(BaseModel):
    action: str = Field(..., description="'publish' or 'reject'")
    reason: Optional[str] = None
