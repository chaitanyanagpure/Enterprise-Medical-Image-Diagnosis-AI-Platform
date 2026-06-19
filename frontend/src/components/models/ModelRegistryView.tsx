import React, { useState, useEffect } from 'react';
import { modelAPI } from '../../services/api';
import type { ModelRegistry } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  Cpu, GitPullRequest, ArrowUpRight, Flame, 
  Settings, CheckCircle2, ChevronRight, Activity, 
  FlaskConical, RefreshCw, BarChart4, AlertTriangle
} from 'lucide-react';

interface ModelRegistryViewProps {
  showOnly?: 'models' | 'experiments';
}

export const ModelRegistryView: React.FC<ModelRegistryViewProps> = ({ showOnly }) => {
  const { user } = useAuth();
  const [models, setModels] = useState<ModelRegistry[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState<string | null>(null);

  useEffect(() => {
    loadModelsAndRuns();
  }, []);

  const loadModelsAndRuns = async () => {
    try {
      const modelList = await modelAPI.list();
      const runList = await modelAPI.getExperiments();
      setModels(modelList);
      setExperiments(runList);
    } catch (err) {
      console.error("Error loading models registry", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (id: string, stage: string) => {
    try {
      await modelAPI.promote(id, stage);
      loadModelsAndRuns();
    } catch (err) {
      alert("Permission Denied: Only platform administrators can change registry stages.");
    }
  };

  const handleTriggerTraining = async () => {
    setIsTraining(true);
    setTrainMessage(null);
    try {
      const res = await modelAPI.triggerTraining();
      setTrainMessage(res.message);
      loadModelsAndRuns();
    } catch (err) {
      alert("Trigger pipeline failed.");
    } finally {
      setIsTraining(false);
    }
  };

  const getStageColor = (stage: string) => {
    const maps: Record<string, string> = {
      production: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
      staging: "bg-medical-blue/10 text-medical-blue border border-medical-blue/20",
      development: "bg-gray-100 text-gray-500 border border-gray-200",
      archived: "bg-red-500/10 text-red-500 border border-red-500/20"
    };
    return maps[stage.toLowerCase()] || "bg-gray-100 text-gray-400";
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
          <h1 className="text-2xl font-bold tracking-tight">
            {showOnly === 'experiments' ? "Experiment Tracking" : "Model Registry"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {showOnly === 'experiments' 
              ? "Review hyperparameter sets, check metrics graphs, and compare training runs."
              : "Manage AI model stages, trigger training pipelines, and review active endpoint production states."
            }
          </p>
        </div>
        
        {user?.role === 'admin' && (
          <button
            onClick={handleTriggerTraining}
            disabled={isTraining}
            className="px-4 py-2.5 bg-gradient-to-r from-medical-blue to-medical-cyan text-white rounded-xl text-xs font-bold hover:shadow-md transition disabled:opacity-50 flex items-center gap-2"
          >
            {isTraining ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Flame className="w-4 h-4" />
            )}
            Trigger Retraining Pipeline
          </button>
        )}
      </div>

      {trainMessage && (
         <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 rounded-xl flex items-center gap-3">
           <CheckCircle2 className="w-4 h-4 shrink-0" />
           <span>{trainMessage}</span>
         </div>
      )}

      {/* Main Registry Catalog */}
      {showOnly !== 'experiments' && (
        <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
          <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
            <Cpu className="w-4.5 h-4.5 text-medical-blue" />
            Active Model Endpoint Registry
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-medical-softgray text-gray-500 font-semibold">
                  <th className="pb-3 font-bold">Model Name</th>
                  <th className="pb-3 font-bold">Version</th>
                  <th className="pb-3 font-bold">Architecture</th>
                  <th className="pb-3 font-bold">F1 Score</th>
                  <th className="pb-3 font-bold">Accuracy</th>
                  <th className="pb-3 font-bold">Active Stage</th>
                  <th className="pb-3 text-right font-bold pr-4">Promotion Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-medical-softgray">
                {models.map((model) => (
                  <tr key={model.id} className="hover:bg-medical-graybg/40 transition">
                    <td className="py-3.5 font-bold text-medical-darktext">{model.name}</td>
                    <td className="py-3.5 font-semibold text-gray-400">v{model.version}</td>
                    <td className="py-3.5 text-gray-500 font-medium">{model.architecture}</td>
                    <td className="py-3.5 font-bold text-medical-blue">{Math.round(model.f1_score * 1000) / 10}%</td>
                    <td className="py-3.5 font-bold text-emerald-500">{Math.round(model.accuracy * 1000) / 10}%</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getStageColor(model.stage)}`}>
                        {model.stage}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      {user?.role === 'admin' ? (
                        <select
                          value={model.stage}
                          onChange={(e) => handlePromote(model.id, e.target.value)}
                          className="py-1.5 px-2 border border-medical-softgray rounded-lg text-[10px] bg-white focus:outline-none focus:border-medical-blue"
                        >
                          <option value="development">Dev</option>
                          <option value="staging">Staging</option>
                          <option value="production">Prod</option>
                          <option value="archived">Archive</option>
                        </select>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium italic">Admin restricted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MLflow Experiments comparison grid */}
      {showOnly !== 'models' && (
        <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
          <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
            <FlaskConical className="w-4.5 h-4.5 text-medical-blue" />
            MLflow Experiment Dashboard (Hyperparameter & Runs Tracker)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {experiments.map((run, idx) => (
              <div key={idx} className="p-4 border border-medical-softgray rounded-2xl bg-medical-graybg/20 space-y-4 hover:border-medical-blue/20 transition">
                <div className="flex justify-between items-center border-b border-medical-softgray pb-2.5">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{run.run_id}</span>
                    <h4 className="font-bold text-xs mt-0.5 text-medical-darktext">{run.name}</h4>
                  </div>
                  <span className="text-[10px] font-bold text-medical-blue bg-medical-blue/10 px-2 py-0.5 rounded">
                    Dataset: {run.dataset_version}
                  </span>
                </div>

                {/* Hyperparams and Metrics split */}
                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  {/* Hyperparams */}
                  <div className="space-y-1.5 border-r border-medical-softgray pr-4">
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Hyperparameters</span>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Optimizer:</span>
                      <span className="font-semibold">{run.hyperparams.optimizer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Learning Rate:</span>
                      <span className="font-semibold">{run.hyperparams.lr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Batch Size:</span>
                      <span className="font-semibold">{run.hyperparams.batch_size}</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Metrics Forecast</span>
                    <div className="flex justify-between">
                      <span className="text-gray-500">F1-Score:</span>
                      <span className="font-bold text-medical-blue">{Math.round(run.metrics.f1_score * 1000) / 10}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Accuracy:</span>
                      <span className="font-bold text-emerald-500">{Math.round(run.metrics.accuracy * 1000) / 10}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recall:</span>
                      <span className="font-semibold">{Math.round(run.metrics.recall * 1000) / 10}%</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-medical-softgray pt-2 flex justify-between items-center text-[9px] text-gray-400">
                  <span>Training: {Math.round(run.training_time_secs / 360) / 10} hrs</span>
                  <span>Date: {new Date(run.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
