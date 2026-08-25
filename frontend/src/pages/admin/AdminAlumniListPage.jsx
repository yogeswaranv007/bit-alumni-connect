import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { alumniApi } from '../../api/alumniApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Building,
  Calendar,
  User,
  AlertTriangle,
  RotateCw
} from 'lucide-react';

export const AdminAlumniListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [deptFilter, setDeptFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Profile for Review Modal
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [virtualIdInfo, setVirtualIdInfo] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await alumniApi.getDepartments();
      if (res.data) setDepartments(res.data);
    } catch (err) {
      console.warn('Failed to load departments', err);
    }
  };

  const fetchProfiles = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const params = {
        page: pageNumber,
        size: 10,
        status: statusFilter || undefined,
        departmentId: deptFilter ? parseInt(deptFilter, 10) : undefined,
        batchEndYear: batchFilter ? parseInt(batchFilter, 10) : undefined,
        search: searchTerm.trim() || undefined,
      };

      const res = await adminApi.getAlumniProfiles(params);
      if (res.data) {
        setProfiles(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
        setPage(res.data.pageNumber || 0);
      }
    } catch (err) {
      console.error('Error fetching admin profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchProfiles(0);
  }, [statusFilter, deptFilter, batchFilter]);

  // Open review modal by query param if reviewId is present
  useEffect(() => {
    const reviewId = searchParams.get('reviewId');
    if (reviewId) {
      openReviewModal(reviewId);
    }
  }, [searchParams]);

  const openReviewModal = async (profileId) => {
    setLoadingModal(true);
    setShowRejectForm(false);
    setRejectReason('');
    setActionMessage('');
    try {
      const res = await adminApi.getAlumniProfileById(profileId);
      if (res.data) {
        setSelectedProfile(res.data);
        if (res.data.verificationStatus === 'VERIFIED') {
          try {
            const vidRes = await adminApi.getVirtualIdByAlumniId(res.data.id);
            if (vidRes.data) setVirtualIdInfo(vidRes.data);
          } catch (vidErr) {
            setVirtualIdInfo(null);
          }
        } else {
          setVirtualIdInfo(null);
        }
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleVerify = async (profileId) => {
    setActionLoading(true);
    setActionMessage('');
    try {
      const res = await adminApi.verifyAlumniProfile(profileId);
      if (res.success) {
        setActionMessage('Alumnus verified and Virtual Alumni ID automatically issued!');
        setSelectedProfile(res.data);
        fetchProfiles(page);
        // Load generated Virtual ID
        try {
          const vidRes = await adminApi.getVirtualIdByAlumniId(res.data.id);
          if (vidRes.data) setVirtualIdInfo(vidRes.data);
        } catch (e) {}
      }
    } catch (err) {
      setActionMessage('Verification failed: ' + (err.message || 'Server error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (profileId) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    setActionMessage('');
    try {
      const res = await adminApi.rejectAlumniProfile(profileId, rejectReason.trim());
      if (res.success) {
        setActionMessage('Profile rejected. Alumnus will be notified to correct the record.');
        setSelectedProfile(res.data);
        setShowRejectForm(false);
        fetchProfiles(page);
      }
    } catch (err) {
      setActionMessage('Rejection failed: ' + (err.message || 'Server error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateQr = async (virtualIdId) => {
    setActionLoading(true);
    try {
      const res = await adminApi.regenerateVirtualIdQr(virtualIdId);
      if (res.success) {
        setVirtualIdInfo(res.data);
        setActionMessage('QR verification token rotated successfully.');
      }
    } catch (err) {
      setActionMessage('QR rotation failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-bit-50 text-bit-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Alumni Identity Verification
            </h1>
            <p className="text-xs text-slate-500">
              Audit, approve, or reject student alumni records and inspect issued digital credentials
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
          {[
            { label: 'All Submissions', value: '' },
            { label: 'Pending Review', value: 'PENDING' },
            { label: 'Verified Alumni', value: 'VERIFIED' },
            { label: 'Action Required / Rejected', value: 'REJECTED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setSearchParams(tab.value ? { status: tab.value } : {});
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === tab.value
                  ? 'bg-bit-700 text-white shadow-sm shadow-bit-700/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Inputs */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProfiles(0);
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-4"
        >
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll no, reg no, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.code} - {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 bg-white"
            >
              <option value="">All Batches</option>
              {batchYears.map((year) => (
                <option key={year} value={year}>
                  Class of {year}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full py-2.5 px-3 rounded-xl bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs transition"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Profiles Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner size="lg" text="Loading verification records..." />
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No Alumni Profiles Found</p>
            <p className="text-xs">No records matching the specified criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Alumnus Name & Email</th>
                  <th className="px-6 py-3.5">Roll / Reg Number</th>
                  <th className="px-6 py-3.5">Degree & Dept</th>
                  <th className="px-6 py-3.5">Graduation</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((p) => (
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
                    <td className="px-6 py-4">
                      <StatusBadge status={p.verificationStatus} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openReviewModal(p.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-bit-700 hover:text-white text-slate-700 font-bold text-xs transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">
              Showing <strong>{profiles.length}</strong> of <strong>{totalElements}</strong> records
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchProfiles(page - 1)}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => fetchProfiles(page + 1)}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        title="Alumni Profile & Identity Inspection"
        maxWidth="max-w-3xl"
      >
        {selectedProfile && (
          <div className="space-y-6">
            {actionMessage && (
              <div className="p-3.5 rounded-xl bg-bit-50 text-bit-900 border border-bit-200 text-xs font-semibold">
                {actionMessage}
              </div>
            )}

            {/* Profile Overview */}
            <div className="flex items-start space-x-4 pb-4 border-b border-slate-100">
              {selectedProfile.profilePhotoUrl ? (
                <img
                  src={selectedProfile.profilePhotoUrl}
                  alt={selectedProfile.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-bit-700 text-white font-extrabold text-2xl flex items-center justify-center">
                  {selectedProfile.fullName?.charAt(0)}
                </div>
              )}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">{selectedProfile.fullName}</h3>
                <p className="text-xs text-slate-500">{selectedProfile.accountEmail} • {selectedProfile.phoneNumber || 'No phone'}</p>
                <div className="pt-1">
                  <StatusBadge status={selectedProfile.verificationStatus} />
                </div>
              </div>
            </div>

            {/* Academic Information Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Institutional Records
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Roll Number</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedProfile.rollNumber}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Register Number</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedProfile.registerNumber}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Department</span>
                  <span className="font-bold text-slate-800">{selectedProfile.department?.code}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Batch Years</span>
                  <span className="font-bold text-slate-800">{selectedProfile.batchStartYear} - {selectedProfile.batchEndYear}</span>
                </div>
              </div>
            </div>

            {/* Personal & Physical ID Data */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Personal & Physical Card Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Date of Birth</span>
                  <span className="font-bold text-slate-800">{selectedProfile.dateOfBirth || 'Not provided'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Blood Group</span>
                  <span className="font-bold text-slate-800">{selectedProfile.bloodGroup || 'Not provided'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                  <span className="text-slate-400 block font-semibold">Permanent Address</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedProfile.permanentAddress || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Virtual ID Credentials (if verified) */}
            {virtualIdInfo && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>Issued Virtual Alumni ID: <strong className="font-mono">{virtualIdInfo.alumniIdCardNumber}</strong></span>
                  </span>
                  <button
                    onClick={() => handleRegenerateQr(virtualIdInfo.id)}
                    disabled={actionLoading}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition disabled:opacity-50"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Rotate QR Token</span>
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Status: <strong>{virtualIdInfo.status}</strong> • Active QR Token: <span className="font-mono">{virtualIdInfo.activeToken?.substring(0, 16)}...</span>
                </p>
              </div>
            )}

            {/* Rejection Feedback Prompt */}
            {showRejectForm && (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-3">
                <label className="block text-xs font-bold text-rose-900">
                  Specify Rejection Reason (Will be displayed to the alumnus)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Register number does not match university graduation list."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedProfile.id)}
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => setSelectedProfile(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
              >
                Close
              </button>

              <div className="flex space-x-3">
                {selectedProfile.verificationStatus !== 'VERIFIED' && !showRejectForm && (
                  <>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center space-x-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleVerify(selectedProfile.id)}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Issue Virtual ID</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
