import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientAPI, scanAPI } from '../../services/api';
import type { Patient, Scan } from '../../types';
import { 
  LayoutDashboard, 
  Binary, 
  Users, 
  FileCheck, 
  Database, 
  BrainCircuit, 
  FlaskConical,
  GitBranch, 
  Activity, 
  History, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Global search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ patients: Patient[], scans: Scan[] }>({ patients: [], scans: [] });
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      setSearchDropdownOpen(true);
      try {
        const [matchedPatients, allScans] = await Promise.all([
          patientAPI.list(val),
          scanAPI.list()
        ]);
        const term = val.toLowerCase();
        const matchedScans = allScans.filter((scan: Scan) => {
          const condMatch = scan.diagnosis?.condition.toLowerCase().includes(term);
          const typeMatch = scan.detected_type?.toLowerCase().includes(term);
          const scanIdMatch = scan.id.toLowerCase().includes(term);
          return condMatch || typeMatch || scanIdMatch;
        });
        setSearchResults({ patients: matchedPatients, scans: matchedScans });
      } catch (err) {
        console.error("Global search failed", err);
      }
    } else {
      setSearchResults({ patients: [], scans: [] });
      setSearchDropdownOpen(false);
    }
  };

  // List of mock notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Diagnostic run completed for patient MED-829410", time: "5 mins ago", read: false },
    { id: 2, text: "New report PDF generated for patient MED-104928", time: "2 hrs ago", read: false },
    { id: 3, text: "System Alert: Model ChestNet-V2 promoted to production", time: "1 day ago", read: true }
  ]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis', label: 'X-Ray Analysis', icon: Binary },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileCheck },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'models', label: 'AI Models', icon: BrainCircuit },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical },
    { id: 'pipelines', label: 'MLOps Pipeline', icon: GitBranch },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'audit', label: 'Activity Logs', icon: History, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || user?.role === 'admin');
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-medical-graybg text-medical-darktext font-sans overflow-hidden">
      
      {/* 1. Mobile Sidebar Backdrop */}
      {!sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* 2. Sidebar Component */}
      <aside className={`fixed md:relative top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-medical-navy text-gray-400 border-r border-white/5 transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-medical-blue to-medical-cyan flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-wider">MEDVISION AI</span>
              <span className="block text-[8px] text-medical-cyan tracking-widest uppercase font-semibold">Sandbox Portal</span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active 
                    ? 'bg-medical-blue text-white shadow-md shadow-medical-blue/20' 
                    : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-medical-blue/20 border border-medical-cyan/30 flex items-center justify-center text-medical-cyan shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-sm font-bold text-white truncate">{user?.full_name}</span>
              <span className="block text-[10px] text-gray-500 capitalize">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </aside>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-medical-softgray bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg text-medical-navy hover:bg-medical-graybg transition"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2 border border-medical-softgray rounded-xl px-3.5 py-2 w-64 bg-medical-graybg focus-within:border-medical-blue/50 transition relative">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Global Search..." 
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => { if (searchQuery.trim().length >= 2) setSearchDropdownOpen(true); }}
                className="bg-transparent border-none focus:outline-none text-xs text-medical-darktext placeholder-gray-400 w-full"
              />

              {searchDropdownOpen && (searchQuery.trim().length >= 2) && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setSearchDropdownOpen(false)} 
                  />
                  <div className="absolute left-0 top-11 w-72 max-h-96 overflow-y-auto rounded-2xl border border-medical-softgray bg-white/95 backdrop-blur shadow-2xl p-4 z-50 mt-1 select-none">
                    <div className="space-y-4">
                      {/* Patients Section */}
                      <div>
                        <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Patients</h4>
                        {searchResults.patients.length === 0 ? (
                          <p className="text-gray-400 text-[11px] py-0.5">No matching patients</p>
                        ) : (
                          <div className="space-y-1">
                            {searchResults.patients.slice(0, 5).map(pat => (
                              <button
                                key={pat.id}
                                onClick={() => {
                                  localStorage.setItem('globalPatientSearch', pat.full_name);
                                  setActiveTab('patients');
                                  setSearchDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-medical-blue/5 hover:text-medical-blue transition text-xs text-gray-600 font-semibold truncate block"
                              >
                                <span className="block font-bold truncate">{pat.full_name}</span>
                                <span className="block text-[8px] text-gray-400 font-medium truncate">{pat.patient_id}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Scans & Reports Section */}
                      <div>
                        <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Reports & Scans</h4>
                        {searchResults.scans.length === 0 ? (
                          <p className="text-gray-400 text-[11px] py-0.5">No matching reports</p>
                        ) : (
                          <div className="space-y-1">
                            {searchResults.scans.slice(0, 5).map(scan => (
                              <button
                                key={scan.id}
                                onClick={() => {
                                  localStorage.setItem('globalReportSearch', scan.diagnosis?.condition || scan.id);
                                  setActiveTab('reports');
                                  setSearchDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-medical-blue/5 hover:text-medical-blue transition text-xs text-gray-600 font-semibold truncate block"
                              >
                                <span className="block font-bold truncate">{scan.diagnosis?.condition || "Scan"} ({scan.detected_type})</span>
                                <span className="block text-[8px] text-gray-400 font-medium truncate">ID: {scan.id.substring(0, 8)}...</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification triggers */}
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2.5 rounded-xl border border-medical-softgray hover:bg-medical-graybg relative transition text-gray-600"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-medical-rose border-2 border-white rounded-full" />
              )}
            </button>

            {/* Notification Box */}
            {notificationsOpen && (
              <>
                <div onClick={() => setNotificationsOpen(false)} className="fixed inset-0 z-50 bg-transparent" />
                <div className="absolute right-0 top-12 w-80 rounded-2xl border border-medical-softgray bg-white shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between border-b border-medical-softgray pb-2.5 mb-3">
                    <span className="font-bold text-sm">Notifications</span>
                    <button 
                      onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                      className="text-[10px] text-medical-blue font-bold hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {notifications.map(item => (
                      <div key={item.id} className={`p-2.5 rounded-xl text-xs border transition ${item.read ? 'bg-transparent border-transparent text-gray-500' : 'bg-medical-blue/5 border-medical-blue/10 text-medical-darktext'}`}>
                        <p className="leading-normal">{item.text}</p>
                        <span className="block text-[9px] text-gray-400 mt-1">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-medical-blue/10 flex items-center justify-center text-medical-blue font-bold text-sm uppercase">
                {user?.full_name ? user.full_name.substring(0, 2) : "MV"}
              </div>
              <span className="hidden md:inline text-xs font-bold text-gray-600">{user?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-6 bg-medical-graybg">
          {children}
        </main>
      </div>
    </div>
  );
};
