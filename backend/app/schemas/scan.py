from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID
from app.schemas.diagnosis import DiagnosisResponse

class ScanBase(BaseModel):
    patient_id: UUID
    raw_image_url: str
    heatmap_image_url: Optional[str] = None
    detected_type: Optional[str] = None
    type_confidence: Optional[float] = None
    status: Optional[str] = "validating"

class ScanCreate(BaseModel):
    patient_id: UUID

class ScanResponse(ScanBase):
    id: UUID
    uploader_id: Optional[UUID] = None
    created_at: datetime
    diagnosis: Optional[DiagnosisResponse] = None
    top_predictions: Optional[list] = None

    class Config:
        from_attributes = True
