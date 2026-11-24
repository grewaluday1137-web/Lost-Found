from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class AuditLogEntry(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    actor_id: str
    actor_email: str
    action: str
    target_type: str
    target_id: str
    reason: Optional[str] = None
    metadata: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(populate_by_name=True)
