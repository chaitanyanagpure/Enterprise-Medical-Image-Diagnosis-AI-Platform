from app.core.database import Base, engine
from app.models import User, Patient, Scan, Diagnosis, Model, Report, AuditLog
from app.core.security import get_password_hash
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Check if we have an admin user
    admin_user = db.query(User).filter(User.email == "admin@medvision.ai").first()
    if not admin_user:
        hashed_password = get_password_hash("AdminPassword123!")
        admin = User(
            email="admin@medvision.ai",
            password_hash=hashed_password,
            full_name="MedVision System Administrator",
            role="admin"
        )
        db.add(admin)
        db.commit()
        logger.info("Admin user created (admin@medvision.ai / AdminPassword123!)")
        
    # Seed default model versions if registry is empty
    default_model = db.query(Model).filter(Model.name == "ChestNet-V2").first()
    if not default_model:
        m1 = Model(
            name="ChestNet-V2",
            version="2.1.0",
            architecture="DenseNet",
            accuracy=0.962,
            precision=0.958,
            recall=0.965,
            f1_score=0.961,
            stage="production",
            mlflow_uri="models:/ChestNet-V2/production"
        )
        m2 = Model(
            name="BoneViT",
            version="1.0.4",
            architecture="ViT",
            accuracy=0.950,
            precision=0.945,
            recall=0.952,
            f1_score=0.948,
            stage="production",
            mlflow_uri="models:/BoneViT/production"
        )
        db.add_all([m1, m2])
        db.commit()
        logger.info("Default production models registered in DB")
