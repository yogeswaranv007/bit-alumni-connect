import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { alumniApi } from '../../api/alumniApi';
import { virtualIdApi } from '../../api/virtualIdApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  User,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  Award,
  RefreshCw,
  QrCode
} from 'lucide-react';

export const AlumniDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [virtualId, setVirtualId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

  const fetchProfileAndVirtualId = async () => {
    setLoading(true);
    try {
      const profileRes = await alumniApi.getMyProfile();
      if (profileRes.data) {
        setProfile(profileRes.data);
        setHasProfile(true);

        if (profileRes.data.verificationStatus === 'VERIFIED') {
          try {
            const vidRes = await virtualIdApi.getMyVirtualId();
            if (vidRes.data) {
              setVirtualId(vidRes.data);
            }
          } catch (vidErr) {
            console.warn('Virtual ID not generated yet:', vidErr);
          }
        }
      }
    } catch (err) {
      if (err.status === 404 || err.message?.includes('not found')) {
        setHasProfile(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndVirtualId();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading alumni portal..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-bit-900 via-slate-900 to-bit-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-bit-500/20 text-bit-300 text-xs font-semibold backdrop-blur">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alumnus Member Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
            Access your verified digital credentials, explore the global alumni directory, and engage with the BIT community.
          </p>
        </div>
      </div>

      {/* Verification Lifecycle Status Banner */}
      {!hasProfile ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-300">
                Alumni Profile Registration Incomplete
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-400/90 leading-relaxed max-w-xl">
                Please submit your graduation batch, roll number, and department records to receive your official Virtual Alumni ID.
              </p>
            </div>
          </div>
          <Link
            to="/alumni/create-profile"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex-shrink-0"
          >
            <span>Complete Profile</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : profile?.verificationStatus === 'PENDING' ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-6 sm:p-8 flex items-start space-x-4 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-300">
                Verification in Progress
              </h3>
              <StatusBadge status="PENDING" />
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-400/90 leading-relaxed">
              Your profile has been submitted and is currently being verified against college records by the administrative office. Once approved, your <strong>Virtual Alumni ID Card</strong> and secure QR code will be generated automatically.
            </p>
          </div>
        </div>
      ) : profile?.verificationStatus === 'REJECTED' ? (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-rose-900 dark:text-rose-300">
                  Verification Action Required
                </h3>
                <StatusBadge status="REJECTED" />
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-400">
                <strong>Reason:</strong> {profile.rejectionReason || 'Please verify your register number and resubmit.'}
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-400/80">
                Updating your contact and personal information will automatically re-queue your profile for verification.
              </p>
            </div>
          </div>
          <Link
            to="/alumni/create-profile"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex-shrink-0"
          >
            <span>Update & Resubmit</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* VERIFIED STATE */
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-300">
                  Official Identity Verified
                </h3>
                <StatusBadge status="VERIFIED" />
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-400/90 leading-relaxed">
                Your virtual alumni identity is active. Alumni Card ID: <strong className="font-mono">{virtualId?.alumniIdCardNumber || 'Issued'}</strong>.
              </p>
            </div>
          </div>

          <Link
            to="/alumni/virtual-id"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>View 3D Digital Card</span>
          </Link>
        </div>
      )}

      {/* Main Grid: Quick Nav Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Virtual ID */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-bit-50 dark:bg-bit-950/40 text-bit-700 dark:text-bit-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Digital Alumni ID</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Interactive 3D identity badge with dynamic Zero-PII QR code for instant campus access and verification.
            </p>
          </div>
          <Link
            to="/alumni/virtual-id"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-bit-700 dark:text-bit-400 hover:text-bit-800 dark:hover:text-bit-300 pt-2"
          >
            <span>Launch Digital ID</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Directory */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Alumni Directory</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Search and connect with fellow BIT graduates across departments, graduation years, and global industries.
            </p>
          </div>
          <Link
            to="/directory"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 pt-2"
          >
            <span>Search Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Profile Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Profile & Privacy</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Manage your personal contact details, current employer info, and directory visibility preferences.
            </p>
          </div>
          <Link
            to="/alumni/profile"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white pt-2"
          >
            <span>Manage Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
