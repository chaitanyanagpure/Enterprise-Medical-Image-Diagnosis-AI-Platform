from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.api import deps
from app.models.scan import Scan
from app.models.user import User
from app.services.report import report_service

router = APIRouter()

@router.get("/{scan_id}/pdf")
def download_pdf_report(
    scan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Response:
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan or not scan.diagnosis:
        raise HTTPException(status_code=404, detail="Diagnostic scan or diagnosis findings not found.")
        
    patient = scan.patient
    uploader_name = scan.uploader.full_name if scan.uploader else "System"
    
    try:
        pdf_bytes = report_service.generate_pdf(scan, scan.diagnosis, patient, uploader_name)
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to compile PDF: {str(e)}")
         
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Report_{patient.patient_id}_{scan.id}.pdf"}
    )

@router.get("/{scan_id}/csv")
def download_csv_report(
    scan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Response:
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan or not scan.diagnosis:
        raise HTTPException(status_code=404, detail="Diagnostic scan or diagnosis findings not found.")
        
    patient = scan.patient
    uploader_name = scan.uploader.full_name if scan.uploader else "System"
    
    try:
        csv_str = report_service.generate_csv(scan, scan.diagnosis, patient, uploader_name)
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to generate CSV: {str(e)}")
         
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Report_{patient.patient_id}_{scan.id}.csv"}
    )
