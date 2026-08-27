import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  User,
  Users,
  ShieldCheck,
  CheckCircle,
  FileText
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { isAlumni, isAdmin } = useAuth();

  const alumniLinks = [
    { name: 'Dashboard', path: '/alumni/dashboard', icon: LayoutDashboard },
    { name: 'Digital Alumni ID', path: '/alumni/virtual-id', icon: CreditCard },
    { name: 'My Profile', path: '/alumni/profile', icon: User },
    { name: 'Alumni Directory', path: '/directory', icon: Users },
  ];

  const adminLinks = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Alumni Verification', path: '/admin/alumni', icon: ShieldCheck },
    { name: 'Change Requests', path: '/admin/change-requests', icon: FileText },
    { name: 'Alumni Directory', path: '/directory', icon: Users },
  ];

  const links = isAdmin() ? adminLinks : alumniLinks;

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
          <div className="px-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              {isAdmin() ? 'Administrator Console' : 'Alumnus Portal'}
            </span>
          </div>

          <nav className="space-y-1.5">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-bit-700 text-white shadow-sm shadow-bit-700/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
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
