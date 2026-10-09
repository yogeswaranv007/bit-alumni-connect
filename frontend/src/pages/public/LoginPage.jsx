import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, BookOpen, Lock, Mail, ArrowRight, AlertCircle, Sparkles, ArrowUpRight
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

/**
 * Central login hub — used by Admin, Watchman, Faculty (non-student, non-alumni roles).
 * Also shows clear portal switcher cards for Student and Alumni.
 * General login (/auth/login) is role-agnostic — any role can authenticate here.
 */
export const LoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (from) {
        navigate(from, { replace: true });
      } else if (result.user.roles?.includes('ROLE_STUDENT')) {
        navigate('/student/dashboard', { replace: true });
      } else if (result.user.roles?.includes('ROLE_ALUMNI')) {
        navigate('/alumni/dashboard', { replace: true });
      } else if (result.user.roles?.includes('ROLE_WATCHMAN')) {
        navigate('/watchman', { replace: true });
      } else if (result.user.roles?.includes('ROLE_STAFF')) {
        navigate('/faculty/campus-visits', { replace: true });
      } else if (result.user.roles?.includes('ROLE_ADMIN')) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/alumni/dashboard', { replace: true });
      }
    } else {
      setError(result.message);
    }
  };

  const handleDemoFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 gap-8">

        {/* Portal Chooser — prominent cards at the top */}
        <div className="w-full max-w-2xl">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Select Your Portal
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/student/login"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 p-5 text-white shadow-xl shadow-blue-900/30 hover:shadow-2xl hover:shadow-blue-800/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <BookOpen className="w-7 h-7 mb-3 opacity-90" />
              <p className="font-extrabold text-lg leading-tight">Student</p>
              <p className="text-xs text-blue-200 mt-0.5">Current students</p>
              <ArrowUpRight className="absolute top-4 right-4 w-4 h-4 opacity-60 group-hover:opacity-100 transition" />
            </Link>

            <Link
              to="/alumni/login"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 p-5 text-white shadow-xl shadow-teal-900/30 hover:shadow-2xl hover:shadow-teal-800/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <GraduationCap className="w-7 h-7 mb-3 opacity-90" />
              <p className="font-extrabold text-lg leading-tight">Alumni</p>
              <p className="text-xs text-teal-200 mt-0.5">Graduated alumni</p>
              <ArrowUpRight className="absolute top-4 right-4 w-4 h-4 opacity-60 group-hover:opacity-100 transition" />
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full max-w-md flex items-center gap-4">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-xs text-slate-400 font-semibold">Staff / Admin Login</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* Staff / Admin general login form */}
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sign In to BIT Connect
            </h2>
            <p className="text-xs text-slate-500">
              Admin, Faculty and Watchman accounts
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="general-login-email"
                    type="email"
                    required
                    placeholder="name@bitsathy.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="general-login-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 transition"
                  />
                </div>
              </div>

              <button
                id="general-login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-bit-700 hover:bg-bit-800 text-white text-sm font-bold shadow-md shadow-bit-700/20 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating…' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Demo One-Click Login</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Admin Account',  email: 'admin@bitsathy.ac.in',      color: 'text-bit-700' },
                  { label: 'Watchman Gate',  email: 'watchman@bitsathy.ac.in',   color: 'text-amber-700' },
                  { label: 'IT Faculty',     email: 'faculty.it@bitsathy.ac.in', color: 'text-indigo-700' },
                ].map(({ label, email: demoEmail, color }) => (
                  <button
                    key={demoEmail}
                    type="button"
                    onClick={() => handleDemoFill(demoEmail)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition"
                  >
                    <p className={`font-bold text-[11px] ${color}`}>{label}</p>
                    <p className="text-[10px] text-slate-400 truncate">{demoEmail}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
