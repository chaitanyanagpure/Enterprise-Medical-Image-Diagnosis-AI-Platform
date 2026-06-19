from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
import uuid
from typing import Any, List
import os

from app.core.database import get_db
from app.api import deps
from app.schemas import scan as scan_schemas
from app.models.scan import Scan
from app.models.user import User
from app.models.audit import AuditLog
from app.services.storage import storage_service
from app.services.scan import scan_service

router = APIRouter()

def log_audit(db: Session, user_id: Any, action: str, status_str: str, details: str) -> None:
    try:
        log = AuditLog(
            user_id=user_id,
            action=action,
            status=status_str,
            details=details
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

@router.post("/upload", response_model=scan_schemas.ScanResponse, status_code=status.HTTP_201_CREATED)
async def upload_scan(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    # 1. Parse patient ID UUID
    try:
        patient_uuid = UUID(patient_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Patient ID format.")

    # 2. Generate unique Scan ID
    scan_id = uuid.uuid4()
    
    # Read file bytes
    file_bytes = await file.read()
    
    # Calculate file extension and preserve original filename
    import urllib.parse
    safe_filename = urllib.parse.quote(file.filename)
    relative_path = f"scans/{scan_id}_{safe_filename}"
    
    # 3. Save raw file to storage
    try:
        raw_url = storage_service.save_file(
            file_bytes, 
            relative_path, 
            content_type=file.content_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload raw file: {str(e)}"
        )

    # 4. Create Scan record
    db_scan = Scan(
        id=scan_id,
        patient_id=patient_uuid,
        uploader_id=current_user.id,
        raw_image_url=raw_url,
        status="validating"
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)

    log_audit(db, current_user.id, "UPLOAD_SCAN", "SUCCESS", f"Scan {scan_id} uploaded for patient: {patient_id}")
    return db_scan

@router.post("/{id}/diagnose", response_model=scan_schemas.ScanResponse)
def trigger_diagnosis(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    scan = db.query(Scan).filter(Scan.id == id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    if scan.status in ["diagnosing", "completed"]:
        return scan

    # We read the raw file bytes back from storage (or filesystem fallback) to process
    local_base = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "static")
    raw_filename = scan.raw_image_url.split("/")[-1]
    import urllib.parse
    if "_" in raw_filename:
        parts = raw_filename.split("_", 1)
        filename = urllib.parse.unquote(parts[1]) if len(parts) > 1 else urllib.parse.unquote(raw_filename)
    else:
        filename = urllib.parse.unquote(raw_filename)
    
    try:
        if scan.raw_image_url.startswith("/static/"):
            file_path = os.path.join(local_base, scan.raw_image_url.replace("/static/", ""))
            with open(file_path, "rb") as f:
                file_bytes = f.read()
        else:
            # If using S3/MinIO, download using boto3
            bucket_name = storage_service.bucket_name
            key = scan.raw_image_url.split(f"/{bucket_name}/")[-1]
            response = storage_service.s3_client.get_object(Bucket=bucket_name, Key=key)
            file_bytes = response['Body'].read()
    except Exception as e:
         raise HTTPException(
             status_code=500,
             detail=f"Could not read raw scan file from storage: {str(e)}"
         )

    # Run diagnostic pipeline
    # We can run it synchronously for simple UI integration, or trigger background tasks
    # Let's run it synchronously so the frontend gets the completed diagnosis on response,
    # which is direct and reliable, or we can make it run and return results.
    # Given that it is fast (under 2 seconds with mock logic), sync execution is perfect!
    result = scan_service.process_and_diagnose(db, scan.id, file_bytes, filename)
    if not result.get("success", False):
        raise HTTPException(status_code=400, detail=result.get("message", "Diagnosis pipeline failed."))
    db.refresh(scan)
    return scan

@router.get("/{id}", response_model=scan_schemas.ScanResponse)
def read_scan(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    scan = db.query(Scan).filter(Scan.id == id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

@router.get("/", response_model=List[scan_schemas.ScanResponse])
def read_scans(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    return db.query(Scan).order_by(Scan.created_at.desc()).offset(skip).limit(limit).all()
