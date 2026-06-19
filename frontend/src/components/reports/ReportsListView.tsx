import React, { useState, useEffect } from 'react';
import { api, scanAPI, reportAPI, patientAPI } from '../../services/api';
import type { Scan, Patient } from '../../types';
import { FileText, Search, Download, ExternalLink, Calendar, Heart } from 'lucide-react';

export const ReportsListView: React.FC = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSearch = localStorage.getItem('globalReportSearch');
    if (storedSearch) {
      setSearchQuery(storedSearch);
      localStorage.removeItem('globalReportSearch');
    }
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [list, patientList] = await Promise.all([
        scanAPI.list(),
        patientAPI.list()
      ]);
      
      const patientMap: Record<string, Patient> = {};
      patientList.forEach((pat: Patient) => {
        patientMap[pat.id] = pat;
      });
      setPatients(patientMap);

      // Filter out only completed scans that have diagnosis records
      const completedScans = list.filter((scan: Scan) => scan.status === 'completed' && scan.diagnosis);
      setScans(completedScans);
    } catch (err) {
      console.error("Error loading reports", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, filename: string, type: 'pdf' | 'csv') => {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      });
      const contentType = type === 'pdf' ? 'application/pdf' : 'text/csv';
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(`Failed to download ${type.toUpperCase()}`, err);
      alert(`Failed to download ${type.toUpperCase()} report`);
    }
  };

  const filteredScans = scans.filter(scan => {
    const term = searchQuery.toLowerCase();
    const patient = patients[scan.patient_id];
    return (
      scan.diagnosis?.condition.toLowerCase().includes(term) ||
      scan.detected_type?.toLowerCase().includes(term) ||
      scan.id.toLowerCase().includes(term) ||
      (patient && (
        patient.full_name.toLowerCase().includes(term) ||
        patient.patient_id.toLowerCase().includes(term)
      ))
    );
  });

  if (loading && scans.length === 0) {
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
          <h1 className="text-2xl font-bold tracking-tight">Diagnostics Reports</h1>
          <p className="text-xs text-gray-500 mt-1">Export, filter, and archive generated PDF briefs and tabular CSV summaries.</p>
        </div>
      </div>

      <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
        {/* Search bar */}
        <div className="flex items-center gap-2 border border-medical-softgray rounded-xl px-3 py-2.5 bg-medical-graybg focus-within:border-medical-blue/40 w-full md:max-w-xs transition">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by condition or body part..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs focus:outline-none w-full"
          />
        </div>

        {/* Reports Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-medical-softgray text-gray-500 font-semibold">
                <th className="pb-3 font-bold">Report ID</th>
                <th className="pb-3 font-bold">Patient</th>
                <th className="pb-3 font-bold">Condition Forecast</th>
                <th className="pb-3 font-bold">Radiography Segment</th>
                <th className="pb-3 font-bold">AI Confidence</th>
                <th className="pb-3 font-bold">Analysis Date</th>
                <th className="pb-3 text-right font-bold pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-medical-softgray">
              {filteredScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-medical-graybg/40 transition">
                  <td className="py-3.5 font-semibold text-gray-400">REP-{scan.id.substring(0, 8).toUpperCase()}</td>
                  <td className="py-3.5">
                    {patients[scan.patient_id] ? (
                      <div>
                        <span className="block font-bold text-medical-darktext">{patients[scan.patient_id].full_name}</span>
                        <span className="block text-[10px] text-gray-400">{patients[scan.patient_id].patient_id}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unknown Patient</span>
                    )}
                  </td>
                  <td className="py-3.5">
                    <span className="font-bold text-medical-darktext">{scan.diagnosis?.condition}</span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      scan.diagnosis?.severity_level === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {scan.diagnosis?.severity_level}
                    </span>
                  </td>
                  <td className="py-3.5 capitalize text-gray-500 font-medium">{scan.detected_type} X-Ray</td>
                  <td className="py-3.5 font-bold text-emerald-500">{Math.round((scan.diagnosis?.prediction_confidence || 0) * 100)}%</td>
                  <td className="py-3.5 text-gray-400">{new Date(scan.created_at).toLocaleDateString()}</td>
                  <td className="py-3.5 text-right pr-2 space-x-2.5">
                    <button
                      onClick={() => handleDownload(reportAPI.getPdfUrl(scan.id), `Report_${scan.id.substring(0, 8)}.pdf`, 'pdf')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-medical-softgray hover:border-medical-blue hover:bg-medical-blue/5 rounded-lg text-medical-blue font-bold transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      PDF
                    </button>
                    <button
                      onClick={() => handleDownload(reportAPI.getCsvUrl(scan.id), `Report_${scan.id.substring(0, 8)}.csv`, 'csv')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-medical-softgray hover:border-medical-blue hover:bg-medical-blue/5 rounded-lg text-gray-500 font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </button>
                  </td>
                </tr>
              ))}
              {filteredScans.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No reports match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
