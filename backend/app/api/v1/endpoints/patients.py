from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Any, List
import random

from app.core.database import get_db
from app.api import deps
from app.schemas import patient as patient_schemas
from app.schemas import scan as scan_schemas
from app.repositories.patient import patient_repo
from app.repositories.scan import scan_repo
from app.models.patient import Patient
from app.models.user import User

router = APIRouter()

def generate_unique_patient_id(db: Session) -> str:
    while True:
        num = random.randint(100000, 999999)
        patient_id = f"MED-{num}"
        # Check uniqueness
        exists = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        if not exists:
            return patient_id

@router.get("/", response_model=List[patient_schemas.PatientResponse])
def read_patients(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: str = Query(None, description="Search by name or patient ID"),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    if search:
        return patient_repo.search(db, query=search)
    return patient_repo.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=patient_schemas.PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    *,
    db: Session = Depends(get_db),
    patient_in: patient_schemas.PatientCreate,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    # Check if patient already registered (optional, can skip or match name + DOB)
    patient_id = generate_unique_patient_id(db)
    db_obj = Patient(
        patient_id=patient_id,
        full_name=patient_in.full_name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        medical_history=patient_in.medical_history
    )
    return patient_repo.create(db, obj_in=db_obj)

@router.get("/{id}", response_model=patient_schemas.PatientResponse)
def read_patient(
    *,
    db: Session = Depends(get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    patient = patient_repo.get(db, id=id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{id}", response_model=patient_schemas.PatientResponse)
def update_patient(
    *,
    db: Session = Depends(get_db),
    id: str,
    patient_in: patient_schemas.PatientUpdate,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    patient = patient_repo.get(db, id=id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient_repo.update(db, db_obj=patient, obj_in=patient_in)

@router.get("/{id}/scans", response_model=List[scan_schemas.ScanResponse])
def read_patient_scans(
    *,
    db: Session = Depends(get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    patient = patient_repo.get(db, id=id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return scan_repo.get_by_patient(db, patient_id=id)

@router.delete("/{id}", response_model=patient_schemas.PatientResponse)
def delete_patient(
    *,
    db: Session = Depends(get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user)  # Allowed for all sandbox users
) -> Any:
    patient = patient_repo.get(db, id=id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient_repo.remove(db, id=id)
