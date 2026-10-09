import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, Lock, Mail, ArrowRight, AlertCircle, Sparkles, Users
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

/**
 * Dedicated Alumni Portal login page.
 * Calls POST /api/v1/auth/login/alumni — backend enforces ROLE_ALUMNI.
 * Non-alumni credentials are rejected by the backend.
 */
export const AlumniLoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { loginAlumni } = useAuth();
  const navigate        = useNavigate();
  const location        = useLocation();
  const from            = location.state?.from?.pathname || '/alumni/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginAlumni(email, password);
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
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-slate-900 to-emerald-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white items-center justify-center shadow-2xl shadow-teal-600/40">
              <GraduationCap className="w-9 h-9" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-teal-400 uppercase mb-1">
                BIT Connect
              </p>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Alumni Portal
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Sign in to access the Alumni Engagement Portal
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
                  College Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="alumni-login-email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="name@bitsathy.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60 transition"
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
                    id="alumni-login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60 transition"
                  />
                </div>
              </div>

              <button
                id="alumni-login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-sm font-bold shadow-lg shadow-teal-700/30 hover:shadow-xl hover:shadow-teal-600/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Signing in…' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Registration link */}
            <div className="text-center pt-1 border-t border-white/10 space-y-1.5">
              <p className="text-xs text-slate-400">
                Don't have an alumni account yet?{' '}
                <Link
                  to="/register"
                  className="font-bold text-teal-400 hover:text-teal-300 transition hover:underline"
                >
                  Register here
                </Link>
              </p>
            </div>

            {/* Demo one-click logins */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Demo One-Click Login</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={(e) => handleDemoFill(e, 'alumni@bitsathy.ac.in')}
                  className="p-2.5 rounded-lg border border-white/10 hover:bg-white/10 text-left transition"
                >
                  <p className="font-bold text-teal-400 text-xs">Alumni Account</p>
                  <p className="text-[10px] text-slate-500 truncate">alumni@bitsathy.ac.in</p>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDemoFill(e, 'admin@bitsathy.ac.in')}
                  className="p-2.5 rounded-lg border border-white/10 hover:bg-white/10 text-left transition"
                >
                  <p className="font-bold text-slate-300 text-xs">Admin Account</p>
                  <p className="text-[10px] text-slate-500 truncate">admin@bitsathy.ac.in</p>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDemoFill(e, 'watchman@bitsathy.ac.in')}
                  className="p-2.5 rounded-lg border border-white/10 hover:bg-white/10 text-left transition"
                >
                  <p className="font-bold text-amber-400 text-xs">Watchman Gate</p>
                  <p className="text-[10px] text-slate-500 truncate">watchman@bitsathy.ac.in</p>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDemoFill(e, 'faculty.it@bitsathy.ac.in')}
                  className="p-2.5 rounded-lg border border-white/10 hover:bg-white/10 text-left transition"
                >
                  <p className="font-bold text-indigo-400 text-xs">IT Faculty</p>
                  <p className="text-[10px] text-slate-500 truncate">faculty.it@bitsathy.ac.in</p>
                </button>
              </div>
              <p className="text-[9px] text-slate-600 text-center">
                Note: Admin/Watchman/Faculty will redirect to their portals after login
              </p>
            </div>

            {/* Portal switcher */}
            <p className="text-center text-[11px] text-slate-500">
              Are you a current student?{' '}
              <Link to="/student/login" className="text-blue-400 font-bold hover:underline">
                Student Login →
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
