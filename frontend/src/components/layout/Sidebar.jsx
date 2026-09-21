import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminNotificationApi } from '../../api/adminNotificationApi';
import {
  LayoutDashboard,
  CreditCard,
  User,
  Users,
  ShieldCheck,
  FileText,
  CalendarCheck,
  ClipboardList,
  Radio,
  Clock,
  Scan
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { isAlumni, isAdmin, isStaff, isAdminOnly, isWatchman } = useAuth();
  const [pendingSummary, setPendingSummary] = useState(null);

  useEffect(() => {
    if (isAdminOnly() || isAdmin() || isStaff()) {
      fetchPendingSummary();
      const interval = setInterval(fetchPendingSummary, 20000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchPendingSummary = async () => {
    try {
      const res = await adminNotificationApi.getPendingSummary();
      if (res && res.success && res.data) {
        setPendingSummary(res.data);
      }
    } catch {
      // quiet fallback
    }
  };

  const alumniLinks = [
    { name: 'Dashboard', path: '/alumni/dashboard', icon: LayoutDashboard },
    { name: 'Campus Visit Pass', path: '/alumni/campus-visits', icon: CalendarCheck },
    { name: 'Digital Alumni ID', path: '/alumni/virtual-id', icon: CreditCard },
    { name: 'My Profile', path: '/alumni/profile', icon: User },
    { name: 'Alumni Directory', path: '/directory', icon: Users },
  ];

  const staffLinks = [
    { name: 'Faculty Approvals', path: '/faculty/campus-visits', icon: CalendarCheck, badge: pendingSummary?.pendingCampusVisits },
    { name: 'Gate Entry Logs', path: '/faculty/campus-entry-logs', icon: Clock },
    { name: 'Alumni Directory', path: '/directory', icon: Users },
  ];

  const adminLinks = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    {
      name: 'Alumni Verification',
      path: '/admin/alumni',
      icon: ShieldCheck,
      badge: pendingSummary?.pendingAlumniVerifications,
      badgeColor: 'bg-amber-500 text-slate-950'
    },
    {
      name: 'Campus Visits',
      path: '/admin/campus-visits',
      icon: CalendarCheck,
      badge: pendingSummary?.pendingCampusVisits,
      badgeColor: 'bg-emerald-500 text-white'
    },
    { name: 'Gate Entry Logs', path: '/admin/campus-entry-logs', icon: Clock },
    { name: 'RFID Cards', path: '/admin/rfid-management', icon: Radio },
    {
      name: 'Change Requests',
      path: '/admin/change-requests',
      icon: FileText,
      badge: pendingSummary?.pendingChangeRequests,
      badgeColor: 'bg-purple-500 text-white'
    },
    { name: 'Alumni Directory', path: '/directory', icon: Users },
  ];

  const watchmanLinks = [
    { name: 'Gate Verification', path: '/watchman', icon: Scan },
  ];

  let links = alumniLinks;
  let panelTitle = 'Alumnus Portal';

  if (isWatchman()) {
    links = watchmanLinks;
    panelTitle = 'Gate Security';
  } else if (isAdminOnly()) {
    links = adminLinks;
    panelTitle = 'Administrator Console';
  } else if (isStaff()) {
    links = staffLinks;
    panelTitle = 'Faculty Portal';
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="py-6 px-4 space-y-6 overflow-y-auto">
          <div className="px-3 flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              {panelTitle}
            </span>
            {isAdminOnly() && pendingSummary && pendingSummary.totalPendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {pendingSummary.totalPendingCount} Action{pendingSummary.totalPendingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <nav className="space-y-1.5">
            {links.map((item) => {
              const Icon = item.icon;
              const hasBadge = typeof item.badge === 'number' && item.badge > 0;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-bit-700 text-white shadow-sm shadow-bit-700/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {hasBadge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black tracking-tight ${
                        item.badgeColor || 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
            <p className="text-xs font-bold text-slate-800">Need Help?</p>
            <p className="text-[11px] text-slate-500 mt-0.5">alumni@bitsathy.ac.in</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
