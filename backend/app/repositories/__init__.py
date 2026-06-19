from app.repositories.user import user_repo
from app.repositories.patient import patient_repo
from app.repositories.scan import scan_repo
from app.repositories.model import model_repo

__all__ = [
    "user_repo",
    "patient_repo",
    "scan_repo",
    "model_repo"
]
