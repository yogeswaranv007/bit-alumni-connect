import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FileEdit,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Filter,
  Check,
  Inbox
} from 'lucide-react';
import { notificationApi } from '../../api/notificationApi';
import { useAuth } from '../../context/AuthContext';
import { resolveNotificationRoute } from '../../utils/notificationRouter';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLast, setIsLast] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async (pageNumber = 0, append = false) => {
    if (pageNumber === 0 && !append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const isReadParam = filter === 'UNREAD' ? false : null;
      const res = await notificationApi.getNotifications({
        page: pageNumber,
        size: 20,
        isRead: isReadParam
      });

      if (res && res.data) {
        const data = res.data;
        const newItems = data.content || [];
        setNotifications((prev) => (append ? [...prev, ...newItems] : newItems));
        setPage(data.pageNumber || pageNumber);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || newItems.length);
        setIsLast(data.isLast !== undefined ? data.isLast : pageNumber >= (data.totalPages || 1) - 1);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Unable to load notifications. Please check your connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      if (res && res.data) {
        const count = typeof res.data.count === 'number' ? res.data.count : res.data.unreadCount || 0;
        setUnreadCount(count);
      }
    } catch (err) {
      console.warn('Failed to fetch unread count:', err);
    }
  }, []);

  // Reload when filter changes
  useEffect(() => {
    setPage(0);
    fetchNotifications(0, false);
    fetchUnreadCount();
  }, [filter, fetchNotifications, fetchUnreadCount]);

  // Handle Load More
  const handleLoadMore = () => {
    if (!isLast && !loadingMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // Mark single as read
  const handleMarkAsRead = async (e, notif) => {
    e.stopPropagation();
    if (notif.isRead) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationApi.markAsRead(notif.id);
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
      fetchUnreadCount();
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationApi.markAllAsRead();
      if (filter === 'UNREAD') {
        fetchNotifications(0, false);
      }
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
      fetchNotifications(0, false);
      fetchUnreadCount();
    } finally {
      setMarkingAll(false);
    }
  };

  // Navigate to referenced resource
  const handleCardClick = async (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead({ stopPropagation: () => {} }, notif);
    }

    const target = resolveNotificationRoute(notif, user);
    if (target) {
      navigate(target);
    }
  };

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
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group notifications into Today, Yesterday, Earlier
  const groupNotificationsByDate = (items) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: []
    };

    items.forEach((item) => {
      const itemDate = new Date(item.createdAt);
      itemDate.setHours(0, 0, 0, 0);

      if (itemDate.getTime() === today.getTime()) {
        groups.Today.push(item);
      } else if (itemDate.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(item);
      } else {
        groups.Earlier.push(item);
      }
    });

    return groups;
  };

  const grouped = groupNotificationsByDate(notifications);

  // Visual styling mapper
  const getNotificationVisuals = (notif) => {
    const type = notif.type || '';
    if (type.includes('APPROVED') || type.includes('VERIFIED')) {
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
        bg: 'bg-emerald-50 text-emerald-600 border-emerald-200'
      };
    }
    if (type.includes('REJECTED') || type.includes('DENIED') || type.includes('CANCELLED')) {
      return {
        icon: <XCircle className="w-5 h-5 text-rose-600" />,
        bg: 'bg-rose-50 text-rose-600 border-rose-200'
      };
    }
    if (type.includes('VISIT') || type.includes('GATE_ENTRY') || type.includes('ENTRY')) {
      return {
        icon: <Building2 className="w-5 h-5 text-sky-600" />,
        bg: 'bg-sky-50 text-sky-600 border-sky-200'
      };
    }
    if (type.includes('DIGITAL_ID') || type.includes('VIRTUAL_ID')) {
      return {
        icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
        bg: 'bg-indigo-50 text-indigo-600 border-indigo-200'
      };
    }
    if (type.includes('CHANGE_REQUEST')) {
      return {
        icon: <FileEdit className="w-5 h-5 text-amber-600" />,
        bg: 'bg-amber-50 text-amber-600 border-amber-200'
      };
    }
    if (type.includes('SECURITY') || type.includes('ALERT')) {
      return {
        icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
        bg: 'bg-rose-50 text-rose-600 border-rose-200'
      };
    }
    if (type.includes('EVENT')) {
      return {
        icon: <Calendar className="w-5 h-5 text-purple-600" />,
        bg: 'bg-purple-50 text-purple-600 border-purple-200'
      };
    }
    return {
      icon: <Bell className="w-5 h-5 text-slate-600" />,
      bg: 'bg-slate-100 text-slate-600 border-slate-200'
    };
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/10">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification Center</h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Real-time alerts, operational updates, and system announcements
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchNotifications(0, false)}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150 disabled:opacity-50"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all duration-150 disabled:opacity-50"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                filter === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center space-x-1.5 ${
                filter === 'UNREAD'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <span>Unread Only</span>
              {unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                    filter === 'UNREAD' ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-rose-700">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold">{error}</span>
            </div>
            <button
              onClick={() => fetchNotifications(0, false)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && notifications.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 animate-pulse flex space-x-4">
                <div className="w-11 h-11 bg-slate-200 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3.5 bg-slate-100 rounded w-4/5" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(grouped).map(([groupTitle, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-3">
                  <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase px-2">
                    {groupTitle}
                  </h3>

                  <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-xs">
                    {items.map((notif) => {
                      const visuals = getNotificationVisuals(notif);
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleCardClick(notif)}
                          className={`p-4 sm:p-5 transition-all duration-150 cursor-pointer flex items-start space-x-4 hover:bg-slate-50/80 relative group ${
                            !notif.isRead ? 'bg-emerald-50/20' : 'bg-white'
                          }`}
                        >
                          {/* Unread Accent Bar */}
                          {!notif.isRead && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                          )}

                          {/* Icon */}
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${visuals.bg} shadow-xs`}
                          >
                            {visuals.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center justify-between gap-2">
                              <h4
                                className={`text-sm tracking-tight ${
                                  !notif.isRead ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-800'
                                }`}
                              >
                                {notif.title}
                              </h4>
                              <span className="text-[11px] font-medium text-slate-400 flex items-center flex-shrink-0">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                {getRelativeTime(notif.createdAt)}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                              {notif.message}
                            </p>

                            <div className="flex items-center flex-wrap gap-2 mt-3">
                              {notif.referenceType && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                                  {notif.referenceType.replace(/_/g, ' ')}
                                </span>
                              )}
                              {notif.actorName && (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  by <span className="text-slate-600 font-semibold">{notif.actorName}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="flex items-center space-x-1 flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notif.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(e, notif)}
                                className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <div className="p-2 text-slate-400 group-hover:text-slate-700">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {!isLast && (
              <div className="text-center pt-4 pb-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200/80 shadow-xs inline-flex items-center space-x-2 transition-all duration-150 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Loading more notifications...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Notifications</span>
                      <span className="text-slate-400 font-normal">
                        ({notifications.length} of {totalElements})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {filter === 'UNREAD' ? 'No unread notifications' : "You're all caught up!"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {filter === 'UNREAD'
                ? 'All pending alerts have been marked as read. Check back later for updates.'
                : 'New campus alerts, profile verifications, and announcements will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
