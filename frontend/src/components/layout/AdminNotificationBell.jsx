import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminNotificationApi } from '../../api/adminNotificationApi';
import { notificationApi } from '../../api/notificationApi';
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
  AlertCircle,
  QrCode,
  CreditCard,
  Building,
  Users,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';

export const AdminNotificationBell = () => {
  const navigate = useNavigate();
  const { user, isAdminOnly, isStaff, isAlumni, isWatchman } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const isAdminUser = isAdminOnly();
  const isFacultyUser = !isAdminUser && isStaff();
  const isAlumniUser = isAlumni();
  const isWatchmanUser = isWatchman();

  // Admin / Faculty pending summary
  const [adminSummary, setAdminSummary] = useState({
    pendingAlumniVerifications: 0,
    pendingCampusVisits: 0,
    pendingChangeRequests: 0,
    totalPendingCount: 0,
    recentPendingItems: []
  });

  // User In-App Notifications (Alumni & Faculty)
  const [userNotifications, setUserNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchSummary = async () => {
    try {
      if (isAdminUser) {
        const res = await adminNotificationApi.getPendingSummary();
        if (res.success && res.data) {
          setAdminSummary(res.data);
        }
      } else if (isFacultyUser) {
        const [summaryRes, notifRes, unreadRes] = await Promise.all([
          adminNotificationApi.getPendingSummary().catch(() => ({ success: false })),
          notificationApi.getMyNotifications().catch(() => ({ data: [] })),
          notificationApi.getUnreadCount().catch(() => ({ data: { unreadCount: 0 } }))
        ]);
        if (summaryRes.success && summaryRes.data) {
          setAdminSummary(summaryRes.data);
        }
        if (notifRes.data) {
          setUserNotifications(Array.isArray(notifRes.data) ? notifRes.data : notifRes.data.content || []);
        }
        if (unreadRes.data) {
          setUnreadCount(unreadRes.data.unreadCount || 0);
        }
      } else if (isAlumniUser) {
        const [notifRes, unreadRes] = await Promise.all([
          notificationApi.getMyNotifications().catch(() => ({ data: [] })),
          notificationApi.getUnreadCount().catch(() => ({ data: { unreadCount: 0 } }))
        ]);
        if (notifRes.data) {
          setUserNotifications(Array.isArray(notifRes.data) ? notifRes.data : notifRes.data.content || []);
        }
        if (unreadRes.data) {
          setUnreadCount(unreadRes.data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [isAdminUser, isFacultyUser, isAlumniUser]);

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

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAllAsRead();
      setUserNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    if (!notif.isRead) {
      try {
        await notificationApi.markAsRead(notif.id);
        setUserNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.warn('Could not mark notification read', err);
      }
    }

    if (isFacultyUser) {
      if (notif.type === 'ENTRY_VERIFIED') {
        navigate('/faculty/campus-entry-logs');
      } else {
        navigate('/faculty/campus-visits');
      }
    } else {
      if (
        notif.type === 'ENTRY_VERIFIED' ||
        notif.type === 'VISIT_APPROVED' ||
        notif.type === 'VISIT_REJECTED' ||
        notif.type === 'VISIT_SCHEDULED'
      ) {
        navigate('/alumni/campus-visits');
      } else if (notif.type === 'SECURITY_ALERT') {
        navigate('/alumni/virtual-id');
      } else if (notif.referenceType === 'ProfileChangeRequest') {
        navigate('/alumni/change-request');
      } else {
        navigate('/alumni/dashboard');
      }
    }
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'ALUMNI_VERIFICATION':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'CAMPUS_VISIT':
      case 'VISIT_REQUESTED':
        return <MapPin className="w-4 h-4 text-bit-600" />;
      case 'PROFILE_CHANGE_REQUEST':
      case 'PROFILE_CHANGE':
        return <UserCog className="w-4 h-4 text-amber-600" />;
      case 'ENTRY_VERIFIED':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'VISIT_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'VISIT_REJECTED':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getItemBadgeStyle = (type) => {
    switch (type) {
      case 'ALUMNI_VERIFICATION':
      case 'VISIT_APPROVED':
      case 'ENTRY_VERIFIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CAMPUS_VISIT':
      case 'VISIT_SCHEDULED':
      case 'VISIT_REQUESTED':
        return 'bg-blue-50 text-bit-700 border-bit-200';
      case 'PROFILE_CHANGE_REQUEST':
      case 'PROFILE_CHANGE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'VISIT_REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
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

  // Compute total badge count according to active role
  const totalCount = isAdminUser
    ? adminSummary?.totalPendingCount || 0
    : isFacultyUser
    ? (adminSummary?.pendingCampusVisits || 0) + unreadCount
    : isAlumniUser
    ? unreadCount
    : 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
        title={
          isAdminUser
            ? 'Admin Action Required'
            : isFacultyUser
            ? 'Faculty Department Notifications'
            : isAlumniUser
            ? 'Alumni Notifications'
            : 'Notifications'
        }
        aria-label="Notifications"
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
          {/* ========================================================================= */}
          {/* 1. ADMIN NOTIFICATIONS VIEW (Restored to exact previous requested design) */}
          {/* ========================================================================= */}
          {isAdminUser && (
            <>
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
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-bit-600' : ''}`} />
                </button>
              </div>

              {/* Category Quick Badges */}
              <div className="grid grid-cols-3 gap-1.5 px-3 py-2 bg-slate-50/80 border-b border-slate-100 text-[11px]">
                <button
                  onClick={() => handleNavigate('/admin/alumni')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/30 transition text-center group cursor-pointer"
                >
                  <div className="flex items-center space-x-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-extrabold text-slate-900 group-hover:text-emerald-700">
                      {adminSummary?.pendingAlumniVerifications || 0}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-emerald-700 truncate w-full">Alumni</span>
                </button>

                <button
                  onClick={() => handleNavigate('/admin/campus-visits')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-bit-300 hover:bg-bit-50/30 transition text-center group cursor-pointer"
                >
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-bit-600" />
                    <span className="font-extrabold text-slate-900 group-hover:text-bit-700">
                      {adminSummary?.pendingCampusVisits || 0}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-bit-700 truncate w-full">Visits</span>
                </button>

                <button
                  onClick={() => handleNavigate('/admin/change-requests')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-amber-300 hover:bg-amber-50/30 transition text-center group cursor-pointer"
                >
                  <div className="flex items-center space-x-1">
                    <UserCog className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-extrabold text-slate-900 group-hover:text-amber-700">
                      {adminSummary?.pendingChangeRequests || 0}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-amber-700 truncate w-full">Changes</span>
                </button>
              </div>

              {/* Activity List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {adminSummary?.recentPendingItems && adminSummary.recentPendingItems.length > 0 ? (
                  adminSummary.recentPendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 hover:bg-slate-50/90 transition flex items-start space-x-3 group"
                    >
                      <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        {getItemIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${getItemBadgeStyle(
                              item.type
                            )} uppercase tracking-wider`}
                          >
                            {item.typeLabel || item.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {formatTimestamp(item.timestamp)}
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
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-bit-700 hover:bg-bit-800 text-white text-[10px] font-bold shadow-xs transition cursor-pointer"
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

              {/* Footer */}
              <div className="px-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleNavigate('/admin/dashboard')}
                  className="text-[11px] font-bold text-bit-700 hover:text-bit-800 hover:underline cursor-pointer"
                >
                  Open Admin Console
                </button>
                <span className="text-[10px] text-slate-400">Live Auto-Update</span>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* 2. FACULTY NOTIFICATIONS VIEW (Department visits + gate check-in alerts)  */}
          {/* ========================================================================= */}
          {isFacultyUser && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded-lg bg-bit-50 text-bit-700">
                    <Building className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">Faculty Department Queue</span>
                  {totalCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-bit-100 text-bit-700">
                      {totalCount} Alerts
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="p-1 rounded-lg text-slate-400 hover:text-bit-700 hover:bg-slate-50 transition cursor-pointer"
                      title="Mark all alerts as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleManualRefresh}
                    disabled={loading}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-bit-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Quick Category Badges */}
              <div className="grid grid-cols-3 gap-1.5 px-3 py-2 bg-slate-50/80 border-b border-slate-100 text-[11px]">
                <button
                  onClick={() => handleNavigate('/faculty/campus-visits')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-bit-300 hover:bg-bit-50/30 transition text-center group cursor-pointer"
                >
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-bit-600" />
                    <span className="font-extrabold text-slate-900 group-hover:text-bit-700">
                      {adminSummary?.pendingCampusVisits || 0}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-bit-700 truncate w-full">Approvals</span>
                </button>

                <button
                  onClick={() => handleNavigate('/faculty/campus-entry-logs')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/30 transition text-center group cursor-pointer"
                >
                  <div className="flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-extrabold text-slate-900 group-hover:text-emerald-700">Gate</span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-emerald-700 truncate w-full">Entry Logs</span>
                </button>

                <button
                  onClick={() => handleNavigate('/directory')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-purple-300 hover:bg-purple-50/30 transition text-center group cursor-pointer"
                >
                  <div className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-extrabold text-slate-900 group-hover:text-purple-700">Alumni</span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-purple-700 truncate w-full">Directory</span>
                </button>
              </div>

              {/* Combined Notifications & Visits List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {/* 1. Live Dispatched Notifications (Visit Requests & Gate Check-in Alerts) */}
                {userNotifications && userNotifications.length > 0 ? (
                  userNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 hover:bg-slate-50/90 transition flex items-start space-x-3 group cursor-pointer ${
                        !notif.isRead ? 'bg-amber-50/25' : ''
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        {getItemIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${getItemBadgeStyle(
                              notif.type
                            )} uppercase tracking-wider`}
                          >
                            {notif.type === 'ENTRY_VERIFIED' ? 'GATE ENTRY' : notif.type ? notif.type.replace(/_/g, ' ') : 'ALERT'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {formatTimestamp(notif.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-800 truncate">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{notif.message}</p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-bit-700">
                            {!notif.isRead ? '• Unread' : 'Read'}
                          </span>
                          <span className="inline-flex items-center space-x-1 text-bit-700 text-[10px] font-bold group-hover:underline">
                            <span>{notif.type === 'ENTRY_VERIFIED' ? 'View Log' : 'Review Visit'}</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : adminSummary?.recentPendingItems && adminSummary.recentPendingItems.length > 0 ? (
                  adminSummary.recentPendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 hover:bg-slate-50/90 transition flex items-start space-x-3 group"
                    >
                      <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        {getItemIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${getItemBadgeStyle(
                              item.type
                            )} uppercase tracking-wider`}
                          >
                            {item.typeLabel || 'VISIT REQUEST'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {formatTimestamp(item.timestamp)}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{item.description}</p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-bit-700">PENDING REVIEW</span>
                          <button
                            onClick={() => handleNavigate('/faculty/campus-visits')}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-bit-700 hover:bg-bit-800 text-white text-[10px] font-bold shadow-xs transition cursor-pointer"
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
                    <p className="text-[11px] text-slate-400">No pending visit requests or gate alerts for your department.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleNavigate('/faculty/campus-visits')}
                  className="text-[11px] font-bold text-bit-700 hover:text-bit-800 hover:underline cursor-pointer"
                >
                  Open Faculty Portal
                </button>
                <span className="text-[10px] text-slate-400">Live Auto-Update</span>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* 3. ALUMNI NOTIFICATIONS VIEW (Preserved exactly as requested)              */}
          {/* ========================================================================= */}
          {isAlumniUser && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded-lg bg-bit-50 text-bit-700">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">My Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="p-1 rounded-lg text-slate-400 hover:text-bit-700 hover:bg-slate-50 transition cursor-pointer"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleManualRefresh}
                    disabled={loading}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-bit-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Quick Category Badges */}
              <div className="grid grid-cols-3 gap-1.5 px-3 py-2 bg-slate-50/80 border-b border-slate-100 text-[11px]">
                <button
                  onClick={() => handleNavigate('/alumni/campus-visits')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-bit-300 hover:bg-bit-50/30 transition text-center group cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-bit-600 mb-0.5" />
                  <span className="text-[10px] font-bold text-slate-700 group-hover:text-bit-700 truncate w-full">Visit Passes</span>
                </button>

                <button
                  onClick={() => handleNavigate('/alumni/virtual-id')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-gold-400 hover:bg-amber-50/30 transition text-center group cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-600 mb-0.5" />
                  <span className="text-[10px] font-bold text-slate-700 group-hover:text-amber-700 truncate w-full">Digital ID</span>
                </button>

                <button
                  onClick={() => handleNavigate('/alumni/change-request')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-purple-300 hover:bg-purple-50/30 transition text-center group cursor-pointer"
                >
                  <UserCog className="w-3.5 h-3.5 text-purple-600 mb-0.5" />
                  <span className="text-[10px] font-bold text-slate-700 group-hover:text-purple-700 truncate w-full">Profile Edit</span>
                </button>
              </div>

              {/* Activity List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {userNotifications && userNotifications.length > 0 ? (
                  userNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 hover:bg-slate-50/90 transition flex items-start space-x-3 group cursor-pointer ${
                        !notif.isRead ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        {getItemIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${getItemBadgeStyle(
                              notif.type
                            )} uppercase tracking-wider`}
                          >
                            {notif.type ? notif.type.replace(/_/g, ' ') : 'ALERT'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {formatTimestamp(notif.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-800 truncate">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{notif.message}</p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-bit-700">
                            {!notif.isRead ? '• Unread' : 'Read'}
                          </span>
                          <span className="inline-flex items-center space-x-1 text-bit-700 text-[10px] font-bold group-hover:underline">
                            <span>View Details</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No new notifications</p>
                    <p className="text-[11px] text-slate-400">You're completely up to date.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleNavigate('/alumni/dashboard')}
                  className="text-[11px] font-bold text-bit-700 hover:text-bit-800 hover:underline cursor-pointer"
                >
                  Open Alumni Dashboard
                </button>
                <span className="text-[10px] text-slate-400">Live Updates</span>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* 4. WATCHMAN NOTIFICATIONS VIEW                                            */}
          {/* ========================================================================= */}
          {isWatchmanUser && (
            <>
              <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded-lg bg-amber-50 text-amber-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">Gate Security Alerts</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 px-3 py-2 bg-slate-50/80 border-b border-slate-100 text-[11px]">
                <button
                  onClick={() => handleNavigate('/watchman')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-bit-300 hover:bg-bit-50/30 transition text-center group cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-bit-600 mb-0.5" />
                  <span className="text-[10px] font-bold text-slate-700 group-hover:text-bit-700 truncate w-full">Gate Scanner</span>
                </button>

                <button
                  onClick={() => handleNavigate('/faculty/campus-entry-logs')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/30 transition text-center group cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mb-0.5" />
                  <span className="text-[10px] font-bold text-slate-700 group-hover:text-emerald-700 truncate w-full">Entry Logs</span>
                </button>
              </div>

              <div className="p-6 text-center text-slate-400">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Gate Operations Active</p>
                <p className="text-[11px] text-slate-400">Ready to scan and verify alumni credentials.</p>
              </div>

              <div className="px-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleNavigate('/watchman')}
                  className="text-[11px] font-bold text-bit-700 hover:text-bit-800 hover:underline cursor-pointer"
                >
                  Open Watchman Portal
                </button>
                <span className="text-[10px] text-slate-400">Live Updates</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;
