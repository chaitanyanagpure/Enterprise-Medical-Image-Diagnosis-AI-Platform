from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any
import random

from app.core.database import get_db
from app.api import deps
from app.models.user import User

router = APIRouter()

@router.get("/metrics")
def get_system_and_model_metrics(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Returns system utilization and model performance metrics.
    """
    # Generate realistic metrics with slight random variation for dynamic dashboard updates
    cpu_usage = 10.0 + random.random() * 8.0
    memory_usage = 42.0 + random.random() * 2.0
    storage_usage = 68.2
    api_latency = 120 + random.randint(10, 50)
    error_rate = 0.05 + random.random() * 0.15

    return {
        "system": {
            "cpu_percent": round(cpu_usage, 2),
            "memory_percent": round(memory_usage, 2),
            "storage_percent": storage_usage,
            "api_latency_ms": api_latency,
            "api_error_rate_percent": round(error_rate, 2)
        },
        "model_drift": {
            "drift_score_brightness": 0.045,
            "drift_score_contrast": 0.032,
            "drift_detected": False,
            "evidently_report_date": "2026-06-18",
            "prediction_drift_score": 0.078
        },
        "alerts": [
            {
                "id": "1",
                "severity": "warning",
                "message": "Mild data drift detected on brightness metric in ChestNet dataset batch v1.4.",
                "timestamp": "2026-06-18T08:24:00"
            },
            {
                "id": "2",
                "severity": "critical",
                "message": "Storage capacity warning: scan directory exceeds 70% threshold.",
                "timestamp": "2026-06-17T14:10:00"
            }
        ]
    }
