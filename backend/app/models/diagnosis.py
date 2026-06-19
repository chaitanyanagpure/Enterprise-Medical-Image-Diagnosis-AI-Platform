import uuid
from sqlalchemy import Column, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"), unique=True, nullable=False)
    condition = Column(String, nullable=False)  # e.g., "Pneumonia", "Fracture", "Normal"
    prediction_confidence = Column(Float, nullable=False)
    severity_level = Column(String, nullable=False)  # "normal", "low", "medium", "high"
    explanation = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    scan = relationship("Scan", back_populates="diagnosis")
