from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class ModelBase(BaseModel):
    name: str
    version: str
    architecture: str  # "EfficientNet", "DenseNet", "ResNet", "ViT"
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    stage: str  # "development", "staging", "production", "archived"
    mlflow_uri: Optional[str] = None

class ModelCreate(ModelBase):
    pass

class ModelResponse(ModelBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ModelPromoteRequest(BaseModel):
    stage: str  # "development", "staging", "production", "archived"
