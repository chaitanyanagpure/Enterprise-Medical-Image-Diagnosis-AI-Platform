from sqlalchemy.orm import Session
from uuid import UUID
import cv2
import numpy as np
import io
from PIL import Image
from typing import Optional, Dict, Any
import logging

from app.models.scan import Scan
from app.models.diagnosis import Diagnosis
from app.models.audit import AuditLog
from app.services.storage import storage_service
from app.ml import (
    validate_image_quality,
    process_dicom,
    enhance_medical_image,
    XRayClassifier,
    diagnostic_engine,
    GradCAMService
)

logger = logging.getLogger(__name__)

class ScanService:
    def __init__(self):
        self.classifier = XRayClassifier()

    def process_and_diagnose(
        self, db: Session, scan_id: UUID, file_bytes: bytes, filename: str
    ) -> Dict[str, Any]:
        """
        Runs the full multi-stage AI diagnostic pipeline:
        1. Validation & Preprocessing (DICOM or standard image format)
        2. Radiography Category Classification
        3. Specialized Disease Prediction
        4. Grad-CAM heat-map computation
        5. Storage & Database Persistence
        """
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
             raise ValueError("Scan record not found in database.")

        try:
            # 1. Check if DICOM
            is_dicom = filename.lower().endswith(".dcm")
            metadata = {}
            
            if is_dicom:
                logger.info(f"Processing DICOM file: {filename}")
                img_rgb, metadata = process_dicom(file_bytes)
            else:
                logger.info(f"Processing standard image: {filename}")
                # Convert bytes to numpy array
                nparr = np.frombuffer(file_bytes, np.uint8)
                img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img_bgr is None:
                     raise ValueError("Uploaded image file is corrupted or unreadable.")
                img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

            # 2. Quality checks
            is_valid, msg = validate_image_quality(img_rgb)
            if not is_valid:
                scan.status = "failed"
                db.commit()
                # Log audit trail
                self._log_audit(db, scan.uploader_id, "DIAGNOSE", "FAILURE", f"Scan {scan.id} failed quality checks: {msg}")
                return {"success": False, "message": msg}

            # Apply contrast enhancement (CLAHE)
            enhanced_img = enhance_medical_image(img_rgb)

            # 3. Categorize radiography type
            scan.status = "diagnosing"
            db.commit()

            category, type_conf, top_preds, input_tensor = self.classifier.predict(enhanced_img, filename)
            scan.detected_type = category
            scan.type_confidence = type_conf
            scan.top_predictions = top_preds
            
            if category in ["invalid", "unknown", "Unknown / Low Confidence"] or type_conf < 0.70:
                scan.detected_type = "Unknown / Low Confidence"
                scan.status = "failed"
                db.commit()
                self._log_audit(db, scan.uploader_id, "DIAGNOSE", "FAILURE", f"Scan {scan.id} rejected. Low classification confidence ({type_conf:.2f}) or unknown body part.")
                return {"success": False, "message": "Uncertain body-part classification or unknown X-ray type. Diagnostic analysis aborted."}

            # 4. Route to specialized model
            results = diagnostic_engine.diagnose(enhanced_img, category, filename, metadata=metadata)

            # 5. Generate Grad-CAM attention overlay
            heatmap_rgb = GradCAMService.generate_heatmap(
                enhanced_img, category, results["condition"], filename
            )

            # 6. Save heatmap overlay file to storage
            # Convert heatmap numpy array back to bytes
            heatmap_pil = Image.fromarray(heatmap_rgb)
            buffer = io.BytesIO()
            heatmap_pil.save(buffer, format="PNG")
            heatmap_bytes = buffer.getvalue()
            
            heatmap_url = storage_service.save_file(
                heatmap_bytes, 
                f"heatmaps/{scan.id}.png", 
                content_type="image/png"
            )
            
            # Save raw image if it was uploaded as DICOM (save converted PNG)
            if is_dicom:
                raw_pil = Image.fromarray(img_rgb)
                raw_buf = io.BytesIO()
                raw_pil.save(raw_buf, format="PNG")
                raw_bytes = raw_buf.getvalue()
                
                raw_url = storage_service.save_file(
                    raw_bytes,
                    f"scans/{scan.id}.png",
                    content_type="image/png"
                )
                scan.raw_image_url = raw_url

            # 7. Write results to database
            scan.heatmap_image_url = heatmap_url
            scan.status = "completed"
            
            diagnosis = Diagnosis(
                scan_id=scan.id,
                condition=results["condition"],
                prediction_confidence=results["prediction_confidence"],
                severity_level=results["severity_level"],
                explanation=results["explanation"]
            )
            
            db.add(diagnosis)
            db.commit()

            self._log_audit(
                db, 
                scan.uploader_id, 
                "DIAGNOSE", 
                "SUCCESS", 
                f"Scan {scan.id} diagnosed: Category={category}, Condition={results['condition']} ({int(results['prediction_confidence']*100)}%)"
            )

            return {"success": True, "scan_id": scan.id}

        except Exception as e:
            logger.error(f"Error executing diagnostic pipeline: {e}", exc_info=True)
            db.rollback()
            scan.status = "failed"
            db.commit()
            self._log_audit(db, scan.uploader_id, "DIAGNOSE", "FAILURE", f"Fatal exception in scan {scan.id} diagnosis: {str(e)}")
            return {"success": False, "message": f"Server error running diagnosis: {str(e)}"}

    def _log_audit(self, db: Session, user_id: Optional[UUID], action: str, status: str, details: str):
        try:
            log = AuditLog(
                user_id=user_id,
                action=action,
                status=status,
                details=details
            )
            db.add(log)
            db.commit()
        except Exception:
             db.rollback()

scan_service = ScanService()
