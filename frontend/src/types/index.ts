export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "doctor" | "admin";
  created_at: string;
}

export interface Patient {
  id: string;
  patient_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  medical_history?: string;
  created_at: string;
}

export interface Diagnosis {
  id: string;
  scan_id: string;
  condition: string;
  prediction_confidence: number;
  severity_level: "normal" | "low" | "medium" | "high";
  explanation?: string;
  doctor_notes?: string;
  created_at: string;
}

export interface Scan {
  id: string;
  patient_id: string;
  uploader_id?: string;
  raw_image_url: string;
  heatmap_image_url?: string;
  detected_type?: string;
  type_confidence?: number;
  status: "validating" | "diagnosing" | "completed" | "failed";
  created_at: string;
  diagnosis?: Diagnosis;
  top_predictions?: { body_part: string; confidence: number }[];
}

export interface ModelRegistry {
  id: string;
  name: string;
  version: string;
  architecture: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  stage: "development" | "staging" | "production" | "archived";
  mlflow_uri?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  status: "SUCCESS" | "FAILURE";
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  storage_percent: number;
  api_latency_ms: number;
  api_error_rate_percent: number;
}

export interface DriftMetrics {
  drift_score_brightness: number;
  drift_score_contrast: number;
  drift_detected: boolean;
  evidently_report_date: string;
  prediction_drift_score: number;
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
}

export interface MonitoringStats {
  system: SystemMetrics;
  model_drift: DriftMetrics;
  alerts: Alert[];
}
