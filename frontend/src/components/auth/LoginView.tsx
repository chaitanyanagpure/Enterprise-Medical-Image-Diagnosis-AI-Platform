import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Mail, UserPlus, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'doctor' | 'admin'>('doctor');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signup({
          email,
          password,
          full_name: fullName,
          role
        });
        setSuccess('Registration successful! Please sign in using your credentials.');
        setIsSignUp(false);
        setPassword('');
      } else {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        await login(formData);
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-medical-navy text-white min-h-screen flex items-center justify-center px-4 relative">
      {/* Background blur dots */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-medical-blue/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-medical-cyan/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-medical-blue to-medical-cyan rounded-2xl blur opacity-10 pointer-events-none" />
        
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-medical-blue to-medical-cyan items-center justify-center shadow-lg shadow-medical-blue/20 mb-4">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isSignUp ? 'Create Diagnostic Account' : 'Sign In to MedVision AI'}
          </h2>
          <p className="text-xs text-gray-400 mt-2">
            {isSignUp ? 'Register as doctor or administrator' : 'Access universal radiology workspace'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-medical-cyan/50 focus:outline-none text-sm transition"
                  placeholder="Dr. Alexander Fleming"
                />
                <span className="absolute left-3.5 top-3.5 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-medical-cyan/50 focus:outline-none text-sm transition"
                placeholder="doctor@hospital.org"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-medical-cyan/50 focus:outline-none text-sm transition"
                placeholder="••••••••••••"
              />
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Assign Platform Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`py-3 rounded-xl border text-sm font-semibold transition ${role === 'doctor' ? 'bg-medical-blue/20 border-medical-blue text-white' : 'bg-transparent border-white/10 text-gray-400 hover:border-white/20'}`}
                >
                  Medical Doctor
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-3 rounded-xl border text-sm font-semibold transition ${role === 'admin' ? 'bg-medical-blue/20 border-medical-blue text-white' : 'bg-transparent border-white/10 text-gray-400 hover:border-white/20'}`}
                >
                  System Admin
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl font-bold bg-gradient-to-r from-medical-blue to-medical-cyan text-white hover:opacity-95 hover:shadow-lg hover:shadow-medical-blue/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Complete Registration' : 'Authenticate Credentials'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs">
          <span className="text-gray-400">
            {isSignUp ? 'Already registered?' : 'Need a diagnostics sandbox account?'}
          </span>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-medical-cyan hover:underline font-semibold ml-2 focus:outline-none"
          >
            {isSignUp ? 'Sign In Here' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
