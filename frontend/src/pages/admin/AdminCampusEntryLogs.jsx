import React, { useState, useEffect, useMemo } from 'react';
import { campusVisitApi } from '../../api/campusVisitApi';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  User,
  Building,
  CreditCard,
  QrCode,
  Radio,
  FileText,
  AlertTriangle,
  X,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Lock,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';

export const AdminCampusEntryLogs = () => {
  const { isStaff, isAdminOnly, user } = useAuth();
  const isFacultyScoped = isStaff() && !isAdminOnly();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [gateFilter, setGateFilter] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Selected Log for Audit Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Quick Date Preset Handler
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const dStr = formatDate(today);
      setStartDate(dStr);
      setEndDate(dStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const dStr = formatDate(y);
      setStartDate(dStr);
      setEndDate(dStr);
    } else if (preset === 'last7') {
      const s = new Date();
      s.setDate(s.getDate() - 6);
      setStartDate(formatDate(s));
      setEndDate(formatDate(today));
    } else if (preset === 'last30') {
      const s = new Date();
      s.setDate(s.getDate() - 29);
      setStartDate(formatDate(s));
      setEndDate(formatDate(today));
    } else {
      // 'all'
      setStartDate('');
      setEndDate('');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate, gateFilter, decisionFilter, methodFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (gateFilter) params.gate = gateFilter;
      if (decisionFilter) params.decision = decisionFilter;
      if (methodFilter) params.verificationMethod = methodFilter;

      const res = await campusVisitApi.getAdminEntryLogs(params);
      if (res.success && res.data) {
        const logList = res.data.content || (Array.isArray(res.data) ? res.data : []);
        setLogs(logList);
      } else {
        setLogs([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch entry audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setGateFilter('');
    setDecisionFilter('');
    setMethodFilter('');
  };

  // Inspect Single Record
  const handleInspectLog = async (log) => {
    setSelectedLog(log);
    setDetailLoading(true);
    try {
      const res = await campusVisitApi.getAdminEntryLogDetail(log.id);
      if (res.success && res.data) {
        setSelectedLog(res.data);
      }
    } catch (err) {
      console.warn('Using standard log data as fallback detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Calculated Stats
  const stats = useMemo(() => {
    const total = logs.length;
    const allowed = logs.filter((l) => l.entryDecision === 'ALLOWED').length;
    const denied = logs.filter((l) => l.entryDecision === 'DENIED').length;
    const qrEntries = logs.filter((l) => l.verificationMethod === 'DIGITAL_ID_QR').length;
    return { total, allowed, denied, qrEntries };
  }, [logs]);

  const getMethodBadge = (method) => {
    switch (method) {
      case 'DIGITAL_ID_QR':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
            <QrCode className="w-3 h-3" />
            <span>Digital QR</span>
          </span>
        );
      case 'PHYSICAL_RFID':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
            <Radio className="w-3 h-3" />
            <span>RFID Card</span>
          </span>
        );
      case 'ALUMNI_ID_NUMBER':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
            <CreditCard className="w-3 h-3" />
            <span>Alumni ID</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-bold">
            <FileText className="w-3 h-3" />
            <span>{method || 'Manual Reg'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Compliance Disclaimer */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-2xl bg-bit-50 text-bit-700">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {isFacultyScoped ? 'Department Gate Entry Logs & Audit' : 'Campus Gate Entry Audit & Investigation'}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {isFacultyScoped
                    ? `Department-Scoped Gate Entry Activity • ${user?.email || 'Faculty'}`
                    : 'Authorized Physical Security Audit Console • Bannari Amman Institute of Technology'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tamper Proof Security Banner */}
        <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
          <Lock className="w-4 h-4 text-bit-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-extrabold text-slate-900 mr-1">
              {isFacultyScoped ? 'Department Scoped Audit Trail:' : 'Tamper-Proof Audit Trail:'}
            </span>
            {isFacultyScoped
              ? 'Displaying authorized gate entries for alumni and campus visits affiliated with your academic department.'
              : 'All gate clearance records are immutable, cryptographically timestamped upon watchman scan/verification, and strictly restricted to authorized administrators and chief security officers. Historical records cannot be modified or deleted.'}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Investigated Entries</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.total}</div>
          <span className="text-[10px] text-slate-400 font-medium">Matching filter criteria</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allowed & Cleared</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{stats.allowed}</div>
          <span className="text-[10px] text-emerald-700 font-bold">Authorized entries</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Denied / Flagged</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{stats.denied}</div>
          <span className="text-[10px] text-rose-700 font-bold">Security incidents / rejections</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Digital QR Passes</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">{stats.qrEntries}</div>
          <span className="text-[10px] text-purple-600 font-bold">Encrypted QR verifications</span>
        </div>
      </div>

      {/* Advanced Filter & Search Console */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Alumni Name, Reg No, Alumni ID, Host Faculty, Purpose, or Gate..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-bit-600 focus:ring-1 focus:ring-bit-600 transition"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Audit</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Date Presets & Range Picker */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Timeframe:</span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7', label: 'Last 7 Days' },
              { id: 'last30', label: 'Last 30 Days' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  datePreset === p.id
                    ? 'bg-bit-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setStartDate(e.target.value);
                }}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setEndDate(e.target.value);
                }}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Gate Location
            </label>
            <select
              value={gateFilter}
              onChange={(e) => setGateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-bit-600"
            >
              <option value="">All Campus Gates</option>
              <option value="Main Gate 1">Main Gate 1</option>
              <option value="South Gate 2">South Gate 2</option>
              <option value="Tech Park Gate 3">Tech Park Gate 3</option>
              <option value="Hostel Gate">Hostel Gate</option>
              <option value="Sports Complex Gate">Sports Complex Gate</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Verification Method
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-bit-600"
            >
              <option value="">All Verification Methods</option>
              <option value="DIGITAL_ID_QR">Digital ID QR Code</option>
              <option value="PHYSICAL_RFID">Physical RFID Smartcard</option>
              <option value="ALUMNI_ID_NUMBER">Permanent Alumni ID</option>
              <option value="REGISTER_NUMBER">College Register Number</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Authorization Decision
            </label>
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-bit-600"
            >
              <option value="">All Decisions</option>
              <option value="ALLOWED">ALLOWED (Cleared Entry)</option>
              <option value="DENIED">DENIED (Security Rejection)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-bit-600" />
            Loading campus entry audit records...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 text-xs">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No gate entry audit logs match your search criteria.</p>
            <p className="text-slate-400 mt-1">Try broadening your date range or clearing search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-extrabold tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-4">Entry Date & Time</th>
                  <th className="px-5 py-4">Alumnus Identity</th>
                  <th className="px-5 py-4">Gate Station & Method</th>
                  <th className="px-5 py-4">Visit Purpose & Host</th>
                  <th className="px-5 py-4">Security Decision</th>
                  <th className="px-5 py-4 text-right">Audit Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => handleInspectLog(log)}
                    className="hover:bg-slate-50/90 transition cursor-pointer group"
                  >
                    {/* Timestamp */}
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.entryDate}</span>
                      </div>
                      <div className="text-[11px] font-mono text-bit-700 font-bold ml-5">
                        {new Date(log.entryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    {/* Alumni Identity */}
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-slate-900 group-hover:text-bit-700 transition">
                        {log.alumniName}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] mt-0.5">
                        <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.alumniIdNumber || log.registerNumber || 'ID Unavailable'}
                        </span>
                        {log.batch && (
                          <span className="text-[10px] text-slate-400">({log.department} '{log.batch})</span>
                        )}
                      </div>
                    </td>

                    {/* Gate & Method */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-bit-600" />
                        <span>{log.gate}</span>
                      </div>
                      <div className="mt-1">
                        {getMethodBadge(log.verificationMethod)}
                      </div>
                    </td>

                    {/* Visit Purpose & Host */}
                    <td className="px-5 py-4 max-w-[200px]">
                      <div className="font-medium text-slate-800 truncate" title={log.visitPurpose || 'Campus Visit'}>
                        {log.visitPurpose || 'Campus Visit'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Host: {log.assignedFaculty || log.contactPerson || 'General Campus'}
                      </div>
                    </td>

                    {/* Decision */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center space-x-1 ${
                            log.entryDecision === 'ALLOWED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.entryDecision === 'ALLOWED' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{log.entryDecision}</span>
                        </span>
                      </div>
                      {log.timingStatus && (
                        <div className="text-[10px] text-slate-400 font-medium mt-1">
                          Timing: {log.timingStatus}
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectLog(log);
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-bit-50 group-hover:bg-bit-700 text-bit-700 group-hover:text-white text-xs font-bold transition shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Detail Modal / Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-bit-50 text-bit-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Campus Entry Audit Record</h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    LOG-REF #{selectedLog.id ? selectedLog.id.toString().substring(0, 8).toUpperCase() : 'N/A'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Top Decision Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  selectedLog.entryDecision === 'ALLOWED'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/70 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {selectedLog.entryDecision === 'ALLOWED' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider">
                      Authorization Result: {selectedLog.entryDecision}
                    </div>
                    <div className="text-[11px] opacity-80">
                      {selectedLog.entryDecision === 'ALLOWED'
                        ? 'Alumnus passed gate security verification and entered campus.'
                        : `Entry was denied. Reason: ${selectedLog.denialReason || 'Unauthorized arrival / token expired'}`}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider block opacity-70">
                    Timing Status
                  </span>
                  <span className="text-xs font-bold font-mono">
                    {selectedLog.timingStatus || 'ON_TIME'}
                  </span>
                </div>
              </div>

              {/* 1. Alumni Identity Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-bit-700" />
                    <span>Alumnus Identity Profile</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-bit-100 text-bit-800">
                    Verified Alumnus
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Full Name</span>
                    <p className="font-extrabold text-slate-900 text-sm">{selectedLog.alumniName}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Permanent Alumni ID</span>
                    <p className="font-mono font-black text-bit-700">{selectedLog.alumniIdNumber || '—'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Department & Batch</span>
                    <p className="font-semibold text-slate-800">
                      {selectedLog.department || 'Department N/A'} • Batch {selectedLog.batch || '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">College Register Number</span>
                    <p className="font-mono font-semibold text-slate-800">{selectedLog.registerNumber || '—'}</p>
                  </div>

                  {selectedLog.alumniEmail && (
                    <div className="flex items-center space-x-1.5 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedLog.alumniEmail}</span>
                    </div>
                  )}

                  {selectedLog.alumniPhone && (
                    <div className="flex items-center space-x-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedLog.alumniPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Campus Visit & Authorization Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-bit-700" />
                    <span>Campus Visit & Approval Details</span>
                  </span>
                  {selectedLog.visitType && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                      {selectedLog.visitType}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Visit Purpose</span>
                    <p className="font-medium text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200/60 mt-0.5">
                      {selectedLog.visitPurpose || 'No stated purpose registered.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Host Faculty / Department</span>
                    <p className="font-bold text-slate-800">
                      {selectedLog.assignedFaculty || selectedLog.contactPerson || 'Campus Administration'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Meeting Location</span>
                    <p className="font-semibold text-slate-800">{selectedLog.meetingLocation || 'Campus Premises'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Authorized Approver</span>
                    <p className="font-semibold text-slate-800">
                      {selectedLog.approvedBy || selectedLog.assignedFaculty || 'Authorized Staff'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Approval Timestamp</span>
                    <p className="font-mono text-slate-700">
                      {selectedLog.approvedAt
                        ? new Date(selectedLog.approvedAt).toLocaleString()
                        : 'Prior Authorization Recorded'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Physical Gate Security Clearance Record */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-bit-700" />
                    <span>Physical Gate Clearance Record</span>
                  </span>
                  {getMethodBadge(selectedLog.verificationMethod)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Gate Station</span>
                    <p className="font-extrabold text-slate-900">{selectedLog.gate}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Gate Security Officer</span>
                    <p className="font-semibold text-slate-800">{selectedLog.watchmanName || 'Gate Security'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Actual Entry Date & Time</span>
                    <p className="font-mono font-bold text-bit-700">
                      {selectedLog.entryDate} • {new Date(selectedLog.entryTimestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Security Notes / Remarks</span>
                    <p className="font-medium text-slate-700">{selectedLog.remarks || 'Standard gate clearance.'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Read-only compliance audit record</span>
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampusEntryLogs;
