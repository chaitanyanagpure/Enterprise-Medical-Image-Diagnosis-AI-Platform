import cv2
import numpy as np
from PIL import Image
import io
import os
from typing import Dict, Any, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Try to import pydicom; fallback gracefully if it fails during build
try:
    import pydicom
    HAS_PYDICOM = True
except ImportError:
    HAS_PYDICOM = False
    logger.warning("pydicom is not installed. DICOM metadata extraction will be disabled.")

def validate_image_quality(img_np: np.ndarray) -> Tuple[bool, str]:
    """
    Perform medical image quality checks:
    - Resolution check (minimum 256x256)
    - Exposure check (too dark or too bright)
    - Content corruption check
    """
    if img_np is None or img_np.size == 0:
        return False, "Corrupted or unreadable image file."

    h, w = img_np.shape[:2]
    if h < 128 or w < 128:
         return False, f"Image resolution too low ({w}x{h}). Minimum required is 128x128."

    # Convert to grayscale for contrast/brightness check
    if len(img_np.shape) == 3:
        gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    else:
        gray = img_np

    mean_pixel = np.mean(gray)
    std_pixel = np.std(gray)

    # Exposure boundary checks
    if mean_pixel < 15:
        return False, "Image too dark. Insufficient diagnostic exposure."
    if mean_pixel > 240:
        return False, "Image overexposed. Visual features saturated."
    if std_pixel < 5:
        return False, "Low contrast image. No features detected."

    return True, "Quality validation passed."

def process_dicom(file_bytes: bytes) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Parse DICOM file, extract medical metadata, and return a processed 8-bit image buffer.
    """
    metadata = {}
    if not HAS_PYDICOM:
        raise ImportError("pydicom package is not available to parse DICOM files.")

    # Parse DICOM dataset from bytes
    ds = pydicom.dcmread(io.BytesIO(file_bytes))
    
    # Extract metadata tags
    metadata["patient_name"] = str(ds.get("PatientName", "Unknown"))
    metadata["patient_sex"] = str(ds.get("PatientSex", "Unknown"))
    metadata["patient_age"] = str(ds.get("PatientAge", "Unknown"))
    metadata["modality"] = str(ds.get("Modality", "DX"))
    metadata["body_part"] = str(ds.get("BodyPartExamined", "Unknown"))
    metadata["study_description"] = str(ds.get("StudyDescription", "None"))
    metadata["study_date"] = str(ds.get("StudyDate", "Unknown"))

    # Convert pixel data to raw numpy array
    pixel_array = ds.pixel_array
    
    # Normalize pixel values to 0-255 uint8
    if ds.get("PhotometricInterpretation") == "MONOCHROME1":
        # Invert pixels so bone appears white
        pixel_array = np.max(pixel_array) - pixel_array
        
    pixel_min = np.min(pixel_array)
    pixel_max = np.max(pixel_array)
    
    if pixel_max > pixel_min:
        img_8bit = ((pixel_array - pixel_min) / (pixel_max - pixel_min) * 255.0).astype(np.uint8)
    else:
        img_8bit = np.zeros(pixel_array.shape, dtype=np.uint8)

    # Convert to 3-channel RGB for deep learning models
    img_rgb = cv2.cvtColor(img_8bit, cv2.COLOR_GRAY2RGB)
    
    return img_rgb, metadata

def enhance_medical_image(img_np: np.ndarray) -> np.ndarray:
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to enhance radiography structures.
    """
    if len(img_np.shape) == 3:
        # Convert to YUV to enhance only the luminance channel
        yuv = cv2.cvtColor(img_np, cv2.COLOR_RGB2YUV)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        yuv[:, :, 0] = clahe.apply(yuv[:, :, 0])
        enhanced = cv2.cvtColor(yuv, cv2.COLOR_YUV2RGB)
        return enhanced
    else:
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        return clahe.apply(img_np)
