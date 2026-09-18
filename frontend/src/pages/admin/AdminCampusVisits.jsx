import React, { useState, useEffect } from 'react';
import { campusVisitApi } from '../../api/campusVisitApi';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Building,
  User,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  Sparkles,
  BarChart3,
  X,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

const VISIT_TYPES = [
  { value: 'FACULTY_MEETING', label: 'Faculty Meeting' },
  { value: 'DEPARTMENT_VISIT', label: 'Department Visit' },
  { value: 'ALUMNI_ASSOCIATION_EVENT', label: 'Alumni Event' },
  { value: 'PLACEMENT_INTERVIEW_SUPPORT', label: 'Placement Support' },
  { value: 'GUEST_LECTURE', label: 'Guest Lecture' },
  { value: 'TRANSCRIPT_CERTIFICATE_WORK', label: 'Transcript & Admin' },
  { value: 'CAMPUS_WALK_TOUR', label: 'Campus Tour' },
  { value: 'OTHER', label: 'Other Purpose' }
];

export const AdminCampusVisits = () => {
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search, Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVisitType, setFilterVisitType] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState('visitDate');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ page: 0, size: 10, totalPages: 1, totalElements: 0 });

  // Modals
  const [approveModalVisit, setApproveModalVisit] = useState(null);
  const [approveData, setApproveData] = useState({
    approvedArrivalTime: '10:30:00',
    meetingLocation: 'BIT Campus - Main Admin / Department Block',
    contactPerson: 'Institutional Reception / Department HOD',
    adminRemarks: 'Approved by Central Alumni Administration.',
  });

  const [rejectModalVisit, setRejectModalVisit] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadData();
  }, [filterStatus, filterVisitType, filterDepartmentId, filterDate, sortBy, sortDirection, currentPage]);

  const loadDepartments = async () => {
    try {
      const res = await campusVisitApi.getDepartments();
      if (res && res.data) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.warn('Could not load departments list', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [visitsRes, statsRes] = await Promise.all([
        campusVisitApi.getAdminVisits({
          status: filterStatus || undefined,
          visitType: filterVisitType || undefined,
          departmentId: filterDepartmentId ? parseInt(filterDepartmentId) : undefined,
          visitDate: filterDate || undefined,
          search: searchTerm ? searchTerm.trim() : undefined,
          page: currentPage,
          size: 10,
          sortBy,
          sortDirection,
        }),
        campusVisitApi.getAdminVisitStats(),
      ]);

      if (visitsRes.success && visitsRes.data) {
        if (visitsRes.data.content) {
          setVisits(visitsRes.data.content);
          setPageInfo({
            page: visitsRes.data.pageNumber || 0,
            size: visitsRes.data.pageSize || 10,
            totalPages: visitsRes.data.totalPages || 1,
            totalElements: visitsRes.data.totalElements || visitsRes.data.content.length,
          });
        } else if (Array.isArray(visitsRes.data)) {
          setVisits(visitsRes.data);
          setPageInfo({ page: 0, size: visitsRes.data.length, totalPages: 1, totalElements: visitsRes.data.length });
        }
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load visits data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    loadData();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterVisitType('');
    setFilterDepartmentId('');
    setFilterDate('');
    setSortBy('visitDate');
    setSortDirection('DESC');
    setCurrentPage(0);
  };

  const activeFiltersCount = [
    searchTerm,
    filterStatus,
    filterVisitType,
    filterDepartmentId,
    filterDate,
    sortBy !== 'visitDate' || sortDirection !== 'DESC'
  ].filter(Boolean).length;

  const handleAdminApprove = async (e) => {
    e.preventDefault();
    if (!approveModalVisit) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        status: 'APPROVED',
        approvedArrivalTime: approveData.approvedArrivalTime.length === 5 ? `${approveData.approvedArrivalTime}:00` : approveData.approvedArrivalTime,
        meetingLocation: approveData.meetingLocation || undefined,
        contactPerson: approveData.contactPerson || undefined,
        adminRemarks: approveData.adminRemarks || undefined,
      };

      const res = await campusVisitApi.approveAdminVisit(approveModalVisit.id, payload);
      if (res.success) {
        const name = approveModalVisit.alumniName || approveModalVisit.alumni?.name || 'Alumnus';
        setSuccess(`Campus visit for ${name} approved successfully by Admin!`);
        setApproveModalVisit(null);
        loadData();
      } else {
        setError(res.message || 'Approval failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to approve campus visit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminReject = async (e) => {
    e.preventDefault();
    if (!rejectModalVisit) return;
    if (!rejectionComment.trim()) {
      setError('Rejection requires a mandatory explanation.');
      return;
    }
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await campusVisitApi.rejectAdminVisit(rejectModalVisit.id, {
        status: 'REJECTED',
        comment: rejectionComment.trim(),
        rejectionComment: rejectionComment.trim(),
      });
      if (res.success) {
        const name = rejectModalVisit.alumniName || rejectModalVisit.alumni?.name || 'Alumnus';
        setSuccess(`Campus visit for ${name} rejected with remarks.`);
        setRejectModalVisit(null);
        setRejectionComment('');
        loadData();
      } else {
        setError(res.message || 'Rejection failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to reject campus visit');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-bit-700" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Institutional Campus Visit Management
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Monitor, approve, filter, and audit campus entry authorizations across all academic departments and faculty arrangements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters ({activeFiltersCount})</span>
            </button>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Cards / Quick Status Tabs */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => { setFilterStatus(''); setCurrentPage(0); }}
            className={`text-left rounded-2xl p-4 border transition cursor-pointer ${
              filterStatus === '' ? 'bg-bit-50/50 border-bit-300 ring-2 ring-bit-600/20 shadow-xs' : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Visits</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total || 0}</p>
          </button>

          <button
            onClick={() => { setFilterStatus('PENDING'); setCurrentPage(0); }}
            className={`text-left rounded-2xl p-4 border transition cursor-pointer ${
              filterStatus === 'PENDING' ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-500/20 shadow-xs' : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Pending Review</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.pending || 0}</p>
          </button>

          <button
            onClick={() => { setFilterStatus('APPROVED'); setCurrentPage(0); }}
            className={`text-left rounded-2xl p-4 border transition cursor-pointer ${
              filterStatus === 'APPROVED' ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs' : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Approved</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.approved || 0}</p>
          </button>

          <button
            onClick={() => { setFilterStatus('SCHEDULED'); setCurrentPage(0); }}
            className={`text-left rounded-2xl p-4 border transition cursor-pointer ${
              filterStatus === 'SCHEDULED' ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20 shadow-xs' : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Scheduled</span>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats.scheduled || 0}</p>
          </button>

          <button
            onClick={() => { setFilterStatus('REJECTED'); setCurrentPage(0); }}
            className={`text-left rounded-2xl p-4 border transition cursor-pointer ${
              filterStatus === 'REJECTED' ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20 shadow-xs' : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Rejected</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{stats.rejected || 0}</p>
          </button>
        </div>
      )}

      {/* Advanced Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Keyword Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Alumnus Name, ID Number, Purpose, Host..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-bit-600 focus:bg-white transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1 bg-bit-700 hover:bg-bit-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-600 flex-shrink-0">Sort:</span>
            <select
              value={`${sortBy},${sortDirection}`}
              onChange={(e) => {
                const [newSort, newDir] = e.target.value.split(',');
                setSortBy(newSort);
                setSortDirection(newDir);
                setCurrentPage(0);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-bit-600 cursor-pointer"
            >
              <option value="visitDate,DESC">Visit Date (Newest First)</option>
              <option value="visitDate,ASC">Visit Date (Oldest First)</option>
              <option value="createdAt,DESC">Request Date (Recently Created)</option>
              <option value="createdAt,ASC">Request Date (Oldest First)</option>
              <option value="status,ASC">Status</option>
            </select>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Status Dropdown */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(0); }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-bit-600"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Department Dropdown */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Department</label>
            <select
              value={filterDepartmentId}
              onChange={(e) => { setFilterDepartmentId(e.target.value); setCurrentPage(0); }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-bit-600"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name || dept.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Visit Type Dropdown */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Visit Type</label>
            <select
              value={filterVisitType}
              onChange={(e) => { setFilterVisitType(e.target.value); setCurrentPage(0); }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-bit-600"
            >
              <option value="">All Types</option>
              {VISIT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Specific Visit Date Picker */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Specific Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(0); }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-bit-600"
            />
          </div>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-bit-700" />
            <span>Loading campus visits...</span>
          </div>
        ) : visits.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold">No campus visits found matching criteria.</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-bit-700 font-bold hover:underline cursor-pointer"
              >
                Clear all active filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Alumnus</th>
                  <th className="px-6 py-4">Visit Date & Time</th>
                  <th className="px-6 py-4">Purpose / Department</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Approver</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {visits.map((v) => {
                  const alumniName = v.alumniName || v.alumni?.name || 'Alumnus';
                  const alumniId = v.alumniIdNumber || v.alumni?.alumniIdNumber || v.alumni?.rollNumber;
                  const approverName = v.approvedByName || v.approverName;
                  const approverRole = v.approverRole;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div>{alumniName}</div>
                        <div className="text-[11px] font-mono text-bit-700 font-bold">{alumniId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{v.visitDate}</div>
                        <div className="text-[11px] text-slate-400">{v.approvedArrivalTime || v.preferredArrivalTime || 'Anytime'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{v.purpose}</div>
                        <div className="text-[11px] text-slate-400">
                          {v.departmentName ? `${v.departmentName}` : 'General / Central Admin'}
                          {v.assignedFacultyName && ` • Host: ${v.assignedFacultyName}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                          {v.visitType ? v.visitType.replace(/_/g, ' ') : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {approverName ? (
                          <div>
                            <div className="font-bold text-slate-800">{approverName}</div>
                            <div className="text-[10px] text-slate-400">{approverRole}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending Review</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            v.status === 'APPROVED' || v.status === 'SCHEDULED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : v.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : v.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {v.status === 'PENDING' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                setRejectModalVisit(v);
                                setRejectionComment('');
                              }}
                              className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold transition cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setApproveModalVisit(v);
                                setApproveData({
                                  approvedArrivalTime: v.preferredArrivalTime || '10:30:00',
                                  meetingLocation: v.meetingLocation || `${v.departmentName || 'Main Admin'} Block`,
                                  contactPerson: v.assignedFacultyName || 'Department HOD / Host',
                                  adminRemarks: 'Approved by Central Alumni Administration.',
                                });
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pageInfo.totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Showing page <span className="font-bold text-slate-900">{currentPage + 1}</span> of{' '}
              <span className="font-bold text-slate-900">{pageInfo.totalPages}</span> ({pageInfo.totalElements} total visits)
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pageInfo.totalPages - 1, p + 1))}
                disabled={currentPage >= pageInfo.totalPages - 1}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Approve Modal */}
      {approveModalVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Universal Admin Approval
              </h3>
              <button onClick={() => setApproveModalVisit(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Granting campus gate entry authorization for <strong>{approveModalVisit.alumniName || approveModalVisit.alumni?.name}</strong> on <strong>{approveModalVisit.visitDate}</strong>.
            </p>

            <form onSubmit={handleAdminApprove} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Approved Arrival Time *
                </label>
                <input
                  type="time"
                  required
                  value={approveData.approvedArrivalTime}
                  onChange={(e) => setApproveData({ ...approveData, approvedArrivalTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Meeting Location / Block
                </label>
                <input
                  type="text"
                  value={approveData.meetingLocation}
                  onChange={(e) => setApproveData({ ...approveData, meetingLocation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Contact Person / Host
                </label>
                <input
                  type="text"
                  value={approveData.contactPerson}
                  onChange={(e) => setApproveData({ ...approveData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Admin Remarks
                </label>
                <input
                  type="text"
                  value={approveData.adminRemarks}
                  onChange={(e) => setApproveData({ ...approveData, adminRemarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setApproveModalVisit(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Approving...' : 'Confirm Admin Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reject Modal */}
      {rejectModalVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Reject Campus Visit Request
              </h3>
              <button onClick={() => setRejectModalVisit(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Rejecting visit for <strong>{rejectModalVisit.alumniName || rejectModalVisit.alumni?.name}</strong>.
            </p>

            <form onSubmit={handleAdminReject} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Reason for rejection to notify alumnus..."
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectModalVisit(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampusVisits;
