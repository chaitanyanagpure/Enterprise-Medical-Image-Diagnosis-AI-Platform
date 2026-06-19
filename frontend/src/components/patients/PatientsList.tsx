import React, { useState, useEffect } from 'react';
import { patientAPI } from '../../services/api';
import type { Patient, Scan } from '../../types';
import { 
  Users, Search, UserPlus, Calendar, 
  ChevronRight, ArrowLeft, History, HeartPulse, 
  FileSpreadsheet, ClipboardList, Info, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PatientsList: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail panel state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientScans, setPatientScans] = useState<Scan[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);

  // Register form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [medHistory, setMedHistory] = useState('');

  useEffect(() => {
    const storedSearch = localStorage.getItem('globalPatientSearch');
    if (storedSearch) {
      setSearchQuery(storedSearch);
      loadPatients(storedSearch);
      localStorage.removeItem('globalPatientSearch');
    } else {
      loadPatients();
    }
  }, []);

  const loadPatients = async (query?: string) => {
    setLoading(true);
    try {
      const data = await patientAPI.list(query);
      setPatients(data);
    } catch (err) {
      console.error("Error fetching patients list", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    loadPatients(e.target.value);
  };

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setLoadingScans(true);
    try {
      const scans = await patientAPI.getScans(patient.id);
      setPatientScans(scans);
    } catch (err) {
       console.error("Error loading patient scans", err);
    } finally {
       setLoadingScans(false);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await patientAPI.create({
        full_name: fullName,
        date_of_birth: dob,
        gender,
        medical_history: medHistory
      });
      // Clear forms
      setFullName('');
      setDob('');
      setGender('Male');
      setMedHistory('');
      setShowAddForm(false);
      loadPatients();
    } catch (err) {
       alert("Failed to register patient profile.");
    }
  };

  const handleDeletePatient = async (id: string) => {
     if (window.confirm("Are you sure you want to permanently delete this patient file? All scan history will be deleted.")) {
       try {
         await patientAPI.delete(id);
         setSelectedPatient(null);
         loadPatients();
       } catch (err) {
         alert("Permission denied. Deletion is restricted to system administrators.");
       }
     }
  };

  if (loading && patients.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-medical-softgray border-t-medical-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      {!selectedPatient ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Patient Directory</h1>
            <p className="text-xs text-gray-500 mt-1">Register new patients, view histories, and inspect chronological scan timelines.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 bg-medical-blue text-white rounded-xl text-xs font-bold hover:bg-medical-blue/90 shadow-md shadow-medical-blue/15 transition flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Register Patient
          </button>
        </div>
      ) : (
        <button
          onClick={() => setSelectedPatient(null)}
          className="flex items-center gap-2 text-xs font-bold text-medical-blue hover:underline mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>
      )}

      {/* 2. Registration Modal */}
      {showAddForm && (
        <>
          <div onClick={() => setShowAddForm(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <div className="fixed inset-x-4 top-10 md:top-24 max-w-lg md:mx-auto z-50 bg-white border border-medical-softgray p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-medical-softgray pb-3">
              <h3 className="font-bold text-sm">Register New Patient File</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full border border-medical-softgray rounded-xl px-3 py-2 text-xs bg-medical-graybg focus:outline-none focus:border-medical-blue/45"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full border border-medical-softgray rounded-xl px-3 py-2 text-xs bg-medical-graybg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border border-medical-softgray rounded-xl px-3 py-2 text-xs bg-medical-graybg focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Clinical History</label>
                <textarea
                  value={medHistory}
                  onChange={(e) => setMedHistory(e.target.value)}
                  placeholder="Record pre-existing respiratory conditions, surgeries, or drug allergies..."
                  className="w-full border border-medical-softgray rounded-xl px-3 py-2 text-xs bg-medical-graybg min-h-[80px] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-medical-blue text-white font-bold rounded-xl text-xs hover:bg-medical-blue/95 transition"
              >
                Create Patient Profile
              </button>
            </form>
          </div>
        </>
      )}

      {/* 3. Main directory table */}
      {!selectedPatient ? (
        <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border border-medical-softgray rounded-xl px-3 py-2.5 bg-medical-graybg focus-within:border-medical-blue/40 w-full md:max-w-xs transition">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or MED-ID..."
              value={searchQuery}
              onChange={handleSearch}
              className="bg-transparent border-none text-xs focus:outline-none w-full"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-medical-softgray text-gray-500 font-semibold">
                  <th className="pb-3 font-bold">MED-ID</th>
                  <th className="pb-3 font-bold">Patient Name</th>
                  <th className="pb-3 font-bold">Date of Birth</th>
                  <th className="pb-3 font-bold">Gender</th>
                  <th className="pb-3 font-bold">Registration Date</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-medical-softgray">
                {patients.map((pat) => (
                  <tr 
                    key={pat.id} 
                    onClick={() => handlePatientSelect(pat)}
                    className="hover:bg-medical-graybg/50 cursor-pointer transition group"
                  >
                    <td className="py-3.5 font-semibold text-medical-blue">{pat.patient_id}</td>
                    <td className="py-3.5 font-bold text-medical-darktext">{pat.full_name}</td>
                    <td className="py-3.5 text-gray-500">{pat.date_of_birth}</td>
                    <td className="py-3.5 text-gray-500">{pat.gender}</td>
                    <td className="py-3.5 text-gray-400">{new Date(pat.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 text-right pr-2">
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-medical-blue group-hover:translate-x-0.5 transition-all" />
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No patients matched search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 4. Patient Detail panel & scans timeline */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Patient Card */}
          <div className="lg:col-span-1 p-5 border border-medical-softgray bg-white rounded-2xl space-y-4 h-fit">
            <div className="flex justify-between items-start border-b border-medical-softgray pb-3">
              <div>
                <span className="text-[10px] font-bold text-medical-blue uppercase tracking-widest">{selectedPatient.patient_id}</span>
                <h2 className="text-xl font-bold text-medical-darktext mt-1">{selectedPatient.full_name}</h2>
              </div>
              {user?.role === 'admin' && (
                <button
                  onClick={() => handleDeletePatient(selectedPatient.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-medical-rose hover:bg-medical-rose/5 border border-transparent hover:border-medical-rose/10 transition"
                  title="Delete patient profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Birth Date:</span>
                <span className="font-semibold">{selectedPatient.date_of_birth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gender:</span>
                <span className="font-semibold">{selectedPatient.gender}</span>
              </div>
              
              <div className="border-t border-medical-softgray pt-3">
                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Clinical History</span>
                <div className="p-3 bg-medical-graybg border border-medical-softgray rounded-xl leading-relaxed text-gray-600">
                   {selectedPatient.medical_history || "No medical history recorded."}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2 p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-2 border-b border-medical-softgray pb-3">
              <History className="w-4.5 h-4.5 text-medical-blue" />
              Radiography Timeline
            </h3>

            {loadingScans ? (
              <div className="py-12 flex justify-center">
                <span className="w-6 h-6 border-2 border-medical-softgray border-t-medical-blue rounded-full animate-spin" />
              </div>
            ) : patientScans.length === 0 ? (
               <div className="py-12 text-center text-gray-400 text-xs">
                 No scan records registered under this patient profile.
               </div>
            ) : (
               <div className="relative border-l border-medical-softgray ml-3 pl-6 space-y-6 py-2">
                 {patientScans.map((scan) => {
                   const severityColors: Record<string, string> = {
                     normal: "text-emerald-500",
                     low: "text-blue-500",
                     medium: "text-amber-500",
                     high: "text-red-500"
                   };
                   const sevColor = severityColors[scan.diagnosis?.severity_level.toLowerCase() || 'normal'];
                   
                   return (
                     <div key={scan.id} className="relative group">
                       {/* Timeline dot */}
                       <div className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-medical-blue group-hover:scale-125 transition-transform" />
                       
                       <div className="p-4 border border-medical-softgray rounded-xl hover:border-medical-blue/30 hover:shadow-sm bg-medical-graybg/30 transition">
                         <div className="flex justify-between items-start text-xs border-b border-medical-softgray pb-2 mb-3">
                           <div>
                             <span className="font-bold uppercase tracking-wider text-medical-blue">{scan.detected_type} X-ray</span>
                             <span className="text-[10px] text-gray-400 ml-2">({new Date(scan.created_at).toLocaleString()})</span>
                           </div>
                           <span className={`font-bold capitalize ${sevColor}`}>
                             {scan.diagnosis?.condition}
                           </span>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                           <div className="sm:col-span-1 aspect-square max-w-[80px] rounded-lg overflow-hidden bg-black border border-gray-200">
                             <img src={scan.heatmap_image_url} alt="Heatmap" className="object-cover w-full h-full" />
                           </div>
                           <div className="sm:col-span-3 text-xs text-gray-600 leading-relaxed">
                             <p className="line-clamp-2">{scan.diagnosis?.explanation}</p>
                             <div className="mt-2.5 flex items-center gap-3">
                               <span className="text-[10px] bg-white border px-2 py-0.5 rounded text-gray-400">
                                 Confidence: <strong className="text-medical-darktext">{Math.round((scan.diagnosis?.prediction_confidence || 0) * 100)}%</strong>
                               </span>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
