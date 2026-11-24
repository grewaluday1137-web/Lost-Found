from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class NotificationType(str):
    REPORT_APPROVED = "report_approved"
    REPORT_REJECTED = "report_rejected"
    MATCH_FOUND = "match_found"
    CLAIM_SUBMITTED = "claim_submitted"
    CLAIM_UNDER_REVIEW = "claim_under_review"
    CLAIM_INFO_REQUESTED = "claim_info_requested"
    CLAIM_APPROVED = "claim_approved"
    CLAIM_REJECTED = "claim_rejected"
    ITEM_RETURNED = "item_returned"

class NotificationResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool = False
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True)
