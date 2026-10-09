import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminStudentApi } from '../../api/studentApi';
import { alumniApi } from '../../api/alumniApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import {
  GraduationCap, Search, CheckCircle2, XCircle, Clock, Eye,
  Filter, ChevronLeft, ChevronRight, CreditCard, Building,
  Calendar, User, Users, AlertTriangle, RotateCw, Shield,
  Phone, MapPin, Heart, Mail, ChevronDown, Info
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING',  label: 'Pending Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Requires Correction' },
];

const formatDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

export const AdminStudentRegistrationsPage = () => {
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

  // Modal
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchDepartments = useCallback(async () => {
    try {
      const r = await alumniApi.getDepartments();
      if (r.data) setDepartments(r.data);
    } catch {}
  }, []);

  const fetchProfiles = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const params = {
        page: pageNum, size: 10,
        status: statusFilter || undefined,
        departmentId: deptFilter ? parseInt(deptFilter) : undefined,
        batchEndYear: batchFilter ? parseInt(batchFilter) : undefined,
        search: searchTerm.trim() || undefined,
      };
      const res = await adminStudentApi.getStudentRegistrations(params);
      if (res.data) {
        setProfiles(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to load student registrations', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, deptFilter, batchFilter, searchTerm]);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);
  useEffect(() => { fetchProfiles(0); }, [statusFilter, deptFilter, batchFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProfiles(0);
  };

  const openProfile = async (id) => {
    setLoadingModal(true); setSelectedProfile(null);
    setActionMessage(''); setActionError(''); setShowRejectForm(false); setRejectReason('');
    try {
      const res = await adminStudentApi.getStudentRegistrationById(id);
      setSelectedProfile(res.data);
    } catch {}
    finally { setLoadingModal(false); }
  };

  const handleApprove = async () => {
    if (!selectedProfile) return;
    setActionLoading(true); setActionMessage(''); setActionError('');
    try {
      const res = await adminStudentApi.approveStudentRegistration(selectedProfile.id);
      setSelectedProfile(res.data);
      setActionMessage('Registration approved. Digital Student ID issued and student notified.');
      fetchProfiles(page);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProfile || !rejectReason.trim()) return;
    setActionLoading(true); setActionMessage(''); setActionError('');
    try {
      const res = await adminStudentApi.rejectStudentRegistration(selectedProfile.id, rejectReason.trim());
      setSelectedProfile(res.data);
      setActionMessage('Registration rejected. Student notified with your feedback.');
      setShowRejectForm(false); setRejectReason('');
      fetchProfiles(page);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const statusIcon = (s) => {
    if (s === 'APPROVED') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (s === 'REJECTED') return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
    return <Clock className="w-3.5 h-3.5 text-amber-500" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Registration Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Student Registrations</h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
          Review, approve, or reject student registration submissions. Separate from Alumni registrations.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: totalElements, color: 'border-slate-200',  textColor: 'text-slate-700' },
          { label: 'Pending',  value: null,          color: 'border-amber-200',  textColor: 'text-amber-700',   filter: 'PENDING' },
          { label: 'Approved', value: null,          color: 'border-emerald-200',textColor: 'text-emerald-700', filter: 'APPROVED' },
          { label: 'Rejected', value: null,          color: 'border-rose-200',   textColor: 'text-rose-700',    filter: 'REJECTED' },
        ].map(({ label, value, color, textColor, filter }) => (
          <button key={label}
            onClick={() => filter && setStatusFilter(s => s === filter ? '' : filter)}
            className={`bg-white rounded-2xl border ${color} shadow-sm p-4 text-left hover:shadow-md transition`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>{label}</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {value ?? (filter === statusFilter ? profiles.length : '—')}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Filter className="w-4 h-4" />Filters
        </div>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search name, register no., email…"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300" />
            </div>
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
          </select>
          <input type="number" value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
            placeholder="Batch year"
            className="w-28 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300" />
          <button type="submit"
            className="px-4 py-2.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white text-sm font-bold transition">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Student Registration Queue</h2>
            <p className="text-xs text-slate-500">{totalElements} total submissions</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><LoadingSpinner size="lg" text="Loading registrations..." /></div>
        ) : profiles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No student registrations found</p>
            <p className="text-xs">Try adjusting the filters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Register No.</th>
                  <th className="px-5 py-3.5">Department / Degree</th>
                  <th className="px-5 py-3.5">Batch</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs uppercase
                          ${p.studentType === 'DAY_SCHOLAR' ? 'bg-rose-700' : p.studentType === 'HOSTELER' ? 'bg-blue-700' : 'bg-slate-500'}`}>
                          {p.studentType === 'DAY_SCHOLAR' ? 'D' : p.studentType === 'HOSTELER' ? 'H' : p.fullName?.charAt(0)}
                        </div>
                        <div>
                          <span className="block">{p.fullName}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">{p.accountEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-slate-700">{p.registerNumber}</td>
                    <td className="px-5 py-4 text-slate-700">
                      {p.degree} — {p.departmentCode}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{p.batchStartYear}–{p.batchEndYear}</td>
                    <td className="px-5 py-4">
                      {p.studentType === 'DAY_SCHOLAR'
                        ? <span className="inline-flex items-center gap-1 text-rose-700 font-bold"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />D</span>
                        : p.studentType === 'HOSTELER'
                          ? <span className="inline-flex items-center gap-1 text-blue-700 font-bold"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />H</span>
                          : <span className="text-slate-400">—</span>
                      }
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={p.registrationStatus} /></td>
                    <td className="px-5 py-4 text-right">
                      <button id={`review-student-${p.id}`} onClick={() => openProfile(p.id)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs transition">
                        <Eye className="w-3 h-3" />Review
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
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <button disabled={page === 0} onClick={() => fetchProfiles(page - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition">
              <ChevronLeft className="w-3.5 h-3.5" />Prev
            </button>
            <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => fetchProfiles(page + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition">
              Next<ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {(selectedProfile || loadingModal) && (
        <Modal isOpen onClose={() => { setSelectedProfile(null); setActionMessage(''); setActionError(''); setShowRejectForm(false); }}>
          {loadingModal ? (
            <div className="p-12 flex justify-center"><LoadingSpinner size="lg" text="Loading..." /></div>
          ) : selectedProfile && (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Modal header */}
              <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                <div className={`w-12 h-12 rounded-2xl text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0
                  ${selectedProfile.studentType === 'DAY_SCHOLAR' ? 'bg-rose-700' : selectedProfile.studentType === 'HOSTELER' ? 'bg-blue-700' : 'bg-slate-500'}`}>
                  {selectedProfile.studentType === 'DAY_SCHOLAR' ? 'D' : selectedProfile.studentType === 'HOSTELER' ? 'H' : selectedProfile.fullName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-slate-900">{selectedProfile.fullName}</h2>
                  <p className="text-xs text-slate-500">{selectedProfile.accountEmail}</p>
                  <div className="mt-2"><StatusBadge status={selectedProfile.registrationStatus} /></div>
                </div>
              </div>

              {/* Action feedback */}
              {actionMessage && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />{actionMessage}
                </div>
              )}
              {actionError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{actionError}
                </div>
              )}

              {/* Rejection reason (shown when status is REJECTED) */}
              {selectedProfile.registrationStatus === 'REJECTED' && selectedProfile.rejectionReason && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 space-y-1">
                  <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Previous Rejection Reason</p>
                  <p className="text-sm text-rose-800">{selectedProfile.rejectionReason}</p>
                </div>
              )}

              {/* Photo */}
              {selectedProfile.profilePhotoUrl && (
                <div className="flex justify-center">
                  <img src={selectedProfile.profilePhotoUrl} alt={selectedProfile.fullName}
                    className="w-28 h-36 object-cover rounded-xl border-2 border-slate-200 shadow-md" />
                </div>
              )}

              {/* Profile details grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Register No.', value: selectedProfile.registerNumber, icon: GraduationCap },
                  { label: 'Degree', value: selectedProfile.degree, icon: GraduationCap },
                  { label: 'Department', value: `${selectedProfile.departmentName} (${selectedProfile.departmentCode})`, icon: Building },
                  { label: 'Batch', value: `${selectedProfile.batchStartYear}–${selectedProfile.batchEndYear}`, icon: Calendar },
                  { label: 'Student Type', value: selectedProfile.studentType === 'DAY_SCHOLAR' ? '🔴 Day Scholar' : selectedProfile.studentType === 'HOSTELER' ? '🔵 Hosteler' : '—', icon: User },
                  { label: 'Blood Group', value: selectedProfile.bloodGroup, icon: Heart },
                  { label: 'Date of Birth', value: formatDate(selectedProfile.dateOfBirth), icon: Calendar },
                  { label: 'Student Phone', value: selectedProfile.studentPhone, icon: Phone },
                  { label: 'Parent Phone', value: selectedProfile.parentPhone, icon: Phone },
                  { label: 'Official Email', value: selectedProfile.officialEmail, icon: Mail },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Icon className="w-3 h-3" />{label}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 break-words">{value || '—'}</span>
                  </div>
                ))}
                <div className="col-span-2 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />Address
                  </span>
                  <span className="text-xs font-semibold text-slate-800">{selectedProfile.address || '—'}</span>
                </div>
              </div>

              {/* Digital ID status */}
              {selectedProfile.studentIdCardNumber && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3 text-xs">
                  <CreditCard className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-emerald-700 font-semibold">
                    Digital Student ID issued: <span className="font-mono font-black">{selectedProfile.studentIdCardNumber}</span>
                  </span>
                </div>
              )}

              {/* Admin actions */}
              {selectedProfile.registrationStatus !== 'APPROVED' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />Admin Actions
                  </p>

                  {!showRejectForm ? (
                    <div className="flex gap-3">
                      <button id="modal-approve-student-btn" onClick={handleApprove} disabled={actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm font-bold transition">
                        {actionLoading ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
                        Approve & Issue Digital ID
                      </button>
                      <button id="modal-reject-student-btn" onClick={() => setShowRejectForm(true)} disabled={actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white text-sm font-bold transition">
                        <XCircle className="w-4 h-4" />Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-rose-700">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        <p className="text-xs font-bold">Explain what the student needs to correct</p>
                      </div>
                      <textarea
                        id="reject-reason-textarea"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        rows={3}
                        placeholder="e.g. Register number does not match the selected department. Please correct and resubmit."
                        className="w-full px-3.5 py-2.5 border border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                      />
                      <div className="flex gap-3">
                        <button id="modal-confirm-reject-btn" onClick={handleReject}
                          disabled={actionLoading || !rejectReason.trim()}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white text-xs font-bold transition">
                          {actionLoading ? <LoadingSpinner size="sm" /> : <XCircle className="w-3.5 h-3.5" />}
                          Confirm Rejection
                        </button>
                        <button onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                          className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};