import uuid
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base

class Model(Base):
    __tablename__ = "models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    version = Column(String, nullable=False)
    architecture = Column(String, nullable=False)  # "EfficientNet", "DenseNet", "ResNet", "ViT"
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    stage = Column(String, default="development")  # "development", "staging", "production", "archived"
    mlflow_uri = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
