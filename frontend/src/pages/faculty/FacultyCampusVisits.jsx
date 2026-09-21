import React, { useState, useEffect } from 'react';
import { campusVisitApi } from '../../api/campusVisitApi';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  Building,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  Info,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building2
} from 'lucide-react';

export const FacultyCampusVisits = () => {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 0, size: 10, totalPages: 1, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDING'); // Default to PENDING for fast review
  const [filterScope, setFilterScope] = useState('ALL_DEPARTMENT');
  const [filterVisitType, setFilterVisitType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState('visitDate');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(0);

  // Approval Modal State
  const [approveModalVisit, setApproveModalVisit] = useState(null);
  const [approveData, setApproveData] = useState({
    approvedArrivalTime: '10:30:00',
    meetingLocation: 'IT Department Staff Room (Room 204)',
    contactPerson: 'Dr. Suresh Kumar',
    adminRemarks: 'Meeting scheduled in department premises.',
  });

  // Rejection Modal State
  const [rejectModalVisit, setRejectModalVisit] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchFacultyVisits();
  }, [filterStatus, filterScope, filterVisitType, filterDate, sortBy, sortDirection, currentPage]);

  const fetchFacultyVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await campusVisitApi.getFacultyVisits({
        status: filterStatus || undefined,
        scope: filterScope,
        visitType: filterVisitType || undefined,
        visitDate: filterDate || undefined,
        search: searchTerm ? searchTerm.trim() : undefined,
        page: currentPage,
        size: 10,
        sortBy,
        sortDirection,
      });

      if (res.success && res.data) {
        if (res.data.content) {
          setVisits(res.data.content);
          setPageInfo({
            page: res.data.pageNumber || 0,
            size: res.data.pageSize || 10,
            totalPages: res.data.totalPages || 1,
            totalElements: res.data.totalElements || res.data.content.length,
          });
        } else if (Array.isArray(res.data)) {
          setVisits(res.data);
          setPageInfo({ page: 0, size: res.data.length, totalPages: 1, totalElements: res.data.length });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch department campus visits');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchFacultyVisits();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterScope('ALL_DEPARTMENT');
    setFilterVisitType('');
    setFilterDate('');
    setSortBy('visitDate');
    setSortDirection('DESC');
    setCurrentPage(0);
  };

  const activeFiltersCount = [
    searchTerm,
    filterStatus,
    filterScope !== 'ALL_DEPARTMENT',
    filterVisitType,
    filterDate,
    sortBy !== 'visitDate' || sortDirection !== 'DESC'
  ].filter(Boolean).length;

  const handleApprove = async (e) => {
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

      const res = await campusVisitApi.approveFacultyVisit(approveModalVisit.id, payload);
      if (res.success) {
        const name = approveModalVisit.alumniName || approveModalVisit.alumni?.name || 'Alumnus';
        setSuccess(`Campus visit for ${name} approved successfully!`);
        setApproveModalVisit(null);
        fetchFacultyVisits();
      } else {
        setError(res.message || 'Approval failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to approve campus visit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectModalVisit) return;
    if (!rejectionComment.trim()) {
      setError('Rejection requires a meaningful explanation for the alumnus.');
      return;
    }
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await campusVisitApi.rejectFacultyVisit(rejectModalVisit.id, {
        status: 'REJECTED',
        comment: rejectionComment.trim(),
        rejectionComment: rejectionComment.trim(),
      });
      if (res.success) {
        const name = rejectModalVisit.alumniName || rejectModalVisit.alumni?.name || 'Alumnus';
        setSuccess(`Campus visit for ${name} rejected with comments.`);
        setRejectModalVisit(null);
        setRejectionComment('');
        fetchFacultyVisits();
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
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-6 h-6 text-indigo-700" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Department Faculty Approvals
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Review, search, and authorize campus visit requests assigned to your department ({user?.email || 'Faculty'}).
          </p>
        </div>

        <button
          onClick={fetchFacultyVisits}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Scoped Security Note */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 text-xs flex items-start space-x-3">
        <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Faculty Authorization Policy:</p>
          <p className="text-indigo-800/90 leading-relaxed">
            Faculty approvals are scoped to your assigned department. Approving a request authorizes physical gate entry clearance at BIT Main Gate for that alumnus on the specified date.
          </p>
        </div>
      </div>

      {/* Quick Status Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => { setFilterStatus('PENDING'); setCurrentPage(0); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            filterStatus === 'PENDING'
              ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Approvals</span>
        </button>

        <button
          onClick={() => { setFilterStatus('APPROVED'); setCurrentPage(0); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            filterStatus === 'APPROVED'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Approved</span>
        </button>

        <button
          onClick={() => { setFilterStatus('SCHEDULED'); setCurrentPage(0); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            filterStatus === 'SCHEDULED'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Scheduled</span>
        </button>

        <button
          onClick={() => { setFilterStatus('REJECTED'); setCurrentPage(0); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            filterStatus === 'REJECTED'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected</span>
        </button>

        <button
          onClick={() => { setFilterStatus('EXPIRED'); setCurrentPage(0); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            filterStatus === 'EXPIRED'
              ? 'bg-zinc-700 text-white shadow-sm shadow-zinc-700/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Expired</span>
        </button>

        <button
          onClick={() => { setFilterStatus(''); setCurrentPage(0); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            filterStatus === ''
              ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <span>All Statuses (My Department)</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by alumnus name, roll no, register no, purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setCurrentPage(0); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Scope Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Queue Scope</label>
            <select
              value={filterScope}
              onChange={(e) => { setFilterScope(e.target.value); setCurrentPage(0); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
            >
              <option value="ALL_DEPARTMENT">My Department Queue</option>
              <option value="ASSIGNED_TO_ME">Assigned to Me Only</option>
            </select>
          </div>

          {/* Visit Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Visit Type</label>
            <select
              value={filterVisitType}
              onChange={(e) => { setFilterVisitType(e.target.value); setCurrentPage(0); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
            >
              <option value="">All Types</option>
              <option value="FACULTY_MEETING">Faculty Meeting</option>
              <option value="DEPARTMENT_VISIT">Department Visit</option>
              <option value="ALUMNI_ASSOCIATION_EVENT">Alumni Event</option>
              <option value="CAMPUS_EVENT">Campus Event</option>
              <option value="PERSONAL_VISIT">Personal Visit</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Specific Date Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Visit Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(0); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sort By</label>
            <select
              value={`${sortBy}:${sortDirection}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split(':');
                setSortBy(sb);
                setSortDirection(sd);
                setCurrentPage(0);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
            >
              <option value="visitDate:DESC">Visit Date (Newest first)</option>
              <option value="visitDate:ASC">Visit Date (Oldest / Upcoming)</option>
              <option value="createdAt:DESC">Requested Date (Newest first)</option>
              <option value="createdAt:ASC">Requested Date (Oldest first)</option>
              <option value="alumniName:ASC">Alumnus Name (A-Z)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={activeFiltersCount === 0}
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>
          </div>
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

      {/* Visits List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Department Visits ({pageInfo.totalElements})
          </h2>
          {pageInfo.totalPages > 1 && (
            <div className="text-xs text-slate-500 font-medium">
              Page {pageInfo.page + 1} of {pageInfo.totalPages}
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading department requests...</span>
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No visits found matching filters</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try adjusting your search keywords, status tabs, or clearing filters.
            </p>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                <span>Clear Active Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visits.map((visit) => {
              const alumniName = visit.alumniName || visit.alumni?.name || 'Alumnus';
              const alumniId = visit.alumniIdNumber || visit.alumni?.alumniIdNumber || visit.alumni?.rollNumber;
              const facultyHost = visit.assignedFacultyName || visit.assignedFaculty;

              return (
                <div
                  key={visit.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{alumniName}</h3>
                      <p className="text-xs font-mono text-bit-700 font-bold">{alumniId}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        visit.status === 'APPROVED' || visit.status === 'SCHEDULED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : visit.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : visit.status === 'EXPIRED'
                          ? 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                          : visit.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {visit.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p>
                      <strong className="text-slate-700">Visit Date:</strong> {visit.visitDate}
                    </p>
                    <p>
                      <strong className="text-slate-700">Preferred Arrival:</strong> {visit.preferredArrivalTime || 'Not specified'}
                    </p>
                    {visit.approvedArrivalTime && (
                      <p className="text-emerald-700">
                        <strong>Approved Arrival:</strong> {visit.approvedArrivalTime}
                      </p>
                    )}
                    <p>
                      <strong className="text-slate-700">Department:</strong> {visit.departmentName || 'N/A'}
                    </p>
                    <p>
                      <strong className="text-slate-700">Purpose:</strong> {visit.purpose}
                    </p>
                    {facultyHost && (
                      <p>
                        <strong className="text-slate-700">Arranged With / Faculty:</strong> {facultyHost}
                      </p>
                    )}
                    {visit.associatedEvents && visit.associatedEvents.length > 0 && (
                      <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900">
                        Linked Event: <strong>{visit.associatedEvents[0].title}</strong>
                      </div>
                    )}
                    {visit.associatedEventTitle && (
                      <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900">
                        Linked Event: <strong>{visit.associatedEventTitle}</strong>
                      </div>
                    )}

                    {/* Approver details if resolved */}
                    {visit.approvedByName && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 space-y-0.5">
                        <p className="font-bold text-slate-800">
                          {visit.status === 'REJECTED' ? 'Rejected by:' : 'Approved by:'} {visit.approvedByName} ({visit.approverRole || 'ROLE_STAFF'})
                        </p>
                        {visit.adminComment && (
                          <p className="text-slate-600">Comment: {visit.adminComment}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {visit.status === 'PENDING' && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setRejectModalVisit(visit);
                          setRejectionComment('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setApproveModalVisit(visit);
                          setApproveData({
                            approvedArrivalTime: visit.preferredArrivalTime || '10:30:00',
                            meetingLocation: `${visit.departmentName || 'Department'} Staff Room / Premises`,
                            contactPerson: facultyHost || user?.fullName || 'Department Faculty',
                            adminRemarks: 'Approved for departmental campus visit.',
                          });
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        Approve Visit
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {pageInfo.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
            <p className="text-xs text-slate-500">
              Showing page <strong>{pageInfo.page + 1}</strong> of <strong>{pageInfo.totalPages}</strong> ({pageInfo.totalElements} total visits)
            </p>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={pageInfo.page === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={pageInfo.page >= pageInfo.totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {approveModalVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Authorize Campus Visit Pass
              </h3>
              <button onClick={() => setApproveModalVisit(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Approving visit for <strong>{approveModalVisit.alumniName}</strong> on <strong>{approveModalVisit.visitDate}</strong>.
            </p>

            <form onSubmit={handleApprove} className="space-y-3">
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
                  Meeting Location / Room
                </label>
                <input
                  type="text"
                  placeholder="e.g. IT Department Room 204"
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
                  placeholder="e.g. Dr. Suresh Kumar"
                  value={approveData.contactPerson}
                  onChange={(e) => setApproveData({ ...approveData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Special Instructions / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please collect visitor badge at Main Gate"
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
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : 'Confirm Authorization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
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
              Rejecting visit for <strong>{rejectModalVisit.alumniName}</strong>. A reason is required so the alumnus knows how to proceed.
            </p>

            <form onSubmit={handleReject} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Rejection Reason / Comments *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Faculty unavailable on requested date due to internal exams. Please reschedule for next week."
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
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
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

export default FacultyCampusVisits;
