from typing import Any
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import io
import os
import csv
from datetime import datetime
import httpx
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class ReportService:
    def generate_pdf(self, scan: Any, diagnosis: Any, patient: Any, uploader_name: str) -> bytes:
        """
        Generates a professional PDF report containing patient details, scan metadata,
        diagnostic findings, Grad-CAM overlays, and doctor signature blocks.
        """
        buffer = io.BytesIO()
        # Set tight margins for a single-page medical brief
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter, 
            rightMargin=40, 
            leftMargin=40, 
            topMargin=40, 
            bottomMargin=40
        )
        story = []

        # Color system matches dashboard aesthetics
        primary_color = colors.HexColor("#2563EB")  # Medical Blue
        navy_color = colors.HexColor("#0F172A")     # Dark Navy
        text_color = colors.HexColor("#1F2937")     # Dark Gray
        border_color = colors.HexColor("#E5E7EB")   # Light Gray
        
        styles = getSampleStyleSheet()
        
        # Custom Paragraph Styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            textColor=navy_color,
            fontSize=24,
            leading=28,
            spaceAfter=15
        )
        
        section_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            textColor=primary_color,
            fontSize=14,
            leading=18,
            spaceBefore=10,
            spaceAfter=6
        )
        
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['BodyText'],
            textColor=text_color,
            fontSize=10,
            leading=14
        )

        label_style = ParagraphStyle(
            'ReportLabel',
            parent=styles['BodyText'],
            textColor=colors.HexColor("#4B5563"),
            fontSize=10,
            leading=14,
            fontName='Helvetica-Bold'
        )

        # 1. Header
        story.append(Paragraph("MEDVISION AI DIAGNOSTIC REPORT", title_style))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", body_style))
        story.append(Spacer(1, 15))

        # 2. Patient & Scan Info Table
        patient_data = [
            [Paragraph("Patient Name:", label_style), Paragraph(patient.full_name, body_style), 
             Paragraph("Patient ID:", label_style), Paragraph(patient.patient_id, body_style)],
            [Paragraph("Date of Birth:", label_style), Paragraph(str(patient.date_of_birth), body_style), 
             Paragraph("Gender:", label_style), Paragraph(patient.gender, body_style)],
            [Paragraph("Scan Type:", label_style), Paragraph(str(scan.detected_type).upper(), body_style), 
             Paragraph("Uploader:", label_style), Paragraph(uploader_name, body_style)]
        ]
        
        patient_table = Table(patient_data, colWidths=[90, 170, 90, 170])
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F9FAFB")),
            ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(Paragraph("Patient & Scan Profile", section_style))
        story.append(patient_table)
        story.append(Spacer(1, 15))

        # 3. Diagnostic Results Table
        severity_colors = {
            "normal": colors.HexColor("#10B981"), # Emerald Green
            "low": colors.HexColor("#3B82F6"),    # Blue
            "medium": colors.HexColor("#F59E0B"), # Amber
            "high": colors.HexColor("#EF4444")    # Rose Red
        }
        sev = diagnosis.severity_level.lower()
        sev_color = severity_colors.get(sev, text_color)
        
        severity_style = ParagraphStyle(
            'SeverityStyle',
            parent=body_style,
            textColor=sev_color,
            fontName='Helvetica-Bold'
        )

        diagnosis_data = [
            [Paragraph("Predicted Condition:", label_style), Paragraph(diagnosis.condition, body_style)],
            [Paragraph("Confidence Score:", label_style), Paragraph(f"{int(diagnosis.prediction_confidence * 100)}%", body_style)],
            [Paragraph("Severity Level:", label_style), Paragraph(diagnosis.severity_level.upper(), severity_style)],
            [Paragraph("AI Explanation:", label_style), Paragraph(diagnosis.explanation or "None provided", body_style)],
            [Paragraph("Doctor Notes:", label_style), Paragraph(diagnosis.doctor_notes or "No notes added.", body_style)]
        ]

        diagnosis_table = Table(diagnosis_data, colWidths=[130, 390])
        diagnosis_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#F3F4F6")),
        ]))
        story.append(Paragraph("Diagnostic Analysis Findings", section_style))
        story.append(diagnosis_table)
        story.append(Spacer(1, 15))

        # 4. Embedded Grad-CAM Heatmap
        story.append(Paragraph("Visual Attention Overlay (Grad-CAM)", section_style))
        
        # Load image file
        img_added = False
        if scan.heatmap_image_url:
            try:
                if scan.heatmap_image_url.startswith("/static/"):
                    local_base = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")
                    img_path = os.path.join(local_base, scan.heatmap_image_url.replace("/static/", ""))
                    if os.path.exists(img_path):
                        r_img = RLImage(img_path, width=220, height=220)
                        story.append(r_img)
                        img_added = True
                else:
                    # Download from S3/MinIO
                    # For a clean build, download bytes and pass to BytesIO
                    r = httpx.get(scan.heatmap_image_url)
                    if r.status_code == 200:
                        img_data = io.BytesIO(r.content)
                        r_img = RLImage(img_data, width=220, height=220)
                        story.append(r_img)
                        img_added = True
            except Exception as e:
                logger.error(f"Error embedding Grad-CAM image in PDF: {e}")

        if not img_added:
            story.append(Paragraph("[Grad-CAM Heatmap image unavailable for embedding]", body_style))

        story.append(Spacer(1, 20))
        
        # 5. Sign-off Section
        sign_data = [
            [Paragraph("_____________________________<br/>Attending Physician Signature", body_style), 
             Paragraph("_____________________________<br/>Reviewing Radiologist Signature", body_style)]
        ]
        sign_table = Table(sign_data, colWidths=[260, 260])
        sign_table.setStyle(TableStyle([
            ('PADDING', (0,0), (-1,-1), 10),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(sign_table)

        doc.build(story)
        return buffer.getvalue()

    def generate_csv(self, scan: Any, diagnosis: Any, patient: Any, uploader_name: str) -> str:
        """
        Generates a CSV brief summarizing patient details and diagnosis results.
        """
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header Row
        writer.writerow(["Report Date", "Patient ID", "Patient Name", "DOB", "Gender", "Scan ID", "Scan Type", "Condition", "Confidence", "Severity", "AI Explanation", "Doctor Notes", "Uploader"])
        
        # Value Row
        writer.writerow([
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            patient.patient_id,
            patient.full_name,
            str(patient.date_of_birth),
            patient.gender,
            str(scan.id),
            scan.detected_type,
            diagnosis.condition,
            f"{int(diagnosis.prediction_confidence * 100)}%",
            diagnosis.severity_level,
            diagnosis.explanation,
            diagnosis.doctor_notes or "",
            uploader_name
        ])
        
        return output.getvalue()

report_service = ReportService()
