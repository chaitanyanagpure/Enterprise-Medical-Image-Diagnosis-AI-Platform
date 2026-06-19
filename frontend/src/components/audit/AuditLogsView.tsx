import React, { useState, useEffect } from 'react';
import { auditAPI } from '../../services/api';
import type { AuditLog } from '../../types';
import { History, Search, CheckCircle2, ShieldAlert, ShieldAlert as FailIcon } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await auditAPI.list();
      setLogs(data);
    } catch (err) {
       console.error("Error loading audit logs", err);
    } finally {
       setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.status.toLowerCase().includes(term) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  if (loading && logs.length === 0) {
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
          <h1 className="text-2xl font-bold tracking-tight">System Audit Trails</h1>
          <p className="text-xs text-gray-500 mt-1">Review cryptographically timestamped records of security and operational events.</p>
        </div>
      </div>

      <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
        {/* Search bar */}
        <div className="flex items-center gap-2 border border-medical-softgray rounded-xl px-3 py-2.5 bg-medical-graybg focus-within:border-medical-blue/40 w-full md:max-w-xs transition">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by action or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs focus:outline-none w-full"
          />
        </div>

        {/* Audit table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-medical-softgray text-gray-500 font-semibold">
                <th className="pb-3 font-bold">Timestamp</th>
                <th className="pb-3 font-bold">Action Event</th>
                <th className="pb-3 font-bold">Log Details</th>
                <th className="pb-3 font-bold">Response Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-medical-softgray">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-medical-graybg/40 transition text-gray-600">
                  <td className="py-3.5 text-gray-400 font-medium">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-3.5 font-bold text-medical-darktext">{log.action}</td>
                  <td className="py-3.5 text-gray-500 leading-normal max-w-md">{log.details || "No details provided"}</td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                      log.status === 'SUCCESS' 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                      {log.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <ShieldAlert className="w-3 h-3 text-red-500" />
                      )}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    No audit logs match search term.
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
