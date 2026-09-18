import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { alumniApi } from '../../api/alumniApi';
import { profileChangeApi } from '../../api/profileChangeApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  User,
  Building,
  Briefcase,
  MapPin,
  Lock,
  CreditCard,
  Check,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  FileEdit,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  History
} from 'lucide-react';

export const AlumniProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfileAndRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, requestsRes] = await Promise.all([
        alumniApi.getMyProfile(),
        profileChangeApi.getMyChangeRequests().catch(() => ({ data: [] })),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }
      if (requestsRes.data) {
        setChangeRequests(requestsRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile. Please complete registration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndRequests();
  }, []);

  const pendingRequest = changeRequests.find((r) => r.status === 'PENDING');
  const rejectedRequest = changeRequests.find((r) => r.status === 'REJECTED');

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading your official profile..." />;
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 max-w-xl mx-auto shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <User className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">No Alumni Profile Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please complete your official alumni registration to receive your Virtual Alumni ID.
        </p>
        <Link
          to="/alumni/create-profile"
          className="inline-block px-6 py-2.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs shadow-md transition"
        >
          Create Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative w-16 h-20 rounded-xl bg-slate-100 border-2 border-white shadow-md overflow-hidden flex-shrink-0">
            {profile.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt={profile.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-bit-700 text-white font-extrabold text-2xl flex items-center justify-center">
                {profile.fullName?.charAt(0) || 'A'}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{profile.fullName}</h1>
            <p className="text-xs font-semibold text-slate-500">{profile.accountEmail}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              {profile.alumniIdNumber && (
                <span className="inline-flex items-center space-x-1 text-[11px] font-mono font-extrabold text-amber-900 bg-amber-100 border border-amber-300/80 px-2.5 py-0.5 rounded-lg shadow-2xs">
                  <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                  <span>Alumni ID: {profile.alumniIdNumber}</span>
                </span>
              )}
              <span className="text-[11px] font-mono font-bold text-bit-800 bg-bit-50 px-2 py-0.5 rounded-md">
                Reg: {profile.registerNumber}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                Roll: {profile.rollNumber}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <StatusBadge status={profile.verificationStatus} size="md" />

          {profile.verificationStatus === 'REJECTED' && (
            <Link
              to="/alumni/create-profile"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Edit & Resubmit Profile</span>
            </Link>
          )}

          {profile.verificationStatus === 'PENDING' && (
            <Link
              to="/alumni/create-profile"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition"
            >
              <FileEdit className="w-4 h-4" />
              <span>Edit Pending Profile</span>
            </Link>
          )}

          {profile.verificationStatus === 'VERIFIED' && !pendingRequest && (
            <Link
              to="/alumni/change-request"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs shadow-md shadow-bit-700/20 transition"
            >
              <FileEdit className="w-4 h-4" />
              <span>Request Profile Change</span>
            </Link>
          )}
        </div>
      </div>

      {/* Profile Verification Rejection Banner */}
      {profile.verificationStatus === 'REJECTED' && (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start space-x-3.5 flex-1">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <XCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-rose-900">Alumni Verification Action Required</h3>
              <p className="text-xs text-rose-800">
                <strong>Rejection Reason:</strong> {profile.rejectionReason || 'Details incomplete or unverified.'}
              </p>
              <p className="text-[11px] text-rose-700">
                The administrator rejected your initial verification request. Please update your missing/incorrect details (such as Permanent Address, Contact Number, or Academic information) and resubmit for verification.
              </p>
            </div>
          </div>
          <Link
            to="/alumni/create-profile"
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex-shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Update & Resubmit</span>
          </Link>
        </div>
      )}

      {/* Profile Verification Pending Banner */}
      {profile.verificationStatus === 'PENDING' && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start space-x-3.5 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 animate-pulse mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-amber-900">Verification in Progress</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your profile submission is being audited by the administrative office. If you need to make corrections before approval, you can update your submission.
              </p>
            </div>
          </div>
          <Link
            to="/alumni/create-profile"
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex-shrink-0"
          >
            <FileEdit className="w-4 h-4" />
            <span>Edit Submission</span>
          </Link>
        </div>
      )}

      {/* Active Change Request Status Alerts */}
      {pendingRequest && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 animate-pulse mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-amber-900">Profile Change Request Under Review</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 uppercase">
                  PENDING ADMIN APPROVAL
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                You submitted a profile change request on{' '}
                <strong>{new Date(pendingRequest.createdAt).toLocaleDateString()}</strong>. The Alumni Management Office is currently reviewing your requested details. Your official Digital ID remains active with current records.
              </p>
            </div>
          </div>
        </div>
      )}

      {rejectedRequest && !pendingRequest && (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start space-x-3.5 flex-1">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-rose-900">Change Request Requires Attention</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-200 text-rose-900 uppercase">
                  REJECTED
                </span>
              </div>
              <p className="text-xs text-rose-800">
                <strong>Feedback from Admin:</strong>
              </p>
              <div className="bg-white/80 p-3 rounded-xl border border-rose-200 font-medium text-xs text-rose-950 italic">
                "{rejectedRequest.adminComment || 'Please review requested details and resubmit.'}"
              </div>
            </div>
          </div>

          <Link
            to={`/alumni/change-request?edit=${rejectedRequest.id}`}
            className="inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex-shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Edit & Resubmit Request</span>
          </Link>
        </div>
      )}

      {/* Official Academic Details (Protected) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
            <Building className="w-4 h-4 text-bit-700" />
            <span>Academic Identity (Official Record)</span>
          </h2>
          <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            <Lock className="w-3 h-3 mr-1" />
            Locked to Virtual ID
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80">
            <div className="flex items-center justify-between">
              <span className="text-amber-800 font-bold block text-[11px]">Permanent Alumni ID</span>
              <Lock className="w-3 h-3 text-amber-600" />
            </div>
            <span className="font-extrabold text-amber-950 mt-1 block font-mono text-sm">
              {profile.alumniIdNumber || 'Issued on verification'}
            </span>
            <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
              Unique & Non-Editable
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">Roll Number</span>
            <span className="font-bold text-slate-900 mt-1 block font-mono text-sm">{profile.rollNumber}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">Register Number</span>
            <span className="font-bold text-slate-900 mt-1 block font-mono text-sm">{profile.registerNumber}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">Degree & Dept</span>
            <span className="font-bold text-slate-900 mt-1 block truncate text-sm">
              {profile.degree} • {profile.department?.code}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">Batch Duration</span>
            <span className="font-bold text-slate-900 mt-1 block text-sm">
              {profile.batchStartYear} - {profile.batchEndYear}
            </span>
          </div>
        </div>
      </div>

      {/* Official Personal Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
            <User className="w-4 h-4 text-bit-700" />
            <span>Personal & Contact Information</span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            Modifications require admin review
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">Blood Group</span>
            <span className="font-bold text-slate-900 mt-1 block text-sm">{profile.bloodGroup || 'Not specified'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">Date of Birth</span>
            <span className="font-bold text-slate-900 mt-1 block font-mono text-sm">{profile.dateOfBirth || 'On file'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">Mobile Number</span>
            <span className="font-bold text-slate-900 mt-1 block font-mono text-sm">{profile.phoneNumber || 'Not provided'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2">
            <span className="text-slate-400 font-semibold block text-[11px]">Personal Email</span>
            <span className="font-bold text-slate-900 mt-1 block text-sm">{profile.personalEmail || profile.accountEmail}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-3">
            <span className="text-slate-400 font-semibold block text-[11px]">Permanent Residential Address</span>
            <span className="font-bold text-slate-900 mt-1 block text-sm">
              {profile.permanentAddress ? (
                <>
                  {profile.permanentAddress}
                  {profile.city && `, ${profile.city}`}
                  {profile.state && `, ${profile.state}`}
                  {profile.postalCode && ` - ${profile.postalCode}`}
                </>
              ) : (
                'On institutional record'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Professional Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-bit-700" />
            <span>Career & Employment Domain</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">Current Employer</span>
            <span className="font-bold text-slate-900 mt-1 block text-sm">{profile.currentCompany || 'Not specified'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">Designation</span>
            <span className="font-bold text-slate-900 mt-1 block text-sm">{profile.currentDesignation || 'Not specified'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">Industry Domain</span>
            <span className="font-bold text-slate-900 mt-1 block text-sm">{profile.industry || 'Technology'}</span>
          </div>
        </div>
      </div>

      {/* Request History Section */}
      {changeRequests.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <History className="w-4 h-4 text-bit-700" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Profile Change Request History
            </h2>
          </div>

          <div className="space-y-3">
            {changeRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">
                      Request #{req.id.substring(0, 8)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Submitted on {new Date(req.createdAt).toLocaleDateString()}
                    {req.reviewedAt && ` • Reviewed on ${new Date(req.reviewedAt).toLocaleDateString()}`}
                  </span>
                  {req.adminComment && (
                    <p className="text-[11px] text-slate-700 italic pt-0.5">
                      Feedback: "{req.adminComment}"
                    </p>
                  )}
                </div>

                {req.status === 'REJECTED' && !pendingRequest && (
                  <Link
                    to={`/alumni/change-request?edit=${req.id}`}
                    className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Edit & Resubmit</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
