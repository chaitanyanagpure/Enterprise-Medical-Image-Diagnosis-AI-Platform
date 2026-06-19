import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = os.getenv("APP_NAME", "MedVision AI")
    API_V1_STR: str = "/api/v1"
    
    # DB
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://medvision_user:medvision_password@localhost:5432/medvision_db"
    )
    
    # JWT & Security
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET", 
        "428f52baac0a9a4b37063f9ebbc7922d56a31c5b8cd7ef9733076136be268fa3"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # S3 Storage / MinIO
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "medvision_admin")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "medvision_admin_password")
    S3_ENDPOINT_URL: str = os.getenv("S3_ENDPOINT_URL", "http://localhost:9000")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "medvision-scans")
    
    # MLflow
    MLFLOW_TRACKING_URI: str = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
    
    # App
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

settings = Settings()
