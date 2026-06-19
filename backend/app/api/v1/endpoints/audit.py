from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Any, List

from app.core.database import get_db
from app.api import deps
from app.schemas.audit import AuditLogResponse
from app.models.audit import AuditLog
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user)  # Allowed for all sandbox users
) -> Any:
    """
    Retrieve system audit logs.
    """
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
