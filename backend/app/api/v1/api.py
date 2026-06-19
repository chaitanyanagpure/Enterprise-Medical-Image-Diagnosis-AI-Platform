from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    patients,
    scans,
    reports,
    models,
    monitoring,
    audit,
    datasets
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
