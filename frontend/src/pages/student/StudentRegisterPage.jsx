import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import {
  BookOpen, Lock, Mail, User, Hash, Calendar, ArrowRight,
  AlertCircle, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

/**
 * Student institutional verification & registration page.
 *
 * Flow:
 *   Student enters: email, password, register number, full name, DOB
 *        ↓
 *   Backend checks CollegeStudentRecord (register number + name + DOB must match)
 *        ↓
 *   If matched & not yet registered → BIT Connect User + ROLE_STUDENT created
 *        ↓
 *   Student completes profile (PENDING status, awaits admin approval)
 *
 * Register number alone is NOT sufficient — name and DOB are additional factors.
 */
export const StudentRegisterPage = () => {
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirm]     = useState('');
  const [registerNumber, setRegNum]       = useState('');
  const [fullName, setFullName]           = useState('');
  const [dateOfBirth, setDob]             = useState('');
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);

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
      const res = await authApi.registerStudent({
        email,
        password,
        registerNumber: registerNumber.trim().toUpperCase(),
        fullName: fullName.trim(),
        dateOfBirth,    // ISO date string "YYYY-MM-DD"
      });
      if (res.success && res.data) {
        const { accessToken, user: userData } = res.data;
        localStorage.setItem('bit_auth_token', accessToken);
        localStorage.setItem('bit_auth_user', JSON.stringify(userData));
        window.location.href = '/student/profile';
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 14);
    return d.toISOString().split('T')[0];
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg space-y-6">

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white items-center justify-center shadow-2xl shadow-blue-600/40">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-blue-400 uppercase mb-1">
                BIT Connect — Student Portal
              </p>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Verify & Register
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Your details will be verified against the college student records
              </p>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
            <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-blue-300">Institutional Verification Required</p>
              <p>Your register number, full name, and date of birth must match the college student master records. Unverified registrations are not accepted.</p>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl shadow-black/40 space-y-5">

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Institutional verification fields */}
              <div className="space-y-1 border-b border-white/10 pb-4">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3">
                  Institutional Verification
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Register Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="student-reg-register-number"
                      type="text"
                      required
                      placeholder="e.g. 7376232IT286"
                      value={registerNumber}
                      onChange={(e) => setRegNum(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition font-mono"
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
                      id="student-reg-full-name"
                      type="text"
                      required
                      placeholder="e.g. Arun Kumar S"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition"
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
                      id="student-reg-dob"
                      type="date"
                      required
                      max={maxDob}
                      value={dateOfBirth}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 pl-1">
                    Must be at least 14 years old. Max DOB: {maxDob}
                  </p>
                </div>
              </div>

              {/* Account credentials */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3">
                  BIT Connect Account Credentials
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Login Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="student-reg-email"
                      type="email"
                      required
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
                      id="student-reg-password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition"
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
                      id="student-reg-confirm-password"
                      type="password"
                      required
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition"
                    />
                  </div>
                </div>
              </div>

              <button
                id="student-reg-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-700/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying & Registering…' : 'Verify & Create Account'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="text-center space-y-1.5 pt-2 border-t border-white/10">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/student/login" className="font-bold text-blue-400 hover:underline">
                  Student Login
                </Link>
              </p>
              <p className="text-xs text-slate-500">
                Are you an alumnus?{' '}
                <Link to="/register" className="font-bold text-teal-400 hover:underline">
                  Alumni registration
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
