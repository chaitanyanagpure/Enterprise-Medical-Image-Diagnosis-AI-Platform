from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from prometheus_fastapi_instrumentator import Instrumentator
import logging
import os

from app.core.config import settings
from app.core.database import SessionLocal, Base, engine
from app.core.init_db import init_db
from app.api.v1.api import api_router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Universal Medical X-Ray Diagnosis & Explainable AI Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend client URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local static files directory for scans, heatmaps, and reports
static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
os.makedirs(static_path, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Expose API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Initialize Prometheus Instrumentator for System Monitoring
try:
    Instrumentator().instrument(app).expose(app, endpoint="/metrics")
    logger.info("Prometheus Instrumentator initialized.")
except Exception as e:
    logger.warning(f"Could not initialize Prometheus Instrumentator: {e}")

# Database bootstrapping and diagnosis correction on startup
@app.on_event("startup")
def startup_db_init():
    logger.info("Bootstrapping database structures...")
    db = SessionLocal()
    try:
        init_db(db)
        logger.info("Database bootstrapped and seeded successfully.")
        
        # Retroactive database diagnosis correction
        correct_existing_diagnoses(db)
        
    except Exception as e:
        logger.error(f"Failed to bootstrap database: {e}", exc_info=True)
    finally:
        db.close()

def correct_existing_diagnoses(db):
    try:
        from app.models.scan import Scan
        from app.models.diagnosis import Diagnosis
        from app.ml.preprocessing import enhance_medical_image, process_dicom
        from app.ml.classifier import XRayClassifier
        from app.ml.diagnostic_models import diagnostic_engine
        from app.services.storage import storage_service
        import cv2
        import numpy as np
        import hashlib
        import urllib.parse

        classifier = XRayClassifier()
        scans = db.query(Scan).all()
        logger.info(f"Checking {len(scans)} scans for retroactive diagnosis corrections...")
        for scan in scans:
            if not scan.raw_image_url or scan.status != "completed":
                continue
            
            try:
                # 1. Download file bytes
                bucket_name = storage_service.bucket_name
                if scan.raw_image_url.startswith("/static/"):
                    local_base = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
                    file_path = os.path.join(local_base, scan.raw_image_url.replace("/static/", ""))
                    with open(file_path, "rb") as f:
                        file_bytes = f.read()
                else:
                    key = scan.raw_image_url.split(f"/{bucket_name}/")[-1]
                    response = storage_service.s3_client.get_object(Bucket=bucket_name, Key=key)
                    file_bytes = response['Body'].read()
                
                # 2. Extract original filename
                raw_filename = scan.raw_image_url.split("/")[-1]
                if "_" in raw_filename:
                    parts = raw_filename.split("_", 1)
                    filename = urllib.parse.unquote(parts[1]) if len(parts) > 1 else urllib.parse.unquote(raw_filename)
                else:
                    filename = urllib.parse.unquote(raw_filename)
                
                # 3. Decode and preprocess image
                is_dicom = filename.lower().endswith(".dcm")
                metadata = {}
                if is_dicom:
                    img_rgb, metadata = process_dicom(file_bytes)
                else:
                    nparr = np.frombuffer(file_bytes, np.uint8)
                    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if img_bgr is None:
                        continue
                    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
                
                enhanced_img = enhance_medical_image(img_rgb)
                
                # 3.5 Re-predict scan_type to support the new 10 body parts
                pred_type, pred_conf, top_preds, _ = classifier.predict(enhanced_img, filename)
                
                # Check confidence threshold
                if pred_type in ["invalid", "unknown", "Unknown / Low Confidence"] or pred_conf < 0.70:
                    old_type = scan.detected_type
                    scan.detected_type = "Unknown / Low Confidence"
                    scan.type_confidence = pred_conf
                    scan.status = "failed"
                    db.add(scan)
                    if scan.diagnosis:
                        db.delete(scan.diagnosis)
                    db.commit()
                    logger.info(f"Retroactively marked scan {scan.id} as failed due to low classification confidence ({pred_conf:.2f})")
                    continue
                
                # 4. Run updated diagnostics
                results = diagnostic_engine.diagnose(enhanced_img, pred_type, filename, metadata=metadata)
                
                # 5. Update database record
                old_type = scan.detected_type
                scan.detected_type = pred_type
                scan.type_confidence = pred_conf
                db.add(scan)
                
                diag = scan.diagnosis
                if diag:
                    if diag.condition != results["condition"] or diag.severity_level != results["severity_level"] or old_type != pred_type:
                        logger.info(f"Retroactively correcting diagnosis for scan {scan.id} ({filename}): type {old_type} -> {pred_type}, condition {diag.condition} ({diag.severity_level}) -> {results['condition']} ({results['severity_level']})")
                        diag.condition = results["condition"]
                        diag.prediction_confidence = results["prediction_confidence"]
                        diag.severity_level = results["severity_level"]
                        diag.explanation = results["explanation"]
                        db.add(diag)
                else:
                    logger.info(f"Retroactively creating missing diagnosis for scan {scan.id} ({filename}) -> type {pred_type}, {results['condition']} ({results['severity_level']})")
                    diag = Diagnosis(
                        scan_id=scan.id,
                        condition=results["condition"],
                        prediction_confidence=results["prediction_confidence"],
                        severity_level=results["severity_level"],
                        explanation=results["explanation"]
                    )
                    db.add(diag)
                
                db.commit()
            except Exception as ex:
                logger.error(f"Failed to correct scan {scan.id}: {ex}", exc_info=True)
                db.rollback()
    except Exception as e:
        logger.error(f"Failed running retroactive database corrections: {e}", exc_info=True)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "api_docs": "/docs",
        "metrics": "/metrics"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
