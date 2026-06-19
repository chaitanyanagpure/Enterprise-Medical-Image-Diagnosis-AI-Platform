from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class AuditLogBase(BaseModel):
    action: str
    status: str  # "SUCCESS", "FAILURE"
    details: Optional[str] = None
    ip_address: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    user_id: Optional[UUID] = None

class AuditLogResponse(AuditLogBase):
    id: UUID
    user_id: Optional[UUID] = None
    timestamp: datetime

    class Config:
        from_attributes = True
