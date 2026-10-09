import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  GraduationCap, CreditCard, Users, MessageSquare,
  Clock, CheckCircle2, XCircle, RotateCw, ArrowRight, Info, Bell
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getMyProfile()
      .then(r => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." />;

  const status = profile?.registrationStatus;
  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';
  const isPending  = status === 'PENDING';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero header */}
      <div className={`text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-2 ${
        isApproved ? 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900'
        : isRejected ? 'bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900'
        : 'bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900'
      }`}>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Portal — BIT Connect</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {greeting()}, {user?.fullName?.split(' ')[0] || 'Student'}
        </h1>
        <p className="text-white/70 text-xs sm:text-sm">
          {isApproved
            ? 'Your institutional student identity is verified. Welcome!'
            : isRejected
              ? 'Your registration needs correction. Please review the admin feedback.'
              : 'Your registration is under review by the administrator.'}
        </p>
      </div>

      {/* Registration status card (prominent) */}
      {!isApproved && (
        <div className={`rounded-2xl border p-6 space-y-4 ${
          isRejected
            ? 'bg-rose-50 border-rose-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {isRejected
              ? <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
              : <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
            }
            <div className="flex-1">
              <h2 className={`font-bold text-sm ${isRejected ? 'text-rose-900' : 'text-amber-900'}`}>
                {isRejected ? 'Registration Requires Correction' : 'Registration Pending Admin Review'}
              </h2>
              {isRejected && profile?.rejectionReason && (
                <p className="text-xs text-rose-700 mt-1">
                  <strong>Admin feedback:</strong> {profile.rejectionReason}
                </p>
              )}
              {isPending && (
                <p className="text-xs text-amber-700 mt-1">
                  You will receive a notification once the administrator reviews your registration.
                </p>
              )}
              {!profile && (
                <p className="text-xs text-slate-600 mt-1">
                  You haven&#39;t submitted your student registration yet.
                </p>
              )}
            </div>
            <StatusBadge status={status || 'PENDING'} />
          </div>

          <div className="flex gap-3">
            {isRejected ? (
              <Link to="/student/profile" id="dashboard-fix-reg-btn"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition">
                <RotateCw className="w-3.5 h-3.5" />Correct & Resubmit
              </Link>
            ) : (
              <Link to="/student/profile" id="dashboard-view-reg-btn"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition">
                <Info className="w-3.5 h-3.5" />{profile ? 'View Registration' : 'Register Now'}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick links grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Digital Student ID */}
        <div className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 ${isApproved ? 'border-emerald-200' : 'border-slate-200 opacity-60'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-slate-900">Digital Student ID</h3>
            <p className="text-xs text-slate-500 mt-1">
              {isApproved
                ? `ID: ${profile.studentIdCardNumber || 'View card'}`
                : 'Available after admin approval'}
            </p>
          </div>
          {isApproved ? (
            <Link to="/student/digital-id"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900">
              View ID Card <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />Pending approval
            </span>
          )}
        </div>

        {/* Community */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-bit-50 text-bit-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-slate-900">Community Forum</h3>
            <p className="text-xs text-slate-500 mt-1">Ask questions, share insights</p>
          </div>
          <Link to="/student/community"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-bit-700 hover:text-bit-900">
            Open Forum <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Alumni Directory */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-slate-900">Alumni Directory</h3>
            <p className="text-xs text-slate-500 mt-1">Connect with BIT graduates</p>
          </div>
          <Link to="/directory"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900">
            Browse Directory <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
            <p className="text-xs text-slate-500 mt-1">Registration updates &amp; announcements</p>
          </div>
          <Link to="/notifications"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-slate-900">My Profile</h3>
            <p className="text-xs text-slate-500 mt-1">
              {profile ? `${profile.degree} • ${profile.departmentCode}` : 'Complete your registration'}
            </p>
          </div>
          <Link to="/student/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900">
            {profile ? 'View Profile' : 'Register'} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Approved: profile summary bar */}
      {isApproved && profile && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-4">
            {profile.profilePhotoUrl ? (
              <img src={profile.profilePhotoUrl} alt={profile.fullName}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-slate-900 truncate">{profile.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{profile.registerNumber} • {profile.departmentCode} • {profile.degree}</p>
              <p className="text-xs text-slate-500">Batch {profile.batchStartYear}–{profile.batchEndYear} •&nbsp;
                {profile.studentType === 'DAY_SCHOLAR' ? '🔴 Day Scholar' : profile.studentType === 'HOSTELER' ? '🔵 Hosteler' : '—'}
              </p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
};