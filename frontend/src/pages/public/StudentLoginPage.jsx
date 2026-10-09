import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, Lock, Mail, ArrowRight, AlertCircle, Sparkles,
  Globe, ShieldCheck, GraduationCap
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

/**
 * Dedicated Student Portal login page.
 * Calls POST /api/v1/auth/login/student — backend enforces ROLE_STUDENT.
 * Non-student credentials (Alumni, Admin, etc.) are rejected by the backend.
 */
export const StudentLoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { loginStudent } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const from             = location.state?.from?.pathname || '/student/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginStudent(email, password);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  const handleDemoFill = (e, demoEmail) => {
    e.preventDefault();
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white items-center justify-center shadow-2xl shadow-blue-600/40">
              <BookOpen className="w-9 h-9" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-blue-400 uppercase mb-1">
                BIT Connect
              </p>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Student Portal
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Sign in to access your Student Portal
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl shadow-black/40 space-y-5">

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  College / Institutional Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="student-login-email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="your.email@bitsathy.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="student-login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition"
                  />
                </div>
              </div>

              <button
                id="student-login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-700/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Signing in…' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Google OAuth — future, clearly marked unavailable */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-transparent px-3 text-slate-500">OR</span>
              </div>
            </div>

            <div className="relative group">
              <button
                type="button"
                disabled
                title="Google login coming soon — currently unavailable"
                className="w-full py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-slate-500 text-sm font-semibold flex items-center justify-center gap-2.5 cursor-not-allowed opacity-60"
              >
                <Globe className="w-4 h-4" />
                <span>Continue with Google</span>
                <span className="ml-auto text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-bold tracking-wide">
                  COMING SOON
                </span>
              </button>
              <p className="text-center text-[10px] text-slate-600 mt-1.5">
                Google login for Students — not yet available
              </p>
            </div>

            {/* Registration link */}
            <div className="text-center pt-1 border-t border-white/10 space-y-1.5">
              <p className="text-xs text-slate-400">
                Don't have a verified student account?
              </p>
              <Link
                to="/student/register"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Register / Verify Student Record
              </Link>
            </div>

            {/* Demo one-click login */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Dev / Demo — Student Account</span>
              </div>
              <button
                type="button"
                onClick={(e) => handleDemoFill(e, 'student@bitsathy.ac.in')}
                className="w-full p-2.5 rounded-lg border border-white/10 hover:bg-white/10 text-left transition group"
              >
                <p className="font-bold text-blue-400 text-xs group-hover:text-blue-300">Student Account</p>
                <p className="text-[10px] text-slate-500 truncate">student@bitsathy.ac.in · Password@123</p>
                <p className="text-[9px] text-amber-600 font-semibold mt-0.5">DEVELOPMENT ONLY — not a real student</p>
              </button>
            </div>

            {/* Portal switcher */}
            <p className="text-center text-[11px] text-slate-500">
              Looking for the Alumni Portal?{' '}
              <Link to="/alumni/login" className="text-teal-400 font-bold hover:underline">
                Alumni Login →
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
