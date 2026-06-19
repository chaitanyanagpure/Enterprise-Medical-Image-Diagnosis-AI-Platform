import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, CheckCircle2, ShieldAlert, KeyRound, User as UserIcon } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  // States
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    
    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const payload: any = { full_name: fullName };
      if (password) {
        payload.password = password;
      }
      await updateProfile(payload);
      setSuccess("Profile settings updated successfully!");
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-xs text-gray-500 mt-1">Configure profile details, modify credentials, and verify security authorization.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-xs text-red-600 rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-5 border border-medical-softgray bg-white rounded-2xl space-y-4">
        <h3 className="font-bold text-sm tracking-wide flex items-center gap-2 border-b border-medical-softgray pb-3">
          <UserIcon className="w-4.5 h-4.5 text-medical-blue" />
          Profile Configuration
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Registered Email</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full border border-medical-softgray rounded-xl px-3 py-2 bg-medical-graybg text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-medical-softgray rounded-xl px-3 py-2 bg-medical-graybg focus:outline-none focus:border-medical-blue"
            />
          </div>

          <div className="border-t border-medical-softgray pt-4 space-y-4">
            <h4 className="font-bold text-xs flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-medical-blue" />
              Update Password
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full border border-medical-softgray rounded-xl px-3 py-2 bg-medical-graybg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full border border-medical-softgray rounded-xl px-3 py-2 bg-medical-graybg focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-medical-blue text-white font-bold rounded-xl text-xs hover:bg-medical-blue/90 disabled:opacity-50 transition"
          >
            {loading ? "Saving Changes..." : "Update Settings"}
          </button>
        </form>
      </div>

    </div>
  );
};
