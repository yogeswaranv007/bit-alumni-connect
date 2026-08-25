import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  LogOut,
  User,
  Shield,
  Menu,
  X,
  CreditCard,
  Users,
  LayoutDashboard
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout, isAdmin, isAlumni } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Portal Branding */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-bit-800 to-bit-600 flex items-center justify-center text-white shadow-md shadow-bit-700/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
                  BIT <span className="text-bit-700">Connect</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  Bannari Amman Institute of Tech
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/directory"
              className="text-sm font-semibold text-slate-600 hover:text-bit-700 transition flex items-center space-x-1"
            >
              <Users className="w-4 h-4" />
              <span>Alumni Directory</span>
            </Link>

            {isAuthenticated ? (
              <>
                {isAlumni() && (
                  <>
                    <Link
                      to="/alumni/dashboard"
                      className="text-sm font-semibold text-slate-600 hover:text-bit-700 transition flex items-center space-x-1"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/alumni/virtual-id"
                      className="text-sm font-semibold text-slate-600 hover:text-bit-700 transition flex items-center space-x-1"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Digital ID</span>
                    </Link>
                  </>
                )}

                {isAdmin() && (
                  <Link
                    to="/admin/dashboard"
                    className="text-sm font-semibold text-bit-800 bg-bit-50 hover:bg-bit-100 px-3 py-1.5 rounded-lg border border-bit-200 transition flex items-center space-x-1.5"
                  >
                    <Shield className="w-4 h-4 text-bit-700" />
                    <span>Admin Console</span>
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-bit-700 text-white font-bold text-xs flex items-center justify-center uppercase shadow-sm">
                      {user?.fullName ? user.fullName.charAt(0) : 'U'}
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                        {user?.fullName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                        {user?.email}
                      </p>
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {user?.roles?.[0]?.replace('ROLE_', '') || 'MEMBER'}
                        </span>
                      </div>

                      {isAlumni() && (
                        <Link
                          to="/alumni/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-bit-700"
                        >
                          <User className="w-4 h-4 mr-2 text-slate-400" />
                          My Profile
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-bit-700 px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-bit-700 hover:bg-bit-800 px-4 py-2 rounded-xl shadow-sm hover:shadow transition"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/directory"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            Alumni Directory
          </Link>

          {isAuthenticated ? (
            <>
              {isAlumni() && (
                <>
                  <Link
                    to="/alumni/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/alumni/virtual-id"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Digital ID Card
                  </Link>
                  <Link
                    to="/alumni/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    My Profile
                  </Link>
                </>
              )}
              {isAdmin() && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-bit-700 bg-bit-50"
                >
                  Admin Console
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-rose-600 hover:bg-rose-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl bg-bit-700 text-white font-semibold"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
