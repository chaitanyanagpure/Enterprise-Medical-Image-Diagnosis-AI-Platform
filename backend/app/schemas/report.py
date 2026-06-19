from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class ReportResponse(BaseModel):
    id: UUID
    scan_id: UUID
    pdf_url: Optional[str] = None
    csv_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
