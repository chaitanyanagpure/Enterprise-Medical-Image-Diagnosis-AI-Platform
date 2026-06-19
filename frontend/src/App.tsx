import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { LoginView } from './components/auth/LoginView';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { AnalysisWorkspace } from './components/analysis/AnalysisWorkspace';
import { PatientsList } from './components/patients/PatientsList';
import { ReportsListView } from './components/reports/ReportsListView';
import { DatasetManager } from './components/datasets/DatasetManager';
import { ModelRegistryView } from './components/models/ModelRegistryView';
import { MonitoringHub } from './components/monitoring/MonitoringHub';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { GitBranch, Terminal, RefreshCw, CheckCircle2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { token, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');

  // Persist active tab across refreshes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Handle auto redirection if token exists on boot or logout
  useEffect(() => {
    if (token) {
      setShowLanding(false);
    } else {
      setShowLanding(true);
      setActiveTab('dashboard');
      localStorage.removeItem('activeTab');
    }
  }, [token]);

  if (loading) {
    return (
      <div className="bg-medical-navy text-white min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-white/20 border-t-medical-cyan rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Landing marketing screen
  if (showLanding && !token) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  // 2. Authentication screen
  if (!token) {
    return <LoginView onLoginSuccess={() => setShowLanding(false)} />;
  }

  // 3. Authenticated layouts portal
  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'analysis' && <AnalysisWorkspace />}
      {activeTab === 'patients' && <PatientsList />}
      {activeTab === 'reports' && <ReportsListView />}
      {activeTab === 'datasets' && <DatasetManager />}
      {activeTab === 'models' && <ModelRegistryView showOnly="models" />}
      {activeTab === 'experiments' && <ModelRegistryView showOnly="experiments" />}

      {/* Dedicated MLOps Pipeline status view */}
      {activeTab === 'pipelines' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">MLOps Automation Pipelines</h1>
            <p className="text-xs text-gray-500 mt-1">Review deployment runners, scheduled training workflows, and container status logs.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual graph */}
            <div className="lg:col-span-2 p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                <GitBranch className="w-4.5 h-4.5 text-medical-blue" />
                Active Deployment Graph
              </h3>
              
              <div className="relative border-l-2 border-dashed border-medical-softgray ml-4 pl-6 space-y-6 py-2 text-xs">
                {[
                  { name: "Data Ingestion (DVC Sync)", desc: "Synchronizes raw S3 images and locks directory hash values.", status: "completed" },
                  { name: "Image Preprocessing", desc: "Resizes source frames and applies CLAHE visual contrast updates.", status: "completed" },
                  { name: "Hyperparameter tuning", desc: "Launches Optuna trial sequences for optimization.", status: "completed" },
                  { name: "Model Training & Registry", desc: "Trains PyTorch CNN modules and commits artifact runs to MLflow.", status: "completed" },
                  { name: "Production deployment", desc: "Updates active FastAPI uvicorn container and executes health checks.", status: "active" }
                ].map((node, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      node.status === 'completed' ? 'border-emerald-500' : 'border-medical-blue animate-pulse'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${node.status === 'completed' ? 'bg-emerald-500' : 'bg-medical-blue'}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-medical-darktext">{node.name}</h4>
                      <p className="text-gray-400 mt-0.5">{node.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Docker runner log brief */}
            <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-medical-blue" />
                Runner Terminal Logs
              </h3>
              <div className="bg-medical-navy text-emerald-400 p-4 rounded-xl font-mono text-[9px] leading-relaxed overflow-x-auto min-h-[260px] max-h-80 border border-white/10 select-none">
                <p className="text-gray-500">// Booting MLOps container seeder v1.0.4</p>
                <p>[INFO] Loaded dataset version v2.0 from S3 bucket</p>
                <p>[INFO] Processing 28,400 clinical image files...</p>
                <p>[INFO] Data quality check: 0 corrupt, 48 duplicates flagged</p>
                <p>[INFO] Resizing images to 224x224 and applying Albumentations</p>
                <p>[INFO] Initializing PyTorch training: Backbones=DenseNet-121</p>
                <p>[INFO] Epoch 10/10 - loss: 0.042 - acc: 0.962 - val_acc: 0.958</p>
                <p>[INFO] Uploading run metrics, params & weights to MLflow registry...</p>
                <p className="text-emerald-300">[SUCCESS] Run ID mlf_run_9843 committed. Accuracy threshold matched.</p>
                <p className="text-emerald-300">[SUCCESS] Pipeline runner execution completed successfully.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && <MonitoringHub />}
      {activeTab === 'audit' && <AuditLogsView />}
      {activeTab === 'settings' && <SettingsView />}
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
