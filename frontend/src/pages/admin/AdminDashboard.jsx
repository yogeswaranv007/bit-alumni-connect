import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  CreditCard,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });
  const [recentPending, setRecentPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      setLoading(true);
      try {
        // Fetch pending profiles count
        const pendingRes = await adminApi.getAlumniProfiles({ status: 'PENDING', size: 5 });
        const verifiedRes = await adminApi.getAlumniProfiles({ status: 'VERIFIED', size: 1 });
        const rejectedRes = await adminApi.getAlumniProfiles({ status: 'REJECTED', size: 1 });
        const allRes = await adminApi.getAlumniProfiles({ size: 1 });

        setStats({
          total: allRes.data?.totalElements || 0,
          pending: pendingRes.data?.totalElements || 0,
          verified: verifiedRes.data?.totalElements || 0,
          rejected: rejectedRes.data?.totalElements || 0,
        });

        setRecentPending(pendingRes.data?.content || []);
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading administration console..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-bit-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-bit-500/20 text-bit-300 text-xs font-semibold backdrop-blur">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Administrative Control Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          BIT Connect Identity Oversight
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
          Review pending alumni submissions, approve institutional credentials, and manage virtual identity records.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Pending */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.pending}</p>
          <p className="text-[11px] text-slate-500 font-medium">Awaiting administrator verification</p>
        </div>

        {/* Metric 2: Verified */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Verified Alumni</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.verified}</p>
          <p className="text-[11px] text-slate-500 font-medium">Virtual IDs issued and active</p>
        </div>

        {/* Metric 3: Rejected */}
        <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Action Required</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.rejected}</p>
          <p className="text-[11px] text-slate-500 font-medium">Rejected with recorded feedback</p>
        </div>

        {/* Metric 4: Total */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Records</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-500 font-medium">Registered alumni profiles</p>
        </div>
      </div>

      {/* Pending Reviews Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pending Verification Queue</h2>
            <p className="text-xs text-slate-500">Profiles waiting for academic identity confirmation</p>
          </div>
          <Link
            to="/admin/alumni?status=PENDING"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-bit-700 hover:text-bit-800"
          >
            <span>View All Pending ({stats.pending})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentPending.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <p className="text-sm font-bold text-slate-700">Verification Queue is Clear</p>
            <p className="text-xs">No pending alumni profiles require review at this moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Alumnus Name</th>
                  <th className="px-6 py-3.5">Roll / Reg No</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Graduation Batch</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPending.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-bit-700 text-white font-bold flex items-center justify-center text-xs uppercase">
                        {p.fullName?.charAt(0)}
                      </div>
                      <div>
                        <span>{p.fullName}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">{p.accountEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                      {p.rollNumber} / {p.registerNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {p.degree} - {p.department?.code}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      Class of {p.batchEndYear}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/alumni?reviewId=${p.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs transition"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
