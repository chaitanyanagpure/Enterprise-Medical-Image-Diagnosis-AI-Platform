from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.repositories.base import BaseRepository

class PatientRepository(BaseRepository[Patient]):
    def get_by_patient_id(self, db: Session, *, patient_id: str) -> Optional[Patient]:
        return db.query(self.model).filter(self.model.patient_id == patient_id).first()

    def search(self, db: Session, *, query: str) -> List[Patient]:
        if not query:
            return self.get_multi(db)
        return db.query(self.model).filter(
            (self.model.full_name.ilike(f"%{query}%")) | 
            (self.model.patient_id.ilike(f"%{query}%"))
        ).all()

patient_repo = PatientRepository(Patient)
