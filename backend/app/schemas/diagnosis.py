from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class DiagnosisBase(BaseModel):
    condition: str
    prediction_confidence: float
    severity_level: str  # "normal", "low", "medium", "high"
    explanation: Optional[str] = None
    doctor_notes: Optional[str] = None

class DiagnosisCreate(DiagnosisBase):
    scan_id: UUID

class DiagnosisUpdate(BaseModel):
    doctor_notes: Optional[str] = None

class DiagnosisResponse(DiagnosisBase):
    id: UUID
    scan_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
