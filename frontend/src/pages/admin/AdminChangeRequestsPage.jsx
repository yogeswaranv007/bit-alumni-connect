import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { profileChangeApi } from '../../api/profileChangeApi';
import { alumniApi } from '../../api/alumniApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  FileEdit,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AdminChangeRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [status, setStatus] = useState('PENDING');
  const [departmentId, setDepartmentId] = useState('');
  const [batchEndYear, setBatchEndYear] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        status: status || undefined,
        departmentId: departmentId ? parseInt(departmentId, 10) : undefined,
        batchEndYear: batchEndYear ? parseInt(batchEndYear, 10) : undefined,
        search: search || undefined,
      };

      const res = await profileChangeApi.searchAdminChangeRequests(params);
      if (res.data) {
        setRequests(res.data.content || []);
        setTotalElements(res.data.totalElements || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error('Failed to fetch change requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    alumniApi.getDepartments().then((res) => {
      if (res.data) setDepartments(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [status, departmentId, batchEndYear, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchRequests();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-bit-50 text-bit-700 flex items-center justify-center font-bold flex-shrink-0">
            <FileEdit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Profile Change Requests
            </h1>
            <p className="text-xs text-slate-500">
              Review and approve proposed alumni profile and Digital Alumni ID card modifications
            </p>
          </div>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
          <button
            onClick={() => { setStatus('PENDING'); setPage(0); }}
            className={`px-4 py-2 rounded-xl transition ${
              status === 'PENDING' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => { setStatus(''); setPage(0); }}
            className={`px-4 py-2 rounded-xl transition ${
              status === '' ? 'bg-white text-slate-900 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Requests
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search name, roll, reg no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING (Requires Action)</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div>
            <select
              value={departmentId}
              onChange={(e) => { setDepartmentId(e.target.value); setPage(0); }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 bg-white"
            >
              <option value="">All Academic Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Grad Year (e.g. 2026)"
              value={batchEndYear}
              onChange={(e) => { setBatchEndYear(e.target.value); setPage(0); }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition flex-shrink-0"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner size="lg" text="Loading change requests..." />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileEdit className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Change Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {status === 'PENDING'
                ? 'Great job! There are currently no pending profile change requests requiring administrative review.'
                : 'No change requests match the specified filtering criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Alumnus</th>
                  <th className="px-6 py-4">Department & Batch</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block text-sm">{req.alumniName}</span>
                        <span className="font-mono text-slate-500 block text-[11px]">
                          Reg: {req.registerNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">{req.departmentCode}</span>
                        <span className="text-slate-500 block text-[11px]">
                          Class of {req.batchEndYear} ({req.batchStartYear} - {req.batchEndYear})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="text-slate-800 block">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        }`}
                      >
                        {req.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                        {req.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {req.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/change-requests/${req.id}`}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs shadow-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review Comparison</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing Page {page + 1} of {totalPages} ({totalElements} total requests)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
