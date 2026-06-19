import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    uploader_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    raw_image_url = Column(String, nullable=False)
    heatmap_image_url = Column(String, nullable=True)
    detected_type = Column(String, nullable=True)  # "chest", "bone", "spine", "dental", "invalid"
    type_confidence = Column(Float, nullable=True)
    status = Column(String, default="validating")  # "validating", "diagnosing", "completed", "failed"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="scans")
    uploader = relationship("User", back_populates="scans")
    diagnosis = relationship("Diagnosis", uselist=False, back_populates="scan", cascade="all, delete-orphan")
    report = relationship("Report", uselist=False, back_populates="scan", cascade="all, delete-orphan")
