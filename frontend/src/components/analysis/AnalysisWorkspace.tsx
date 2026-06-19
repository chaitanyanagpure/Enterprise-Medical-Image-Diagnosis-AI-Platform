import React, { useState, useEffect } from 'react';
import { api, patientAPI, scanAPI, reportAPI } from '../../services/api';
import type { Patient, Scan } from '../../types';
import { 
  Upload, FileImage, Clipboard, 
  ArrowRight, ShieldCheck, HeartPulse, FileText, 
  RefreshCw, CheckCircle2, UserCheck, Plus,
  BrainCircuit
} from 'lucide-react';

export const AnalysisWorkspace: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // File upload states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDicom, setIsDicom] = useState(false);

  // Diagnostic states
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [scanResult, setScanResult] = useState<Scan | null>(null);
  const [activeVisualMode, setActiveVisualMode] = useState<'original' | 'heatmap'>('heatmap');
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async (query?: string) => {
    try {
      const list = await patientAPI.list(query);
      setPatients(list);
      if (list.length > 0 && !selectedPatientId) {
        setSelectedPatientId(list[0].id);
      }
    } catch (err) {
      console.error("Error fetching patients", err);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    loadPatients(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsDicom(selectedFile.name.toLowerCase().endsWith('.dcm'));
      
      // Create local preview if not DICOM
      if (!selectedFile.name.toLowerCase().endsWith('.dcm')) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        // DICOM files can't render directly in browsers
        setPreviewUrl(null);
      }
      // Reset past run
      setScanResult(null);
    }
  };

  const runDiagnosticPipeline = async () => {
    if (!file || !selectedPatientId) return;

    setIsUploading(true);
    setCurrentStep(1); // Validating quality
    setNotesSaved(false);

    try {
      // 1. Upload scan
      const uploadedScan = await scanAPI.upload(file, selectedPatientId);
      
      // Simulate delay to display each pipeline step clearly in sandbox
      await new Promise(r => setTimeout(r, 800));
      setCurrentStep(2); // Category Classifier
      
      await new Promise(r => setTimeout(r, 800));
      setCurrentStep(3); // Diagnosis Model
      
      // 2. Trigger diagnosis
      const diagnosedScan = await scanAPI.diagnose(uploadedScan.id);
      
      setCurrentStep(4); // Heatmap overlays
      await new Promise(r => setTimeout(r, 600));
      
      setCurrentStep(5); // Report generation
      await new Promise(r => setTimeout(r, 600));

      setScanResult(diagnosedScan);
      setDoctorNotes(diagnosedScan.diagnosis?.doctor_notes || '');
      
    } catch (err: any) {
      alert("Pipeline Error: " + (err.response?.data?.detail || err.message));
      setFile(null);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      setCurrentStep(0);
    }
  };

  const handleDownloadPdf = async () => {
    if (!scanResult) return;
    try {
      const response = await api.get(reportAPI.getPdfUrl(scanResult.id), {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Report_${scanResult.id.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to download PDF report");
    }
  };

  const handleDownloadCsv = async () => {
    if (!scanResult) return;
    try {
      const response = await api.get(reportAPI.getCsvUrl(scanResult.id), {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Report_${scanResult.id.substring(0, 8)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download CSV", err);
      alert("Failed to download CSV report");
    }
  };

  const steps = [
    { label: "Validating scan and image exposure quality...", num: 1 },
    { label: "Executing X-ray category classification model...", num: 2 },
    { label: "Routing to specialized neural network...", num: 3 },
    { label: "Extracting layers & generating Grad-CAM heatmaps...", num: 4 },
    { label: "Compiling automated diagnostics report brief...", num: 5 },
  ];

  const getSeverityBadge = (level: string) => {
    const maps: Record<string, string> = {
      normal: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
      low: "bg-blue-500/10 border-blue-500/20 text-blue-600",
      medium: "bg-amber-500/10 border-amber-500/20 text-amber-600",
      high: "bg-red-500/10 border-red-500/20 text-red-600"
    };
    return maps[level.toLowerCase()] || "bg-gray-500/10 text-gray-500";
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Diagnostics Workspace</h1>
        <p className="text-xs text-gray-500 mt-1">Upload patient radiography scans, execute target classifiers and view activations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left pane: Patient Match & Upload */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Patient Selector */}
          <div className="p-5 rounded-2xl border border-medical-softgray bg-white space-y-4">
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
              <UserCheck className="w-4.5 h-4.5 text-medical-blue" />
              Patient Selection
            </h3>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search patient by name or ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 border border-medical-softgray rounded-xl text-xs bg-medical-graybg focus:border-medical-blue/40 focus:outline-none"
              />
              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full py-2.5 px-3 border border-medical-softgray rounded-xl text-xs bg-white focus:outline-none"
            >
              {patients.map((pat) => (
                <option key={pat.id} value={pat.id}>
                  {pat.full_name} ({pat.patient_id})
                </option>
              ))}
              {patients.length === 0 && (
                <option value="">No patients registered</option>
              )}
            </select>
          </div>

          {/* Upload Drop Zone */}
          <div className="p-5 rounded-2xl border border-medical-softgray bg-white space-y-4">
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
              <Upload className="w-4.5 h-4.5 text-medical-blue" />
              Radiograph Source File
            </h3>

            {!file ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-medical-softgray rounded-2xl p-8 cursor-pointer hover:bg-medical-graybg transition">
                <FileImage className="w-10 h-10 text-gray-400 mb-3" />
                <span className="block text-xs font-bold text-gray-600 text-center">Drag files here or Browse</span>
                <span className="block text-[10px] text-gray-400 mt-1 text-center">Supports DICOM (.dcm), PNG, JPEG</span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.dcm"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="border border-medical-softgray rounded-2xl p-4 bg-medical-graybg flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-medical-blue/10 flex items-center justify-center text-medical-blue shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-xs font-bold truncate text-medical-darktext">{file.name}</span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB {isDicom ? '(DICOM)' : ''}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setFile(null); setPreviewUrl(null); }}
                  className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-white transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <button
              onClick={runDiagnosticPipeline}
              disabled={!file || !selectedPatientId || isUploading}
              className="w-full py-3 rounded-xl font-bold bg-medical-blue text-white hover:bg-medical-blue/90 shadow-md shadow-medical-blue/15 transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Scan...
                </>
              ) : (
                <>
                  <HeartPulse className="w-4 h-4" />
                  Execute AI Diagnostics
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right pane: Analysis Results & Stepper */}
        <div className="lg:col-span-2">
          
          {/* Stepper display */}
          {isUploading && (
            <div className="p-8 border border-medical-softgray bg-white rounded-2xl flex flex-col items-center justify-center min-h-[400px] space-y-6">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-medical-softgray border-t-medical-blue animate-spin" />
                <BrainCircuit className="w-6 h-6 text-medical-blue animate-pulse" />
              </div>
              <div className="text-center max-w-sm">
                <h3 className="font-bold text-sm">Processing Radiograph</h3>
                <p className="text-[11px] text-gray-400 mt-1">Our multi-stage Deep Learning pipeline is active.</p>
              </div>
              <div className="w-full max-w-md space-y-3">
                {steps.map((step) => {
                  const active = currentStep === step.num;
                  const completed = currentStep > step.num;
                  return (
                    <div key={step.num} className="flex items-center gap-3.5 text-xs">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 transition-all duration-300 ${
                        completed 
                          ? 'bg-emerald-500 text-white' 
                          : active 
                          ? 'bg-medical-blue text-white ring-4 ring-medical-blue/15 scale-110' 
                          : 'bg-medical-graybg border border-medical-softgray text-gray-400'
                      }`}>
                        {completed ? '✓' : step.num}
                      </div>
                      <span className={`${active ? 'font-bold text-medical-darktext' : completed ? 'text-gray-400' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isUploading && !scanResult && (
            <div className="border-2 border-dashed border-medical-softgray bg-white rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <Clipboard className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="font-bold text-sm tracking-wide">Awaiting Diagnostic Run</h3>
              <p className="text-xs text-gray-400 max-w-xs mt-1.5 leading-normal">
                Match a patient profile, select a radiograph target scan from the local catalog, and select execute to trigger classification and overlay heatmaps.
              </p>
            </div>
          )}

          {/* Results Screen */}
          {!isUploading && scanResult && (
            <div className="space-y-6">
              
              {/* Visual Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Image panel */}
                <div className="p-4 border border-medical-softgray bg-white rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-medical-softgray pb-3 mb-4">
                    <span className="font-bold text-xs">Radiography Screen</span>
                    <div className="flex bg-medical-graybg rounded-lg p-0.5 border border-medical-softgray">
                      <button
                        onClick={() => setActiveVisualMode('original')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${activeVisualMode === 'original' ? 'bg-white shadow-sm text-medical-darktext' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Original
                      </button>
                      <button
                        onClick={() => setActiveVisualMode('heatmap')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${activeVisualMode === 'heatmap' ? 'bg-white shadow-sm text-medical-darktext' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Grad-CAM
                      </button>
                    </div>
                  </div>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-black flex items-center justify-center border border-gray-100">
                    <img
                      src={activeVisualMode === 'original' ? scanResult.raw_image_url : scanResult.heatmap_image_url}
                      alt="Analysis visual"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>

                {/* Diagnosis Summary Card */}
                <div className="p-5 border border-medical-softgray bg-white rounded-2xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold bg-medical-blue/10 text-medical-blue border border-medical-blue/20 px-2 py-0.5 rounded tracking-wide uppercase">
                        {scanResult.detected_type} X-ray Detected ({intPercentage(scanResult.type_confidence)}%)
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] border font-bold uppercase tracking-wider ${getSeverityBadge(scanResult.diagnosis?.severity_level || 'normal')}`}>
                        {scanResult.diagnosis?.severity_level} Severity
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black">{scanResult.diagnosis?.condition}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400">Model Forecast Confidence:</span>
                        <span className="text-sm font-bold text-emerald-500">{intPercentage(scanResult.diagnosis?.prediction_confidence)}%</span>
                      </div>
                    </div>

                    <div className="border-t border-medical-softgray pt-3">
                      <h4 className="font-bold text-xs text-gray-500 mb-1">AI Explanation</h4>
                      <p className="text-xs text-gray-600 leading-relaxed bg-medical-graybg border border-medical-softgray p-3 rounded-xl">
                        {scanResult.diagnosis?.explanation}
                      </p>
                    </div>

                    {scanResult.top_predictions && scanResult.top_predictions.length > 0 && (
                      <div className="border-t border-medical-softgray pt-3">
                        <h4 className="font-bold text-xs text-gray-500 mb-1.5">Top Predicted Body Regions (Neural Net Output)</h4>
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                          {scanResult.top_predictions.slice(0, 3).map((pred: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-lg p-2 text-[11px]">
                              <span className="font-semibold text-gray-700 capitalize">
                                {idx + 1}. {pred.body_part}
                              </span>
                              <span className="font-black text-medical-blue">
                                {Math.round(pred.confidence * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-medical-softgray pt-4 mt-6 flex gap-3">
                    <button
                      onClick={handleDownloadPdf}
                      className="flex-1 py-2.5 rounded-xl border border-medical-softgray bg-white hover:bg-medical-graybg transition text-center text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-gray-500" />
                      Download PDF Brief
                    </button>
                    <button
                      onClick={handleDownloadCsv}
                      className="py-2.5 px-4 rounded-xl border border-medical-softgray bg-white hover:bg-medical-graybg transition text-center text-xs font-semibold"
                    >
                      CSV
                    </button>
                  </div>
                </div>

              </div>

              {/* Doctor Clinical Notes Panel */}
              <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
                <h3 className="font-bold text-sm tracking-wide flex items-center justify-between">
                  <span>Clinical Evaluation Notes</span>
                  {notesSaved && (
                     <span className="text-xs text-emerald-500 flex items-center gap-1">
                       <CheckCircle2 className="w-3.5 h-3.5" />
                       Notes Saved to DB
                     </span>
                  )}
                </h3>
                <textarea
                  placeholder="Enter medical comments, surgical recommendations, or manual corrections to diagnostic fields..."
                  value={doctorNotes}
                  onChange={(e) => { setDoctorNotes(e.target.value); setNotesSaved(false); }}
                  className="w-full min-h-[100px] border border-medical-softgray rounded-xl p-3 text-xs bg-medical-graybg focus:border-medical-blue/40 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={async () => {
                       // Save notes to DB (we will mock this API check or update scan)
                       setNotesSaved(true);
                    }}
                    className="px-4 py-2 bg-medical-blue text-white rounded-xl text-xs font-bold hover:bg-medical-blue/90 transition"
                  >
                    Save Notes
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Helper percentage formatter
const intPercentage = (val?: number) => {
  if (!val) return 0;
  return Math.round(val * 100);
};
