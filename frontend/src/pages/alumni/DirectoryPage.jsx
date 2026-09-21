import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alumniApi } from '../../api/alumniApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users,
  Search,
  Building,
  Calendar,
  Briefcase,
  MapPin,
  Filter,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';
import { LinkedInIcon } from '../../components/common/Icons';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';

export const DirectoryPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [alumniList, setAlumniList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await alumniApi.getDepartments();
      if (res.data) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.warn('Failed to load departments', err);
    }
  };

  const fetchDirectory = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const params = {
        page: pageNumber,
        size: 9,
        search: search.trim() || undefined,
        departmentId: selectedDept ? parseInt(selectedDept, 10) : undefined,
        batchEndYear: selectedBatch ? parseInt(selectedBatch, 10) : undefined,
      };

      const res = await alumniApi.searchDirectory(params);
      if (res.data) {
        setAlumniList(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
        setPage(res.data.pageNumber || 0);
      }
    } catch (err) {
      console.error('Error fetching alumni directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDirectory(0);
  }, [selectedDept, selectedBatch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDirectory(0);
  };

  // Generate batch years range
  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {!isAuthenticated && <Navbar />}

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
        {/* Header Title & Back Button */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Alumni Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Explore verified Bannari Amman Institute of Technology alumni across departments, industries, and batches
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer hover:border-slate-300"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, company, designation, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            {/* Department Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 bg-white"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code} ({dept.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Year Dropdown */}
            <div className="sm:col-span-2">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 bg-white"
              >
                <option value="">All Batches</option>
                {batchYears.map((year) => (
                  <option key={year} value={year}>
                    Class of {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="sm:col-span-1 flex">
              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs transition"
              >
                Filter
              </button>
            </div>
          </form>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Showing <strong>{alumniList.length}</strong> of <strong>{totalElements}</strong> verified alumni
            </span>
            {(search || selectedDept || selectedBatch) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedDept('');
                  setSelectedBatch('');
                }}
                className="text-bit-700 font-bold hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Alumni Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <LoadingSpinner size="lg" text="Searching alumni directory..." />
          </div>
        ) : alumniList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Alumni Found</h3>
            <p className="text-xs text-slate-500">
              Try refining your search terms or clearing the selected department and batch filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumniList.map((alumnus) => (
              <div
                key={alumnus.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Avatar & Header */}
                  <div className="flex items-start space-x-3.5">
                    {alumnus.profilePhotoUrl ? (
                      <img
                        src={alumnus.profilePhotoUrl}
                        alt={alumnus.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-xs flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-bit-800 to-bit-600 text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0 shadow-xs">
                        {alumnus.fullName?.charAt(0) || 'A'}
                      </div>
                    )}
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">
                        {alumnus.fullName}
                      </h3>
                      <p className="text-xs font-semibold text-bit-700 truncate">
                        {alumnus.degree} • {alumnus.departmentCode}
                      </p>
                      <span className="inline-flex items-center text-[10px] text-slate-500 font-semibold">
                        <Calendar className="w-3 h-3 mr-1" />
                        Class of {alumnus.batchEndYear}
                      </span>
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                    <div className="flex items-center text-slate-700 space-x-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-medium">
                        {alumnus.currentDesignation || 'Alumnus'} {alumnus.currentCompany ? `at ${alumnus.currentCompany}` : ''}
                      </span>
                    </div>

                    {(alumnus.city || alumnus.country) && (
                      <div className="flex items-center text-slate-500 space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">
                          {[alumnus.city, alumnus.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Alumnus
                  </span>

                  {alumnus.linkedinUrl && (
                    <a
                      href={alumnus.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-bit-700 hover:text-bit-800 flex items-center space-x-1"
                    >
                      <LinkedInIcon className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-3 pt-4">
            <button
              onClick={() => fetchDirectory(page - 1)}
              disabled={page === 0}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold text-slate-700">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => fetchDirectory(page + 1)}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {!isAuthenticated && <Footer />}
    </div>
  );
};
