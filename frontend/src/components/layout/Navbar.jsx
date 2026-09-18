import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminNotificationBell } from './AdminNotificationBell';
import {
  GraduationCap,
  LogOut,
  User,
  Shield,
  Menu,
  X,
  CreditCard,
  Users,
  LayoutDashboard,
  ChevronDown,
  Globe,
  Award,
  Calendar,
  Image,
  BookOpen,
  Building,
  FileCheck,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout, isAdmin, isAlumni } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navRef = useRef(null);

  // Close dropdowns on outside click or route change
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveDropdown(null);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDropdown = (menuName) => {
    setActiveDropdown(activeDropdown === menuName ? null : menuName);
  };

  return (
    <header ref={navRef} className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-200 flex items-center justify-center shadow-xs overflow-hidden group-hover:scale-105 transition-transform">
                <img
                  src="/logo/BIT_logo.jpg"
                  alt="Bannari Amman Institute of Technology Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "https://www.bitsathy.ac.in/wp-content/uploads/cropped-bit_logo.png";
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none group-hover:text-bit-700 transition-colors">
                  BIT <span className="text-bit-700">Connect</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-gold-700">
                  Stay Ahead • Bannari Amman
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Menus */}
          <nav className="hidden lg:flex items-center space-x-1">
            {/* 1. About Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('about')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeDropdown === 'about' || location.pathname.startsWith('/alumni-association')
                    ? 'text-bit-700 bg-bit-50'
                    : 'text-slate-700 hover:text-bit-700 hover:bg-slate-50'
                }`}
              >
                <span>About</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'about' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'about' && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    to="/alumni-association"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-bit-50 text-bit-700 group-hover:bg-bit-700 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-bit-700">Alumni Association</div>
                      <div className="text-[11px] text-slate-500">Charter, 7 objectives & welfare fund</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* 2. Community Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('community')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeDropdown === 'community' ||
                  location.pathname.startsWith('/directory') ||
                  location.pathname.startsWith('/chapters') ||
                  location.pathname.startsWith('/distinguished-alumni')
                    ? 'text-bit-700 bg-bit-50'
                    : 'text-slate-700 hover:text-bit-700 hover:bg-slate-50'
                }`}
              >
                <span>Community</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'community' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'community' && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                  <Link
                    to="/directory"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-bit-700">Alumni Directory</div>
                      <div className="text-[11px] text-slate-500">Search 33,000+ verified graduates</div>
                    </div>
                  </Link>

                  <Link
                    to="/chapters"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-700 group-hover:bg-purple-700 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-bit-700">Alumni Chapters</div>
                      <div className="text-[11px] text-slate-500">15 Global, national & state hubs</div>
                    </div>
                  </Link>

                  <Link
                    to="/distinguished-alumni"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-gold-50 text-gold-800 group-hover:bg-gold-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-bit-700">Distinguished Alumni</div>
                      <div className="text-[11px] text-slate-500">IAS, Defense, ISRO & industry leaders</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Activities Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('activities')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeDropdown === 'activities' ||
                  location.pathname.startsWith('/events') ||
                  location.pathname.startsWith('/gallery') ||
                  location.pathname.startsWith('/newsletter')
                    ? 'text-bit-700 bg-bit-50'
                    : 'text-slate-700 hover:text-bit-700 hover:bg-slate-50'
                }`}
              >
                <span>Activities</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'activities' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'activities' && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                  <Link
                    to="/events"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-bit-700">Events & Reunions</div>
                      <div className="text-[11px] text-slate-500">Global Meets, batch fests & sports</div>
                    </div>
                  </Link>

                  <Link
                    to="/gallery"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-800 group-hover:bg-amber-700 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <Image className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-bit-700">Photo Gallery</div>
                      <div className="text-[11px] text-slate-500">Campus memories & chapter photo albums</div>
                    </div>
                  </Link>

                  <Link
                    to="/newsletter"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-700 group-hover:bg-rose-700 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-bit-700">Newsletter Archive</div>
                      <div className="text-[11px] text-slate-500">Official AABIT publications (2016-2026)</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Resources Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('resources')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeDropdown === 'resources' ||
                  location.pathname.startsWith('/graduation-registration') ||
                  location.pathname.startsWith('/resources')
                    ? 'text-bit-700 bg-bit-50'
                    : 'text-slate-700 hover:text-bit-700 hover:bg-slate-50'
                }`}
              >
                <span>Resources</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'resources' && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                  <Link
                    to="/graduation-registration"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-bit-700">Graduation Day</div>
                      <div className="text-[11px] text-slate-500">Official convocation registration</div>
                    </div>
                  </Link>

                  <Link
                    to="/resources"
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-bit-700">Official Resources</div>
                      <div className="text-[11px] text-slate-500">DirectVerify, NBA survey, TBI Incubator</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {isAlumni() && (
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/alumni/dashboard"
                      className="text-xs font-bold text-slate-700 hover:text-bit-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition flex items-center space-x-1.5"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-bit-700" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/alumni/virtual-id"
                      className="text-xs font-bold text-bit-950 bg-gold-400 hover:bg-gold-500 px-3 py-2 rounded-xl shadow-xs transition flex items-center space-x-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-950" />
                      <span>Digital ID</span>
                    </Link>
                  </div>
                )}

                {isAdmin() && (
                  <div className="flex items-center space-x-2">
                    <AdminNotificationBell />
                    <Link
                      to="/admin/dashboard"
                      className="text-xs font-bold text-bit-800 bg-bit-50 hover:bg-bit-100 px-3.5 py-2 rounded-xl border border-bit-200 transition flex items-center space-x-1.5 shadow-xs"
                    >
                      <Shield className="w-3.5 h-3.5 text-bit-700" />
                      <span>Admin Console</span>
                    </Link>
                  </div>
                )}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 pl-2.5 pr-2 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-bit-700 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                      {user?.fullName ? user.fullName.charAt(0) : 'U'}
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                        {user?.fullName}
                      </p>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-bit-50 text-bit-700">
                          {user?.roles?.[0]?.replace('ROLE_', '') || 'MEMBER'}
                        </span>
                      </div>

                      {isAlumni() && (
                        <Link
                          to="/alumni/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-bit-700 transition-colors"
                        >
                          <User className="w-4 h-4 mr-2 text-slate-400" />
                          My Profile
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-slate-700 hover:text-bit-700 px-3 py-2 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold text-white bg-bit-700 hover:bg-bit-800 px-4 py-2 rounded-xl shadow-xs transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">Community Hub</div>
            <Link
              to="/alumni-association"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Alumni Association
            </Link>
            <Link
              to="/directory"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Alumni Directory
            </Link>
            <Link
              to="/chapters"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Chapters (15 Hubs)
            </Link>
            <Link
              to="/distinguished-alumni"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Distinguished Alumni
            </Link>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">Activities & Publications</div>
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Events & Reunions
            </Link>
            <Link
              to="/gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Photo Gallery
            </Link>
            <Link
              to="/newsletter"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Newsletter Archives
            </Link>
            <Link
              to="/graduation-registration"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Graduation Day
            </Link>
            <Link
              to="/resources"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Official Resources
            </Link>
          </div>

          {/* User Auth state */}
          <div className="pt-3 border-t border-slate-200">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-1 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                  <p className="text-[10px] text-slate-500">{user?.email}</p>
                </div>

                {isAlumni() && (
                  <>
                    <Link
                      to="/alumni/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/alumni/virtual-id"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-900 bg-gold-400"
                    >
                      Digital ID Card
                    </Link>
                    <Link
                      to="/alumni/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50"
                    >
                      My Profile
                    </Link>
                  </>
                )}

                {isAdmin() && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-bit-700 bg-bit-50"
                  >
                    Admin Console
                  </Link>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 rounded-xl bg-bit-700 text-white font-bold text-sm"
                >
                  Register as Alumni
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
