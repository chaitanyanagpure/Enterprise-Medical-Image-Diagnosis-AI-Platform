# MedVision AI — Enterprise Universal Medical Image Diagnosis & Explainable AI (XAI) Platform

## Overview

MedVision AI is an enterprise-grade medical imaging diagnostics and MLOps platform designed to demonstrate production-ready AI engineering practices. The platform combines Deep Learning, Computer Vision, Explainable AI (XAI), and modern full-stack technologies to analyze medical images, classify anatomical regions, detect abnormalities, assess diagnostic severity, and generate detailed clinical reports.

Built using a scalable microservices architecture, MedVision AI integrates PyTorch-based computer vision models, FastAPI APIs, React dashboards, MLflow experiment tracking, Evidently AI monitoring, Prometheus telemetry, and comprehensive audit logging.

---

## Key Features

### Multi-Stage AI Diagnostic Pipeline

* Automatically classifies medical images into 10 anatomical categories:

  * Chest
  * Skull
  * Spine
  * Teeth
  * Hand
  * Leg
  * Ankle
  * Elbow
  * Knee
  * Ribs

* Uses a PyTorch ResNet-18 model for anatomical classification.

* Routes images to specialized diagnostic engines based on detected body regions.

* Performs abnormality detection with confidence-based decision making.

* Rejects unsupported or uncertain images to prevent unreliable diagnostics.

---

### Explainable AI (XAI)

* Generates Grad-CAM visual heatmaps to show the image regions influencing AI predictions.
* Uses PyTorch activation hooks and OpenCV color mapping for visualization.
* Improves transparency and interpretability of AI-assisted diagnosis.

---

### Medical Image Validation and DICOM Processing

* Extracts medical metadata using PyDicom.
* Validates image quality before AI analysis.
* Performs checks for:

  * Resolution
  * Contrast quality
  * Image compatibility

---

### AI Safety and Out-of-Distribution Detection

* Implements a 70% confidence threshold.
* Low-confidence, corrupted, unsupported, or non-medical images are marked as:

```
Unknown / Low Confidence
```

* Prevents disease analysis on unreliable inputs.

---

### MLOps Monitoring and Model Lifecycle Management

MLflow provides:

* Experiment tracking
* Model versioning
* Training history management

Evidently AI provides:

* Data drift monitoring
* Dataset quality evaluation
* Model performance monitoring

Prometheus provides:

* API latency monitoring
* Throughput analytics
* System performance metrics

---

### Clinical Reporting System

Generates professional diagnostic reports containing:

* Patient details
* AI diagnostic findings
* Severity assessment
* Original medical scan
* Grad-CAM explainability images

Supported export formats:

* PDF reports using ReportLab
* CSV records

---

### Secure Clinical Workspace

* Complete patient CRUD management.
* JWT-based authentication and authorization.
* Password security using bcrypt hashing.
* Persistent user sessions.
* Database-backed audit logs for:

  * Patient updates
  * Scan uploads
  * Diagnostic activities
  * System events

---

### Modern Dashboard Interface

* React-based responsive interface.
* Dark glassmorphism-inspired design.
* Real-time diagnostic workflow visualization.
* Interactive analytics using Recharts.
* Patient timelines and clinical history management.

---

## Application Screenshots

### Home Page

<img width="1470" height="883" alt="Home Page 1" src="https://github.com/user-attachments/assets/33f8237b-4a56-4f90-b18d-16866e4a3c57" />

---

### Dashboard

<img width="1470" height="887" alt="Dashboard 1" src="https://github.com/user-attachments/assets/d8ecbd25-03f2-471f-a708-933c16349cc7" />
<img width="1470" height="877" alt="Dashboard 2" src="https://github.com/user-attachments/assets/068d7d99-01a9-4110-b5fd-77937dcd42b6" />

---

### X-Ray Analysis

<img width="1470" height="885" alt="X-ray Analysis" src="https://github.com/user-attachments/assets/534ec46f-8e89-4510-b0f6-d9f63a98a9b4" />

---

### Patient Directory

<img width="1470" height="882" alt="Patient Directory" src="https://github.com/user-attachments/assets/bbc1baf0-16ec-4e8f-ab0e-02c50907f510" />

---

### Diagnostics Reports

<img width="1470" height="884" alt="Diagnostics Reports" src="https://github.com/user-attachments/assets/11fc321c-2bdf-4fb6-927f-f0b781da7b0f" />

---

### MedVision AI Diagnostics Reports

<img width="674" height="815" alt="MEDVISION AI DIAGNOSTIC REPORT" src="https://github.com/user-attachments/assets/8bb97966-394a-4746-9984-1fb16d8bd0c2" />

---

### Dataset Hub

<img width="1470" height="883" alt="Dataset Hub" src="https://github.com/user-attachments/assets/cd39229f-c48a-4d1f-8126-e6c9c4aafc60" />

---

### AI Model Registry

<img width="1470" height="883" alt="AI Model Registry" src="https://github.com/user-attachments/assets/3a87ce1e-c049-4a2c-bb6d-0d9fdff6500d" />

---

### Experiment Tracking
<img width="1470" height="879" alt="Experiment Tracking" src="https://github.com/user-attachments/assets/45b35a81-8def-4ea4-888d-24fa2be8d6a6" />

---

### MLOps Automation Pipelines

<img width="1470" height="879" alt="MLOps Automation Pipelines" src="https://github.com/user-attachments/assets/89c1bf60-3e46-49a8-871a-3dc79703d568" />

---

### System Performance & Monitoring

<img width="1469" height="882" alt="System Performance   Monitoring" src="https://github.com/user-attachments/assets/7761aea2-6ae6-4ab2-b373-5700f03abfc6" />


---

## System Architecture

The platform follows a Docker-based microservices architecture.

<img width="1024" height="1024" alt="system_architecture_medvisionai" src="https://github.com/user-attachments/assets/78961212-763b-44b6-b18e-53e912126731" />

---

## Technology Stack

| Domain                      | Technologies                                                            |
| --------------------------- | ----------------------------------------------------------------------- |
| Frontend                    | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios |
| Backend                     | FastAPI, Uvicorn, Pydantic, SQLAlchemy, Alembic, JWT Authentication     |
| Artificial Intelligence     | PyTorch, Torchvision ResNet-18, OpenCV, NumPy, PyDicom                  |
| MLOps and Monitoring        | MLflow, Evidently AI, Prometheus Instrumentator                         |
| Database and Infrastructure | PostgreSQL 16, Docker, Docker Compose, MinIO                            |
| Reporting                   | ReportLab PDF Toolkit, CSV Export                                       |

---

## Production Engineering and Design Patterns

### JWT Authentication and Session Management

* JWT Bearer authentication.
* Secure password hashing using bcrypt.
* Session persistence using local storage.

### Object Storage Architecture

* Uses MinIO S3-compatible storage.
* Stores X-ray scans, Grad-CAM images, and diagnostic assets.
* Configures secure bucket access policies.

### Database Initialization and Diagnostic Migration

* Automatically creates required database tables.
* Seeds the default administrator account.
* Re-analyzes historical records using updated diagnostic pipelines.

### Computer Vision Safety Validation

Dental Analysis:

* Uses density and boundary histogram analysis to verify dental images.

Spine Analysis:

* Uses anatomical aspect-ratio checks to validate spinal structures.

Bone Fracture Detection:

* Applies Laplacian variance analysis on segmented grayscale bone regions to identify fracture complexity.

Chest Analysis:

* Performs bilateral lung density symmetry analysis for opacity detection.

---

## Installation and Setup

### Prerequisites

Install the following software:

* Docker and Docker Compose
* Python 3.9 or higher
* Node.js 18 or higher
* npm

---

## Step 1: Start Infrastructure Services

Start PostgreSQL, MinIO, and MLflow containers:

```bash
docker-compose up -d
```

Verify running services:

```bash
docker-compose ps
```

Services:

* PostgreSQL: Port 5434
* MinIO Console: http://localhost:9011
* MLflow UI: http://localhost:5002

MinIO Credentials:

```
Username: medvision_admin
Password: medvision_admin_password
```

---

## Step 2: Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv venv
```

Activate the environment:

macOS/Linux:

```bash
source venv/bin/activate
```

Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI application:

```bash
python app/main.py
```

API Documentation:

```
http://localhost:8002/docs
```

---

## Step 3: Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend URL:

```
http://localhost:5173
```

---

## Default Administrator Credentials

Use the following credentials to access the dashboard:

```
Email: admin@medvision.ai
Password: AdminPassword123!
```

---

## End-to-End Validation Workflow

1. Register a new patient.
2. Open the X-Ray Analysis workspace.
3. Upload test X-ray images.

Expected results:

| Image    | Classification | Diagnosis                      |
| -------- | -------------- | ------------------------------ |
| 106.jpeg | Ribs           | Rib Fracture - High Severity   |
| 112.jpeg | Skull          | Skull Fracture - High Severity |
| 113.jpeg | Ankle          | Normal - Normal Severity       |

4. Verify that Grad-CAM highlights relevant anatomical regions.
5. Download the generated PDF report and validate the output.

---

## Repository Management

### Preserving Runtime Directories

A `.gitkeep` file is added inside:

```
backend/static/reports/
```

This preserves required directories while excluding generated runtime files.

### Repository Cleanup

* Verified repository status using Git.
* Excluded cache files, dependencies, logs, and secrets.
* Maintained a clean production-ready repository structure.

---

## Future Improvements

* Vision Transformer (ViT) based medical image models.
* Multi-modal AI using clinical history and imaging data.
* Kubernetes cloud deployment.
* Automated CI/CD pipelines.
* Advanced AI monitoring and model retraining.
* Federated learning for privacy-preserving healthcare AI.

---

## License

This project is intended for educational, research, and portfolio purposes only. It is not approved for real-world clinical diagnosis and should not replace professional medical evaluation.

---

## Author

**Chaitanya Nagpure**

AI/ML Engineer | Data Scientist | Full-Stack AI Developer

MedVision AI was developed as a production-grade AI healthcare imaging platform demonstrating expertise in Deep Learning, Computer Vision, Explainable AI (XAI), MLOps, cloud-ready architecture, and modern full-stack development.

