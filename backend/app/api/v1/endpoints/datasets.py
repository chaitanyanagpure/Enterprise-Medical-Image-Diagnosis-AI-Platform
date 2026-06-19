from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Any
import random

from app.core.database import get_db
from app.api import deps
from app.models.user import User
from app.models.audit import AuditLog
from app.models.scan import Scan
from app.models.diagnosis import Diagnosis

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

def get_parent_category(dtype: str) -> str:
    if not dtype:
        return "invalid"
    dtype = dtype.lower()
    if dtype == "chest":
        return "chest"
    elif dtype in ["teeth", "dental"]:
        return "dental"
    elif dtype == "spine":
        return "spine"
    elif dtype in ["hand", "leg", "ankle", "elbow", "knee", "ribs", "skull", "bone"]:
        return "bone"
    return "invalid"

@router.get("/stats")
def get_dataset_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Returns data quality metrics, corrupted counts, duplicates, class distribution and drift reports.
    """
    # 1. Total Images
    total_images = db.query(Scan).count()
    
    # 2. Corrupted Images (status == 'failed')
    corrupted_images = db.query(Scan).filter(Scan.status == "failed").count()
    
    # 3. Duplicate Records (scans with duplicate raw_image_url)
    total_raw = db.query(Scan.raw_image_url).count()
    distinct_raw = db.query(Scan.raw_image_url).distinct().count()
    duplicate_images = max(0, total_raw - distinct_raw)
    
    # 4. Missing Labels (scans that are not completed or have no diagnosis)
    missing_labels = db.query(Scan).outerjoin(Diagnosis).filter(
        (Scan.status != "completed") | (Diagnosis.id == None)
    ).count()
    
    # 5. Data Imbalance Coeff (Max class count / Min class count)
    all_scan_types = db.query(Scan.detected_type).all()
    class_counts = {cat: 0 for cat in ["chest", "bone", "spine", "dental"]}
    for (dtype,) in all_scan_types:
        parent = get_parent_category(dtype)
        if parent in class_counts:
            class_counts[parent] += 1

    counts = [c for c in class_counts.values() if c > 0]
    if len(counts) > 1:
        ratio = max(counts) / min(counts)
        ratio_str = f"{ratio:.2f}"
        if ratio > 2.0:
            ratio_str += " (High)"
        elif ratio > 1.5:
            ratio_str += " (Medium)"
        else:
            ratio_str += " (Low)"
    else:
        ratio_str = "1.00 (Low)"
        
    # 6. Radiography Class Frequencies
    dist = {
        "Chest Pneumonia": 0,
        "Chest Normal": 0,
        "Bone Fracture": 0,
        "Bone Normal": 0,
        "Spine Abnormal": 0,
        "Spine Normal": 0,
        "Dental Abnormal": 0,
        "Dental Normal": 0
    }
    
    scans = db.query(Scan).outerjoin(Diagnosis).all()
    for s in scans:
        parent_type = get_parent_category(s.detected_type)
        cond = s.diagnosis.condition if s.diagnosis else None
        if parent_type == "invalid":
            continue
            
        # Determine if abnormal
        is_abnormal = False
        if cond:
            cond_lower = cond.lower()
            if "normal" not in cond_lower:
                is_abnormal = True
                
        if parent_type == "chest":
            if is_abnormal:
                dist["Chest Pneumonia"] += 1
            else:
                dist["Chest Normal"] += 1
        elif parent_type == "bone":
            if is_abnormal:
                dist["Bone Fracture"] += 1
            else:
                dist["Bone Normal"] += 1
        elif parent_type == "spine":
            if is_abnormal:
                dist["Spine Abnormal"] += 1
            else:
                dist["Spine Normal"] += 1
        elif parent_type == "dental":
            if is_abnormal:
                dist["Dental Abnormal"] += 1
            else:
                dist["Dental Normal"] += 1
                
    class_distribution = [{"label": k, "count": v} for k, v in dist.items()]
    
    # 7. Version History (Simulated DVC version logs read from AuditLog)
    import_logs = db.query(AuditLog).filter(
        AuditLog.action == "IMPORT_DATASET",
        AuditLog.status == "SUCCESS"
    ).order_by(AuditLog.timestamp.desc()).all()
    
    version_history = []
    for i, log in enumerate(import_logs):
        v_num = f"v2.{len(import_logs) - i}"
        details_str = log.details or ""
        notes = "Imported dataset batch archive."
        if "Note: " in details_str:
            notes = details_str.split("Note: ")[-1]
            
        added_by = log.user.email if log.user else "admin@medvision.ai"
        v_count = max(1, total_images - i)
        
        version_history.append({
            "version": v_num,
            "release_date": log.timestamp.strftime("%Y-%m-%d"),
            "total_count": v_count,
            "added_by": added_by,
            "notes": notes
        })
        
    base_count = max(0, total_images - len(import_logs))
    oldest_scan = db.query(Scan).order_by(Scan.created_at.asc()).first()
    base_date = oldest_scan.created_at.strftime("%Y-%m-%d") if oldest_scan else "2026-06-01"
    
    version_history.append({
        "version": "v1.0",
        "release_date": base_date,
        "total_count": base_count,
        "added_by": "system",
        "notes": "Initial base database import of universal clinical scans."
    })
    
    return {
        "summary": {
            "total_images": total_images,
            "corrupted_images": corrupted_images,
            "duplicate_images": duplicate_images,
            "missing_labels": missing_labels,
            "imbalance_ratio": ratio_str
        },
        "class_distribution": class_distribution,
        "version_history": version_history
    }

@router.post("/upload")
async def import_dataset_batch(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    version_note: str = "Imported new dataset batch",
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Imports and registers a dataset batch in S3 (simulated DVC tracking).
    """
    log_audit(db, current_user.id, "IMPORT_DATASET", "SUCCESS", f"File: {file.filename} | Note: {version_note}")
    return {
        "status": "success",
        "registered_version": "v2.1",
        "file_name": file.filename,
        "size_bytes": file.size or 0,
        "message": "Dataset registered and processed for training availability."
    }
