import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import {
  GraduationCap, Lock, Mail, User, Hash, Calendar,
  ArrowRight, AlertCircle, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

/**
 * Alumni institutional verification & registration page.
 *
 * Flow:
 *   Alumni enters: email, password, register number, full name, DOB
 *        ↓
 *   Backend checks CollegeAlumniRecord (register number + name + DOB must match)
 *        ↓
 *   If matched & not yet registered → BIT Connect User + ROLE_ALUMNI created
 *        ↓
 *   Alumni completes profile (PENDING → VERIFIED workflow)
 */
export const RegisterPage = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirm]   = useState('');
  const [registerNumber, setRegNum]     = useState('');
  const [fullName, setFullName]         = useState('');
  const [dateOfBirth, setDob]           = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.registerAlumni({
        email,
        password,
        registerNumber: registerNumber.trim().toUpperCase(),
        fullName: fullName.trim(),
        dateOfBirth,
      });
      if (res.success && res.data) {
        const { accessToken, user: userData } = res.data;
        localStorage.setItem('bit_auth_token', accessToken);
        localStorage.setItem('bit_auth_user', JSON.stringify(userData));
        window.location.href = '/alumni/create-profile';
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-slate-900 to-emerald-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg space-y-6">

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white items-center justify-center shadow-2xl shadow-teal-600/40">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-teal-400 uppercase mb-1">
                BIT Connect — Alumni Portal
              </p>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Verify & Register
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Your details will be verified against the college alumni records
              </p>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4">
            <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-teal-300">Institutional Verification Required</p>
              <p>Your register number, full name, and date of birth must match the college alumni records. Unverified registrations are not accepted.</p>
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

              {/* Institutional verification */}
              <div className="space-y-3 border-b border-white/10 pb-4">
                <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                  Institutional Verification
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Register Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="alumni-reg-register-number"
                      type="text"
                      required
                      placeholder="e.g. 7376219IT210"
                      value={registerNumber}
                      onChange={(e) => setRegNum(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60 transition font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Full Name (as per college records)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="alumni-reg-full-name"
                      type="text"
                      required
                      placeholder="e.g. Praveen Kumar S"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="alumni-reg-dob"
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Account credentials */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                  BIT Connect Account Credentials
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Login Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="alumni-reg-email"
                      type="email"
                      required
                      placeholder="your.email@example.com"
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
                      id="alumni-reg-password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="alumni-reg-confirm-password"
                      type="password"
                      required
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60 transition"
                    />
                  </div>
                </div>
              </div>

              <button
                id="alumni-reg-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-sm font-bold shadow-lg shadow-teal-700/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying & Registering…' : 'Verify & Create Account'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="text-center space-y-1.5 pt-2 border-t border-white/10">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/alumni/login" className="font-bold text-teal-400 hover:underline">
                  Alumni Login
                </Link>
              </p>
              <p className="text-xs text-slate-500">
                Are you a current student?{' '}
                <Link to="/student/register" className="font-bold text-blue-400 hover:underline">
                  Student registration
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
