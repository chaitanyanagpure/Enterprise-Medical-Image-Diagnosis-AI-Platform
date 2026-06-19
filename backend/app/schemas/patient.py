from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from uuid import UUID

class PatientBase(BaseModel):
    full_name: str
    date_of_birth: date
    gender: str  # "Male", "Female", "Other"
    medical_history: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None

class PatientResponse(PatientBase):
    id: UUID
    patient_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
