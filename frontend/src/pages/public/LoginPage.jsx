import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (from) {
        navigate(from, { replace: true });
      } else if (result.user.roles?.includes('ROLE_ADMIN') || result.user.roles?.includes('ROLE_STAFF')) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/alumni/dashboard', { replace: true });
      }
    } else {
      setError(result.message);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-bit-700 text-white items-center justify-center shadow-lg shadow-bit-700/30">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Sign In to BIT Connect
            </h2>
            <p className="text-xs text-slate-500">
              Enter your credentials to access the alumni engagement portal
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  College Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
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
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
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
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-bit-700 hover:bg-bit-800 text-white text-sm font-bold shadow-md shadow-bit-700/20 hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Quick Demo Credentials Switcher */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Demo One-Click Login</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoFill('admin@bitsathy.ac.in', 'Password@123')}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 text-left transition"
                >
                  <p className="font-bold text-bit-700">Admin Account</p>
                  <p className="text-[10px] text-slate-400 truncate">admin@bitsathy.ac.in</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('praveen@bitsathy.ac.in', 'Password@123')}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 text-left transition"
                >
                  <p className="font-bold text-teal-700">Alumni Account</p>
                  <p className="text-[10px] text-slate-400 truncate">praveen@bitsathy.ac.in</p>
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-slate-500">
                Don't have an alumni account yet?{' '}
                <Link to="/register" className="font-bold text-bit-700 hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
