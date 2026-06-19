import React from 'react';
import { Shield, Activity, Brain, FileText, CheckCircle2, ChevronRight, Cpu, Lock, Layers } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="bg-medical-navy text-white min-h-screen font-sans overflow-x-hidden selection:bg-medical-cyan selection:text-medical-navy">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-medical-blue/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[600px] right-1/4 w-96 h-96 bg-medical-cyan/15 rounded-full blur-[140px] pointer-events-none" />

      <header className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50 bg-medical-navy/80">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medical-blue to-medical-cyan flex items-center justify-center shadow-lg shadow-medical-blue/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">MEDVISION AI</span>
              <span className="block text-[10px] text-medical-cyan tracking-widest uppercase font-semibold">Enterprise Platform</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300 font-medium">
            <a href="#capabilities" className="hover:text-white transition">Capabilities</a>
            <a href="#accuracy" className="hover:text-white transition">Model Accuracy</a>
            <a href="#workflow" className="hover:text-white transition">AI Workflow</a>
            <a href="#security" className="hover:text-white transition">HIPAA & Security</a>
          </nav>
          <button 
            onClick={onEnterApp}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-medical-navy hover:bg-medical-cyan hover:text-medical-navy hover:shadow-cyan shadow-md transition-all duration-300 flex items-center gap-2"
          >
            Launch Sandbox
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-medical-cyan tracking-wider uppercase mb-8 shadow-inner animate-pulse">
          <Activity className="w-3.5 h-3.5" />
          Universal Radiography Diagnosis Suite
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-5xl mx-auto mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-500">
          Universal Medical X-Ray Diagnosis <br/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-medical-blue via-medical-cyan to-emerald-400">Powered by Explainable AI</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-12">
          An enterprise-grade platform enabling hospitals and radiologists to analyze Chest, Bone, Spine, and Dental scans. Automatically route images, obtain instant condition forecasts, and visualize attention layers with Grad-CAM overlays.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onEnterApp}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-medical-blue to-medical-cyan hover:from-medical-cyan hover:to-medical-blue hover:shadow-lg hover:shadow-medical-blue/30 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Access Sandbox Environment
          </button>
          <a 
            href="#capabilities"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            Explore Platform Features
          </a>
        </div>

        {/* Floating Sandbox Preview Card */}
        <div className="mt-20 border border-white/10 rounded-2xl bg-white/5 p-4 backdrop-blur-sm max-w-4xl mx-auto shadow-2xl relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-medical-blue to-medical-cyan rounded-2xl blur opacity-20 pointer-events-none" />
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 text-xs text-gray-400">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span>MEDVISION DIALOG WORKSPACE PREVIEW</span>
            <span className="text-medical-cyan">Active Pipeline: V2.1</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/5">
              {/* Simulated scan with mock Grad-CAM overlay */}
              <div className="absolute inset-0 bg-cover bg-center filter brightness-90 contrast-125" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800')` }} />
              <div className="absolute inset-0 bg-gradient-to-tr from-red-500/50 via-yellow-500/30 to-blue-500/10 mix-blend-color-burn animate-pulse" />
              <div className="absolute bottom-3 right-3 bg-medical-navy/90 border border-white/10 px-2.5 py-1 rounded-md text-[10px] tracking-wider uppercase text-medical-cyan">
                Grad-CAM Layer Active
              </div>
            </div>
            <div className="flex flex-col justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-semibold tracking-wider uppercase">Pneumonia Forecast</span>
                <h3 className="text-xl font-bold text-white mt-2">Acute Alveolar Consolidation</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Deep learning classifiers detected bilateral consolidation markings in the lower lung lobes. The visual attention map isolates the primary inflammatory focus near the right costophrenic angle.
                </p>
              </div>
              <div className="mt-4 border-t border-white/5 pt-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-400">AI Confidence Score:</span>
                  <span className="text-emerald-400 font-bold">96.2%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '96.2%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-24 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Supported Radiography Domains</h2>
            <p className="text-gray-400">
              The platform contains specialized neural networks trained on diverse medical datasets to perform multi-domain diagnoses.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                title: "Chest Analysis",
                desc: "Identify pneumonia, consolidations, nodules, and infiltrations using DenseNet architectures.",
                metrics: "96.2% Accuracy"
              },
              {
                title: "Bone Assessment",
                desc: "Analyze fractures, skeletal anomalies, and joint narrowing across hand, leg, and arm scans.",
                metrics: "95.0% Accuracy"
              },
              {
                title: "Spinal Diagnosis",
                desc: "Assess alignment abnormalities, listhesis, scoliosis, and degenerative disc patterns.",
                metrics: "92.1% Accuracy"
              },
              {
                title: "Dental Inspection",
                desc: "Examine tooth roots, detect cavities, bone resorption, and wisdom tooth impactions.",
                metrics: "91.2% Accuracy"
              }
            ].map((domain, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-medical-cyan/40 transition duration-300 group">
                <div className="text-medical-cyan font-bold text-sm mb-3 uppercase tracking-wider">{domain.metrics}</div>
                <h3 className="text-lg font-bold group-hover:text-medical-cyan transition mb-2">{domain.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{domain.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Workflow Anim Section */}
      <section id="workflow" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Autonomous Diagnostic Workflow</h2>
            <p className="text-gray-400">
              MedVision AI handles images through a strict sequence of validation, classification, and explainability.
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-6 gap-4">
            {[
              { num: "01", name: "Image Upload", info: "DICOM/PNG metadata tags read." },
              { num: "02", name: "Quality Check", info: "Contrast & brightness verification." },
              { num: "03", name: "Type Classifier", info: "Determines scan body region." },
              { num: "04", name: "Specialized CNN", info: "Disease diagnosis prediction." },
              { num: "05", name: "Grad-CAM Hook", info: "Focal heatmaps computed." },
              { num: "06", name: "Report Compiler", info: "Exports signed PDF/CSV briefs." }
            ].map((step, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-5 rounded-xl text-center relative hover:bg-white/10 transition">
                <div className="text-3xl font-extrabold text-white/10 mb-3">{step.num}</div>
                <h4 className="font-bold text-sm mb-1">{step.name}</h4>
                <p className="text-gray-400 text-[11px] leading-relaxed">{step.info}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Architecture Overview */}
      <section className="py-24 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Built on Production-Ready MLOps Architecture</h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              MedVision AI is built to mirror clinical security environments. Model weights are continuously registered, validation files are DVC tracked, and container deployments are health checked for seamless hospital integration.
            </p>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-medical-blue/20 flex items-center justify-center text-medical-cyan shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Continuous Model Tracking</h4>
                  <p className="text-gray-400 text-sm">Full run metrics, weights, and hyperparameter logs piped directly to an MLflow dashboard.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-medical-cyan/20 flex items-center justify-center text-medical-cyan shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Evidently AI Data Drift Checks</h4>
                  <p className="text-gray-400 text-sm">Automated evaluation of input statistics to intercept camera hardware drift and label shift.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm relative">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-medical-cyan">
              <Lock className="w-5 h-5" />
              Security & HIPAA Compliance Compliance
            </h3>
            <ul className="space-y-3.5 text-sm text-gray-300">
              <li className="flex gap-3 items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero-Retention local data loading options.</span>
              </li>
              <li className="flex gap-3 items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>JWT Access tokens and cryptographically hashed passwords.</span>
              </li>
              <li className="flex gap-3 items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Complete platform audit trails logging scan uploads.</span>
              </li>
              <li className="flex gap-3 items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Isolated Docker container isolation to comply with security filters.</span>
              </li>
            </ul>
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
              <span>Platform Encryption: AES-256</span>
              <span>HIPAA BAA Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-medical-navy text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-medical-cyan" />
            <span className="font-bold text-gray-400 tracking-wider">MEDVISION AI</span>
          </div>
          <span>© 2026 MedVision AI Platform. All clinical diagnostics are sandbox simulations.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Security whitepaper</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
