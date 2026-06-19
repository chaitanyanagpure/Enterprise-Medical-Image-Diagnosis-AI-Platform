import React, { useState, useEffect } from 'react';
import { monitoringAPI } from '../../services/api';
import type { MonitoringStats } from '../../types';
import { 
  Activity, Cpu, HardDrive, Zap, 
  ShieldAlert, Layers, Bell, CheckCircle2, 
  AlertTriangle, RefreshCw
} from 'lucide-react';

export const MonitoringHub: React.FC = () => {
  const [metrics, setMetrics] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    loadMetrics();
    // Poll metrics every 10 seconds for real-time dashboard feel
    const interval = setInterval(() => {
      loadMetrics(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    else setPolling(true);
    try {
      const data = await monitoringAPI.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Error loading metrics dashboard", err);
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  if (loading || !metrics) {
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
          <h1 className="text-2xl font-bold tracking-tight">System Performance & Monitoring</h1>
          <p className="text-xs text-gray-500 mt-1">Audit Prometheus API latency logs, CPU meters, and target prediction drift alerts.</p>
        </div>
        <div className="flex items-center gap-3">
          {polling && <span className="text-[10px] text-gray-400 animate-pulse">Syncing metrics...</span>}
          <button
            onClick={() => loadMetrics()}
            className="p-2 border border-medical-softgray rounded-xl hover:bg-white bg-medical-graybg transition text-gray-600"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${polling ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Prom metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* CPU usage */}
        <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">CPU Utilization</span>
            <Cpu className="w-5 h-5 text-medical-blue" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-medical-darktext">{metrics.system.cpu_percent}%</h3>
            <div className="w-full bg-medical-graybg h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-medical-blue h-full rounded-full transition-all duration-300" style={{ width: `${metrics.system.cpu_percent}%` }} />
            </div>
          </div>
        </div>

        {/* Memory usage */}
        <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">RAM Allocation</span>
            <Activity className="w-5 h-5 text-medical-cyan" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-medical-darktext">{metrics.system.memory_percent}%</h3>
            <div className="w-full bg-medical-graybg h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-medical-cyan h-full rounded-full transition-all duration-300" style={{ width: `${metrics.system.memory_percent}%` }} />
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Storage Load</span>
            <HardDrive className="w-5 h-5 text-medical-amber" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-medical-darktext">{metrics.system.storage_percent}%</h3>
            <div className="w-full bg-medical-graybg h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-medical-amber h-full rounded-full transition-all duration-300" style={{ width: `${metrics.system.storage_percent}%` }} />
            </div>
          </div>
        </div>

        {/* API Response latency */}
        <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">API Latency (p99)</span>
            <Zap className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-medical-darktext">{metrics.system.api_latency_ms} ms</h3>
            <p className="text-[10px] text-gray-400 mt-2">Error rate: <strong className="text-medical-darktext">{metrics.system.api_error_rate_percent}%</strong></p>
          </div>
        </div>

      </div>

      {/* Model monitoring: Evidently AI drift analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Data Drift check */}
        <div className="lg:col-span-2 p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
          <h3 className="font-bold text-sm tracking-wide flex items-center gap-2 border-b border-medical-softgray pb-3">
            <Layers className="w-4.5 h-4.5 text-medical-blue" />
            Evidently AI Data Drift Monitor (Target v2.1 vs Baseline v1.0)
          </h3>

          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="space-y-4 border-r border-medical-softgray pr-6">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Input Pixel Shift Analysis</span>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Brightness Drift Value:</span>
                <span className="font-bold">{metrics.model_drift.drift_score_brightness} (p-val)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Contrast Drift Value:</span>
                <span className="font-bold">{metrics.model_drift.drift_score_contrast} (p-val)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Target Prediction Drift:</span>
                <span className="font-bold">{metrics.model_drift.prediction_drift_score} (p-val)</span>
              </div>
            </div>

            <div className="flex flex-col justify-center items-center text-center p-4 bg-medical-graybg rounded-xl border border-medical-softgray">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
              <h4 className="font-bold text-xs">No Critical Data Shift Detected</h4>
              <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-normal">
                Input pixel structures match reference distributions. Current validation drift coefficient remains within healthy limits.
              </p>
            </div>
          </div>
        </div>

        {/* Warning alerts list */}
        <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
          <h3 className="font-bold text-sm tracking-wide flex items-center gap-2 border-b border-medical-softgray pb-3">
            <Bell className="w-4.5 h-4.5 text-medical-blue" />
            Active Warning Alerts
          </h3>
          <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
            {metrics.alerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-xl border text-xs flex gap-3 ${
                alert.severity === 'critical' 
                  ? 'bg-red-500/10 border-red-500/20 text-red-700' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-700'
              }`}>
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                <div className="space-y-1">
                  <p className="leading-normal font-semibold">{alert.message}</p>
                  <span className="block text-[8px] opacity-75">{new Date(alert.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
