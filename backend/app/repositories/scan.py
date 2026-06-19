from typing import List
from sqlalchemy.orm import Session
from app.models.scan import Scan
from app.repositories.base import BaseRepository

class ScanRepository(BaseRepository[Scan]):
    def get_by_patient(self, db: Session, *, patient_id: str) -> List[Scan]:
        return db.query(self.model).filter(self.model.patient_id == patient_id).order_by(self.model.created_at.desc()).all()

scan_repo = ScanRepository(Scan)
