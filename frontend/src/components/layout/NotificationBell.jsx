import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  CreditCard,
  Building2,
  ShieldAlert,
  UserCheck,
  FileEdit,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { notificationApi } from '../../api/notificationApi';
import { useAuth } from '../../context/AuthContext';
import { resolveNotificationRoute } from '../../utils/notificationRouter';

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Helper to format relative time
  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    const now = new Date();
    const date = new Date(isoString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Fetch unread count from backend
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationApi.getUnreadCount();
      if (res && res.data) {
        const count = typeof res.data.count === 'number' ? res.data.count : res.data.unreadCount || 0;
        setUnreadCount(count);
      }
    } catch (err) {
      console.warn('Failed to fetch unread notification count:', err);
    }
  }, [user]);

  // Fetch recent notifications for dropdown
  const fetchRecentNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await notificationApi.getRecentNotifications(8);
      if (res && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.content || []);
        setNotifications(list);
      }
    } catch (err) {
      console.warn('Failed to load recent notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load and periodic unread count polling (every 45s)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 45000);

    const handleFocus = () => fetchUnreadCount();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchUnreadCount]);

  // When dropdown opens, load recent notifications
  useEffect(() => {
    if (isOpen) {
      fetchRecentNotifications();
    }
  }, [isOpen, fetchRecentNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Mark single notification as read and navigate
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await notificationApi.markAsRead(notif.id);
      } catch (err) {
        console.warn('Failed to mark notification as read on server:', err);
      }
    }

    setIsOpen(false);

    // Determine target route safely and navigate
    const target = resolveNotificationRoute(notif, user);
    if (target) {
      navigate(target);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err);
      fetchUnreadCount();
    } finally {
      setMarkingAll(false);
    }
  };

  // Icon and color mapper according to notification type
  const getNotificationVisuals = (notif) => {
    const type = notif.type || '';
    if (type.includes('APPROVED') || type.includes('VERIFIED')) {
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        bg: 'bg-emerald-50 text-emerald-600 border-emerald-200'
      };
    }
    if (type.includes('REJECTED') || type.includes('DENIED') || type.includes('CANCELLED')) {
      return {
        icon: <XCircle className="w-4 h-4 text-rose-600" />,
        bg: 'bg-rose-50 text-rose-600 border-rose-200'
      };
    }
    if (type.includes('VISIT') || type.includes('GATE_ENTRY') || type.includes('ENTRY')) {
      return {
        icon: <Building2 className="w-4 h-4 text-sky-600" />,
        bg: 'bg-sky-50 text-sky-600 border-sky-200'
      };
    }
    if (type.includes('DIGITAL_ID') || type.includes('VIRTUAL_ID')) {
      return {
        icon: <CreditCard className="w-4 h-4 text-indigo-600" />,
        bg: 'bg-indigo-50 text-indigo-600 border-indigo-200'
      };
    }
    if (type.includes('CHANGE_REQUEST')) {
      return {
        icon: <FileEdit className="w-4 h-4 text-amber-600" />,
        bg: 'bg-amber-50 text-amber-600 border-amber-200'
      };
    }
    if (type.includes('SECURITY') || type.includes('ALERT')) {
      return {
        icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
        bg: 'bg-rose-50 text-rose-600 border-rose-200'
      };
    }
    if (type.includes('EVENT')) {
      return {
        icon: <Calendar className="w-4 h-4 text-purple-600" />,
        bg: 'bg-purple-50 text-purple-600 border-purple-200'
      };
    }
    return {
      icon: <Bell className="w-4 h-4 text-slate-600" />,
      bg: 'bg-slate-100 text-slate-600 border-slate-200'
    };
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Universal Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5 transition-transform duration-200 hover:scale-105" />

        {/* Dynamic Unread Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-rose-500 border-2 border-white rounded-full shadow-sm animate-in fade-in zoom-in-75 duration-200"
            aria-live="polite"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="text-xs font-medium text-slate-300 hover:text-emerald-400 flex items-center space-x-1 transition-colors duration-150 disabled:opacity-50"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {loading && notifications.length === 0 ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex space-x-3">
                    <div className="w-9 h-9 bg-slate-200 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => {
                const visuals = getNotificationVisuals(notif);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 transition-all duration-150 cursor-pointer flex items-start space-x-3.5 hover:bg-slate-50 relative group ${
                      !notif.isRead ? 'bg-emerald-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Unread Indicator Dot */}
                    {!notif.isRead && (
                      <span className="absolute top-4 right-3.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                    )}

                    {/* Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${visuals.bg} shadow-xs mt-0.5`}
                    >
                      {visuals.icon}
                    </div>

                    {/* Notification Details */}
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs truncate ${
                            !notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-800'
                          }`}
                        >
                          {notif.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-[10px] font-medium text-slate-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {getRelativeTime(notif.createdAt)}
                        </span>
                        {notif.actorName && (
                          <span className="text-[10px] text-slate-400">
                            • by {notif.actorName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">You're all caught up!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto">
                  New campus alerts, approvals, and announcements will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline py-1 px-3 transition-colors"
            >
              <span>View all notifications</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
