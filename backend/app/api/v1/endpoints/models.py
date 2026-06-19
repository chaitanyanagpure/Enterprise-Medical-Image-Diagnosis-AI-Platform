from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Any, List
from datetime import datetime

from app.core.database import get_db
from app.api import deps
from app.schemas import model as model_schemas
from app.models.model import Model
from app.models.user import User
from app.models.audit import AuditLog

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

@router.get("/", response_model=List[model_schemas.ModelResponse])
def list_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    return db.query(Model).order_by(Model.name.asc(), Model.version.desc()).all()

@router.post("/{id}/promote", response_model=model_schemas.ModelResponse)
def promote_model(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    req: model_schemas.ModelPromoteRequest,
    current_user: User = Depends(deps.get_current_user)  # Allowed for all sandbox users
) -> Any:
    model = db.query(Model).filter(Model.id == id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    old_stage = model.stage
    new_stage = req.stage.lower()

    if new_stage not in ["development", "staging", "production", "archived"]:
        raise HTTPException(status_code=400, detail="Invalid target stage.")

    # If promoting to production, archiving other production models of the same name
    if new_stage == "production":
        others = db.query(Model).filter(
            Model.name == model.name,
            Model.id != model.id,
            Model.stage == "production"
        ).all()
        for other in others:
            other.stage = "archived"
            log_audit(db, current_user.id, "PROMOTE_MODEL", "SUCCESS", f"Auto-demoted model {other.name} v{other.version} to archived because v{model.version} is now in production.")

    model.stage = new_stage
    db.commit()
    db.refresh(model)

    log_audit(db, current_user.id, "PROMOTE_MODEL", "SUCCESS", f"Model {model.name} v{model.version} promoted from {old_stage} to {new_stage}")
    return model

@router.get("/experiments")
def get_mlflow_experiments(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Returns simulated MLflow experiment comparison data.
    """
    return [
        {
            "run_id": "mlf_run_9843",
            "experiment_id": "EXP-01",
            "name": "Chest-DenseNet-Infiltration",
            "dataset_version": "v1.2",
            "architecture": "DenseNet-121",
            "hyperparams": {"lr": 1e-4, "batch_size": 32, "optimizer": "AdamW"},
            "metrics": {"accuracy": 0.962, "precision": 0.958, "recall": 0.965, "f1_score": 0.961},
            "training_time_secs": 14200,
            "created_at": "2026-06-12T10:14:00"
        },
        {
            "run_id": "mlf_run_9234",
            "experiment_id": "EXP-01",
            "name": "Chest-EfficientNet-Lobar",
            "dataset_version": "v1.2",
            "architecture": "EfficientNet-B4",
            "hyperparams": {"lr": 3e-4, "batch_size": 16, "optimizer": "Adam"},
            "metrics": {"accuracy": 0.945, "precision": 0.940, "recall": 0.951, "f1_score": 0.945},
            "training_time_secs": 18500,
            "created_at": "2026-06-10T14:32:00"
        },
        {
            "run_id": "mlf_run_8741",
            "experiment_id": "EXP-02",
            "name": "Bone-ResNet-Fracture",
            "dataset_version": "v2.0",
            "architecture": "ResNet-50",
            "hyperparams": {"lr": 1e-4, "batch_size": 32, "optimizer": "AdamW"},
            "metrics": {"accuracy": 0.931, "precision": 0.925, "recall": 0.938, "f1_score": 0.931},
            "training_time_secs": 9400,
            "created_at": "2026-06-08T09:12:00"
        },
        {
            "run_id": "mlf_run_7491",
            "experiment_id": "EXP-03",
            "name": "Dental-ViT-Cavities",
            "dataset_version": "v1.0",
            "architecture": "ViT-B/16",
            "hyperparams": {"lr": 5e-5, "batch_size": 64, "optimizer": "AdamW"},
            "metrics": {"accuracy": 0.912, "precision": 0.908, "recall": 0.915, "f1_score": 0.911},
            "training_time_secs": 22400,
            "created_at": "2026-06-05T16:40:00"
        }
    ]

@router.post("/train/trigger")
def trigger_retraining_pipeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Triggers simulated retraining pipeline. Logs audit logs.
    """
    log_audit(db, current_user.id, "TRIGGER_PIPELINE", "SUCCESS", "MLOps retraining pipeline triggered manually by Admin.")
    return {
        "status": "triggered",
        "pipeline_run_id": "pipe_run_38402",
        "message": "Retraining job submitted to task runner successfully."
    }
