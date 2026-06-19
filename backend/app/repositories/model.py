from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.model import Model
from app.repositories.base import BaseRepository

class ModelRepository(BaseRepository[Model]):
    def get_active_models(self, db: Session) -> List[Model]:
        return db.query(self.model).filter(self.model.stage == "production").all()

    def get_by_name_and_version(self, db: Session, name: str, version: str) -> Optional[Model]:
        return db.query(self.model).filter(self.model.name == name, self.model.version == version).first()

model_repo = ModelRepository(Model)
