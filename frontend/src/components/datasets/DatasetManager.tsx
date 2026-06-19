import React, { useState, useEffect } from 'react';
import { datasetAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Database, Plus, ShieldCheck, 
  Layers, AlertTriangle, Calendar, FileText, 
  HelpCircle, ChevronRight, CheckCircle2, RefreshCw 
} from 'lucide-react';

export const DatasetManager: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Upload states
  const [file, setFile] = useState<File | null>(null);
  const [versionNote, setVersionNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await datasetAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error("Error loading dataset stats", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);

    try {
      const res = await datasetAPI.upload(file, versionNote);
      setUploadSuccess(res.message);
      setFile(null);
      setVersionNote('');
      loadStats();
    } catch (err) {
       alert("Failed to submit dataset batch.");
    } finally {
       setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-medical-softgray border-t-medical-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dataset Hub</h1>
          <p className="text-xs text-gray-500 mt-1">Version control radiography archives, inspect data skewness and view corruption audits.</p>
        </div>
      </div>

      {uploadSuccess && (
         <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 rounded-xl flex items-center gap-3">
           <CheckCircle2 className="w-4 h-4 shrink-0" />
           <span>{uploadSuccess}</span>
         </div>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {[
          { label: "Dataset Scale", value: stats.summary.total_images.toLocaleString() + " Scans", note: "DVC Versioned archive", color: "text-medical-blue border-medical-blue/10 bg-medical-blue/5" },
          { label: "Corrupted Images", value: stats.summary.corrupted_images, note: "Integrity validation warnings", color: stats.summary.corrupted_images > 0 ? "text-medical-rose border-medical-rose/10 bg-medical-rose/5" : "text-gray-500 border-gray-100 bg-white" },
          { label: "Duplicate Records", value: stats.summary.duplicate_images, note: "Pixel comparison metrics", color: "text-medical-amber border-medical-amber/10 bg-medical-amber/5" },
          { label: "Missing Labels", value: stats.summary.missing_labels, note: "Unannotated files cataloged", color: "text-gray-500 border-gray-100 bg-white" },
          { label: "Data Imbalance Coeff", value: stats.summary.imbalance_ratio, note: "Max/Min class frequency ratio", color: "text-emerald-600 border-emerald-500/10 bg-emerald-500/5" }
        ].map((card, i) => (
          <div key={i} className={`p-4 rounded-2xl border bg-white ${card.color}`}>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</span>
            <h3 className="text-2xl font-extrabold text-medical-darktext mt-2">{card.value}</h3>
            <p className="text-[9px] text-gray-400 mt-1">{card.note}</p>
          </div>
        ))}
      </div>

      {/* Class distribution & Import form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Class distribution */}
        <div className="lg:col-span-2 p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
          <div>
            <h3 className="font-bold text-sm tracking-wide">Radiography Class Frequencies</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Aggregated cases counts registered under our label dictionary.</p>
          </div>
          <div className="space-y-3 pt-2">
            {stats.class_distribution.map((item: any, i: number) => {
              const maxVal = Math.max(...stats.class_distribution.map((c: any) => c.count));
              const pct = (item.count / maxVal) * 100;
              return (
                <div key={i} className="text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-gray-600">
                    <span>{item.label}</span>
                    <span>{item.count.toLocaleString()} cases</span>
                  </div>
                  <div className="w-full bg-medical-graybg h-2.5 rounded-full overflow-hidden border border-gray-100">
                    <div className="bg-medical-blue h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Import dataset batch */}
        <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
          <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
            <Plus className="w-4.5 h-4.5 text-medical-blue" />
            DVC Dataset Ingestion
          </h3>
          
          <form onSubmit={handleUploadDataset} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Select Dataset Archive (.zip / .tar.gz)</label>
              <input
                type="file"
                required
                accept=".zip,.gz,.tar"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full border border-medical-softgray rounded-xl px-3 py-2 text-xs bg-medical-graybg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Version Release Log Note</label>
              <textarea
                required
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                placeholder="Briefly state additional scans, annotations revisions or class edits..."
                className="w-full border border-medical-softgray rounded-xl px-3 py-2 text-xs bg-medical-graybg min-h-[80px] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full py-2.5 bg-medical-blue text-white rounded-xl text-xs font-bold hover:bg-medical-blue/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {uploading ? (
                 <>
                   <RefreshCw className="w-4 h-4 animate-spin" />
                   Ingesting Archive...
                 </>
              ) : (
                 <>
                   <Database className="w-4 h-4" />
                   Ingest Dataset Batch
                 </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Dataset Version Releases Table */}
      <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
        <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
          <Layers className="w-4.5 h-4.5 text-medical-blue" />
          DVC Version History
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-medical-softgray text-gray-500 font-semibold">
                <th className="pb-3 font-bold">DVC Release tag</th>
                <th className="pb-3 font-bold">Release Date</th>
                <th className="pb-3 font-bold">Scan Count</th>
                <th className="pb-3 font-bold">Ingested By</th>
                <th className="pb-3 font-bold">Log Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-medical-softgray">
              {stats.version_history.map((ver: any, i: number) => (
                <tr key={i} className="hover:bg-medical-graybg/40 transition text-gray-600">
                  <td className="py-3.5 font-bold text-medical-blue">{ver.version}</td>
                  <td className="py-3.5 text-gray-500 font-medium">{ver.release_date}</td>
                  <td className="py-3.5 font-bold text-medical-darktext">{ver.total_count.toLocaleString()} cases</td>
                  <td className="py-3.5 text-gray-400">{ver.added_by}</td>
                  <td className="py-3.5 text-gray-500 leading-normal max-w-sm">{ver.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
