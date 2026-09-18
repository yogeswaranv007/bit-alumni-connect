import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminNotificationApi } from '../../api/adminNotificationApi';
import {
  Bell,
  UserCheck,
  MapPin,
  UserCog,
  ChevronRight,
  RefreshCw,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AdminNotificationBell = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState({
    pendingAlumniVerifications: 0,
    pendingCampusVisits: 0,
    pendingChangeRequests: 0,
    totalPendingCount: 0,
    recentPendingItems: []
  });
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchSummary = async () => {
    try {
      const res = await adminNotificationApi.getPendingSummary();
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualRefresh = async (e) => {
    e.stopPropagation();
    setLoading(true);
    await fetchSummary();
    setLoading(false);
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'ALUMNI_VERIFICATION':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'CAMPUS_VISIT':
        return <MapPin className="w-4 h-4 text-bit-600" />;
      case 'PROFILE_CHANGE_REQUEST':
        return <UserCog className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getItemBadgeStyle = (type) => {
    switch (type) {
      case 'ALUMNI_VERIFICATION':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CAMPUS_VISIT':
        return 'bg-blue-50 text-bit-700 border-bit-200';
      case 'PROFILE_CHANGE_REQUEST':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  const totalCount = summary?.totalPendingCount || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Admin Notifications & Pending Approvals"
        aria-label="Admin Notifications"
      >
        <Bell className="w-4 h-4 text-slate-700" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown Box */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded-lg bg-bit-50 text-bit-700">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold text-slate-900">Admin Action Required</span>
              {totalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                  {totalCount} Pending
                </span>
              )}
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-bit-600' : ''}`} />
            </button>
          </div>

          {/* Category Quick Badges */}
          <div className="grid grid-cols-3 gap-1.5 px-3 py-2 bg-slate-50/80 border-b border-slate-100 text-[11px]">
            <button
              onClick={() => handleNavigate('/admin/alumni-verification')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/30 transition text-center group"
            >
              <div className="flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-extrabold text-slate-900 group-hover:text-emerald-700">
                  {summary?.pendingAlumniVerifications || 0}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 group-hover:text-emerald-700 truncate w-full">Alumni</span>
            </button>

            <button
              onClick={() => handleNavigate('/admin/campus-visits')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-bit-300 hover:bg-bit-50/30 transition text-center group"
            >
              <div className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-bit-600" />
                <span className="font-extrabold text-slate-900 group-hover:text-bit-700">
                  {summary?.pendingCampusVisits || 0}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 group-hover:text-bit-700 truncate w-full">Visits</span>
            </button>

            <button
              onClick={() => handleNavigate('/admin/profile-changes')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-amber-300 hover:bg-amber-50/30 transition text-center group"
            >
              <div className="flex items-center space-x-1">
                <UserCog className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-extrabold text-slate-900 group-hover:text-amber-700">
                  {summary?.pendingChangeRequests || 0}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 group-hover:text-amber-700 truncate w-full">Changes</span>
            </button>
          </div>

          {/* Activity List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {summary?.recentPendingItems && summary.recentPendingItems.length > 0 ? (
              summary.recentPendingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 hover:bg-slate-50/90 transition flex items-start space-x-3 group"
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    {getItemIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${getItemBadgeStyle(item.type)} uppercase tracking-wider`}>
                        {item.typeLabel || item.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center">
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.description}</p>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-bit-700">
                        {item.status || 'PENDING'}
                      </span>
                      <button
                        onClick={() => handleNavigate(item.actionUrl || '/admin/dashboard')}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-bit-700 hover:bg-bit-800 text-white text-[10px] font-bold shadow-xs transition"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400">No pending requests requiring admin attention.</p>
              </div>
            )}
          </div>

          {/* Footer View All */}
          <div className="px-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => handleNavigate('/admin/dashboard')}
              className="text-[11px] font-bold text-bit-700 hover:text-bit-800 hover:underline"
            >
              Open Admin Console
            </button>
            <span className="text-[10px] text-slate-400">Live Auto-Update</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;
