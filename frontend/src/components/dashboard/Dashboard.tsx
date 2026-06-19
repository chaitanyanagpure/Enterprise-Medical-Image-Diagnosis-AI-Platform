import React, { useEffect, useState } from 'react';
import { scanAPI, modelAPI } from '../../services/api';
import type { Scan, ModelRegistry } from '../../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts';
import { Activity, ShieldCheck, ShieldAlert, Cpu, Sparkles, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [models, setModels] = useState<ModelRegistry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const scanList = await scanAPI.list();
        const modelList = await modelAPI.list();
        setScans(scanList);
        setModels(modelList);
      } catch (err) {
        console.error("Error loading dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute stats
  const totalScans = scans.length;
  const displayTotal = totalScans;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const displayToday = scans.filter(scan => new Date(scan.created_at) >= todayStart).length;

  const diagnosedScans = scans.filter(scan => scan.status === 'completed' && scan.diagnosis);
  const avgConfidenceVal = diagnosedScans.length > 0
    ? diagnosedScans.reduce((acc, scan) => acc + (scan.diagnosis?.prediction_confidence || 0), 0) / diagnosedScans.length
    : 0;
  const avgConfidence = (avgConfidenceVal * 100).toFixed(1);

  const activeModels = models.filter(m => m.stage === 'production').length;
  
  // Recharts dynamic data structures for elegant display based on actual data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const timelineData = last7Days.map(date => {
    const dayLabel = weekdays[date.getDay()];
    const dayScans = scans.filter(scan => {
      const scanDate = new Date(scan.created_at);
      return (
        scanDate.getDate() === date.getDate() &&
        scanDate.getMonth() === date.getMonth() &&
        scanDate.getFullYear() === date.getFullYear()
      );
    });

    const chestCount = dayScans.filter(s => s.detected_type === 'chest').length;
    const boneCount = dayScans.filter(s => s.detected_type === 'bone').length;
    const spineCount = dayScans.filter(s => s.detected_type === 'spine').length;
    const dentalCount = dayScans.filter(s => s.detected_type === 'dental').length;

    return {
      name: dayLabel,
      Chest: chestCount,
      Bone: boneCount,
      Spine: spineCount,
      Dental: dentalCount,
    };
  });

  const chestTotal = scans.filter(s => s.detected_type === 'chest').length;
  const boneTotal = scans.filter(s => s.detected_type === 'bone').length;
  const spineTotal = scans.filter(s => s.detected_type === 'spine').length;
  const dentalTotal = scans.filter(s => s.detected_type === 'dental').length;

  const categoryDistribution = [
    { name: 'Chest X-Ray', value: totalScans > 0 ? Math.round((chestTotal / totalScans) * 100) : 0, color: '#2563EB' },
    { name: 'Bone X-Ray', value: totalScans > 0 ? Math.round((boneTotal / totalScans) * 100) : 0, color: '#06B6D4' },
    { name: 'Spine X-Ray', value: totalScans > 0 ? Math.round((spineTotal / totalScans) * 100) : 0, color: '#F59E0B' },
    { name: 'Dental X-Ray', value: totalScans > 0 ? Math.round((dentalTotal / totalScans) * 100) : 0, color: '#EF4444' },
  ];

  const diagnosedCount = diagnosedScans.length;
  const normalCount = diagnosedScans.filter(s => s.diagnosis?.severity_level === 'normal').length;
  const lowCount = diagnosedScans.filter(s => s.diagnosis?.severity_level === 'low').length;
  const mediumCount = diagnosedScans.filter(s => s.diagnosis?.severity_level === 'medium').length;
  const highCount = diagnosedScans.filter(s => s.diagnosis?.severity_level === 'high').length;

  const conditionDistribution = [
    { name: 'Normal', value: diagnosedCount > 0 ? Math.round((normalCount / diagnosedCount) * 100) : 0, color: '#10B981' },
    { name: 'Abnormal (Low)', value: diagnosedCount > 0 ? Math.round((lowCount / diagnosedCount) * 100) : 0, color: '#3B82F6' },
    { name: 'Abnormal (Medium)', value: diagnosedCount > 0 ? Math.round((mediumCount / diagnosedCount) * 100) : 0, color: '#F59E0B' },
    { name: 'Abnormal (High)', value: diagnosedCount > 0 ? Math.round((highCount / diagnosedCount) * 100) : 0, color: '#EF4444' }
  ];

  const accuracyData = models.map(m => ({
    name: `${m.name} v${m.version}`,
    Accuracy: m.accuracy,
    F1: m.f1_score,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-white/50 rounded-lg animate-pulse w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
             <div key={i} className="h-32 bg-white/80 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-white/80 rounded-2xl animate-pulse" />
          <div className="h-96 bg-white/80 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Analytics</h1>
          <p className="text-xs text-gray-500 mt-1">Real-time radiography statistics and core model diagnostic indexes.</p>
        </div>
        <div className="flex gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            Database Connected
          </span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: "Total Scans Analyzed", value: displayTotal, change: "Total database records", icon: Activity, color: "text-medical-blue bg-medical-blue/5 border-medical-blue/10" },
          { title: "Today's Active Scans", value: displayToday, change: "Current workspace queue", icon: Sparkles, color: "text-medical-cyan bg-medical-cyan/5 border-medical-cyan/10" },
          { title: "Avg Diagnostic Confidence", value: `${avgConfidence}%`, change: "Across active classes", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-500/5 border-emerald-500/10" },
          { title: "Production AI Models", value: activeModels, change: "Registered endpoints active", icon: Cpu, color: "text-medical-amber bg-medical-amber/5 border-medical-amber/10" }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`p-5 rounded-2xl border bg-white ${card.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">{card.title}</span>
                <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-medical-darktext">{card.value}</h3>
                <p className="text-[10px] text-gray-400 mt-1">{card.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly scan uploads */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-medical-softgray bg-white flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-sm tracking-wide">Weekly Scan Trends</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Scans volume segmented by radiography category.</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorChest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSpine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDental" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Chest" stroke="#2563EB" fillOpacity={1} fill="url(#colorChest)" strokeWidth={2} />
                <Area type="monotone" dataKey="Bone" stroke="#06B6D4" fillOpacity={1} fill="url(#colorBone)" strokeWidth={2} />
                <Area type="monotone" dataKey="Spine" stroke="#F59E0B" fillOpacity={1} fill="url(#colorSpine)" strokeWidth={2} />
                <Area type="monotone" dataKey="Dental" stroke="#EF4444" fillOpacity={1} fill="url(#colorDental)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="p-5 rounded-2xl border border-medical-softgray bg-white flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide">Radiography Categories</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Percentage distribution of uploads.</p>
          </div>
          <div className="h-60 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-medical-darktext">{totalScans}</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">Total Scans</span>
            </div>
          </div>
          <div className="space-y-1.5">
             {categoryDistribution.map((item, i) => (
               <div key={i} className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                   <span className="text-gray-500 font-medium">{item.name}</span>
                 </div>
                 <span className="font-bold">{item.value}%</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Severity conditions ratios */}
        <div className="p-5 rounded-2xl border border-medical-softgray bg-white flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide">Severity Distribution</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Percentage split of findings classification.</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conditionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={75}
                  dataKey="value"
                >
                  {conditionDistribution.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
             {conditionDistribution.map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-[10px]">
                 <span className="w-2.5 h-2.5 rounded-md shrink-0" style={{ backgroundColor: item.color }} />
                 <span className="text-gray-500 truncate">{item.name}: <strong>{item.value}%</strong></span>
               </div>
             ))}
          </div>
        </div>

        {/* Model accuracy pipeline iterations */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-medical-softgray bg-white flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide">Model Tuning Performance</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Training metrics improvement across pipelines versions.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis domain={[0.80, 1.00]} stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line type="monotone" dataKey="Accuracy" name="Accuracy" stroke="#2563EB" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="F1" name="F1-Score" stroke="#06B6D4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
