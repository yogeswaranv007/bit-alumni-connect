import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { adminStudentApi } from '../../api/studentApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, Users, CreditCard,
  ArrowRight, GraduationCap, AlertCircle
} from 'lucide-react';

export const AdminDashboard = () => {
  const [alumniStats, setAlumniStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [studentStats, setStudentStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [recentPendingAlumni, setRecentPendingAlumni] = useState([]);
  const [recentPendingStudents, setRecentPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [aPending, aVerified, aRejected, aAll, sPending, sApproved, sRejected, sAll] = await Promise.all([
          adminApi.getAlumniProfiles({ status: 'PENDING', size: 5 }),
          adminApi.getAlumniProfiles({ status: 'VERIFIED', size: 1 }),
          adminApi.getAlumniProfiles({ status: 'REJECTED', size: 1 }),
          adminApi.getAlumniProfiles({ size: 1 }),
          adminStudentApi.getStudentRegistrations({ status: 'PENDING', size: 5 }),
          adminStudentApi.getStudentRegistrations({ status: 'APPROVED', size: 1 }),
          adminStudentApi.getStudentRegistrations({ status: 'REJECTED', size: 1 }),
          adminStudentApi.getStudentRegistrations({ size: 1 }),
        ]);
        setAlumniStats({
          total:    aAll.data?.totalElements || 0,
          pending:  aPending.data?.totalElements || 0,
          verified: aVerified.data?.totalElements || 0,
          rejected: aRejected.data?.totalElements || 0,
        });
        setStudentStats({
          total:    sAll.data?.totalElements || 0,
          pending:  sPending.data?.totalElements || 0,
          approved: sApproved.data?.totalElements || 0,
          rejected: sRejected.data?.totalElements || 0,
        });
        setRecentPendingAlumni(aPending.data?.content || []);
        setRecentPendingStudents(sPending.data?.content || []);
      } catch (err) {
        console.error('Admin dashboard error', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner size="lg" text="Loading administration console..." />;

  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-bit-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-bit-500/20 text-bit-300 text-xs font-semibold backdrop-blur">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Administrative Control Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">BIT Connect Identity Oversight</h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
          Manage student and alumni registrations, approve institutional credentials, and oversee virtual identity records.
        </p>
      </div>

      {/* ── STUDENT SECTION ────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Student Registrations</h2>
            <p className="text-xs text-slate-500">Institutional student verification queue — separate from alumni</p>
          </div>
          <Link to="/admin/student-registrations"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900">
            Manage All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending Review',    value: studentStats.pending,  border: 'border-amber-200',   text: 'text-amber-700',   bg: 'bg-amber-50',   icon: Clock },
            { label: 'Approved',          value: studentStats.approved, border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
            { label: 'Requires Correction', value: studentStats.rejected, border: 'border-rose-200',  text: 'text-rose-700',   bg: 'bg-rose-50',   icon: XCircle },
            { label: 'Total Students',    value: studentStats.total,    border: 'border-slate-200',   text: 'text-slate-600',   bg: 'bg-slate-100',  icon: Users },
          ].map(({ label, value, border, text, bg, icon: Icon }) => (
            <div key={label} className={`bg-white rounded-2xl p-5 border ${border} shadow-sm space-y-2`}>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${text}`}>{label}</span>
                <div className={`w-7 h-7 rounded-lg ${bg} ${text} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Recent pending students */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Pending Student Registrations</h3>
            <Link to="/admin/student-registrations?status=PENDING"
              className="text-xs font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentPendingStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
              <p className="text-xs font-bold text-slate-600">No pending student registrations</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPendingStudents.map(p => (
                <div key={p.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition">
                  <div className={`w-8 h-8 rounded-full text-white font-black flex items-center justify-center text-xs flex-shrink-0
                    ${p.studentType === 'DAY_SCHOLAR' ? 'bg-rose-700' : p.studentType === 'HOSTELER' ? 'bg-blue-700' : 'bg-slate-500'}`}>
                    {p.studentType === 'DAY_SCHOLAR' ? 'D' : p.studentType === 'HOSTELER' ? 'H' : p.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.fullName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{p.registerNumber} · {p.degree} · {p.departmentCode}</p>
                  </div>
                  <Link to={`/admin/student-registrations`}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ALUMNI SECTION ─────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-bit-100 text-bit-700 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Alumni Registrations</h2>
            <p className="text-xs text-slate-500">Alumni identity verification queue — separate from student</p>
          </div>
          <Link to="/admin/alumni"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-bit-700 hover:text-bit-900">
            Manage All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending Review',   value: alumniStats.pending,  border: 'border-amber-200',   text: 'text-amber-700',   bg: 'bg-amber-50',   icon: Clock },
            { label: 'Verified',         value: alumniStats.verified, border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
            { label: 'Action Required',  value: alumniStats.rejected, border: 'border-rose-200',   text: 'text-rose-700',   bg: 'bg-rose-50',   icon: XCircle },
            { label: 'Total Alumni',     value: alumniStats.total,    border: 'border-slate-200',   text: 'text-slate-600',   bg: 'bg-slate-100',  icon: Users },
          ].map(({ label, value, border, text, bg, icon: Icon }) => (
            <div key={label} className={`bg-white rounded-2xl p-5 border ${border} shadow-sm space-y-2`}>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${text}`}>{label}</span>
                <div className={`w-7 h-7 rounded-lg ${bg} ${text} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Recent pending alumni */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Pending Alumni Verifications</h3>
            <Link to="/admin/alumni?status=PENDING"
              className="text-xs font-bold text-bit-700 hover:text-bit-900 inline-flex items-center gap-1">
              View All ({alumniStats.pending}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentPendingAlumni.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
              <p className="text-xs font-bold text-slate-600">No pending alumni verifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPendingAlumni.map(p => (
                <div key={p.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition">
                  <div className="w-8 h-8 rounded-full bg-bit-700 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {p.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.fullName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{p.rollNumber} / {p.registerNumber} · Class of {p.batchEndYear}</p>
                  </div>
                  <Link to={`/admin/alumni?reviewId=${p.id}`}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-bit-700 hover:bg-bit-800 text-white text-xs font-bold transition">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};