from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class MatchStatus(str, Enum):
    SUGGESTED = "suggested"
    DISMISSED = "dismissed"
    CONFIRMED = "confirmed"

class MatchCandidate(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    lost_report_id: str
    found_report_id: str
    score: float
    factors: Dict[str, float] = {}
    status: MatchStatus = MatchStatus.SUGGESTED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
