import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alumniApi } from '../../api/alumniApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  GraduationCap,
  Building,
  Calendar,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const CreateProfilePage = () => {
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    departmentId: '',
    rollNumber: '',
    registerNumber: '',
    degree: 'B.Tech',
    batchStartYear: 2020,
    batchEndYear: 2024,
    profilePhotoUrl: '',
    dateOfBirth: '',
    bloodGroup: '',
    personalEmail: '',
    phoneNumber: '',
    permanentAddress: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    currentCompany: '',
    currentDesignation: '',
    industry: 'Technology',
    linkedinUrl: '',
    isDirectoryVisible: true,
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await alumniApi.getDepartments();
        if (response.data) {
          setDepartments(response.data);
          if (response.data.length > 0) {
            setFormData((prev) => ({ ...prev, departmentId: response.data[0].id }));
          }
        }
      } catch (err) {
        setError('Failed to load academic departments. Please check server.');
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        departmentId: parseInt(formData.departmentId, 10),
        batchStartYear: parseInt(formData.batchStartYear, 10),
        batchEndYear: parseInt(formData.batchEndYear, 10),
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : null,
      };

      const response = await alumniApi.createProfile(payload);
      if (response.success) {
        navigate('/alumni/dashboard');
      } else {
        setError(response.message || 'Failed to submit profile');
      }
    } catch (err) {
      setError(err.message || 'Error submitting profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDepts) {
    return <LoadingSpinner size="lg" text="Loading departmental catalog..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-bit-50 text-bit-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Alumni Profile Registration
            </h1>
            <p className="text-xs text-slate-500">
              Submit your official institutional and contact details for administrative identity verification
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Academic Identity */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-bit-700 flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>1. Official Academic Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Academic Department *
              </label>
              <select
                name="departmentId"
                required
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 bg-white"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code} - {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Degree *
              </label>
              <select
                name="degree"
                required
                value={formData.degree}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 bg-white"
              >
                <option value="B.E.">B.E. - Bachelor of Engineering</option>
                <option value="B.Tech">B.Tech - Bachelor of Technology</option>
                <option value="M.E.">M.E. - Master of Engineering</option>
                <option value="M.Tech">M.Tech - Master of Technology</option>
                <option value="MBA">MBA - Master of Business Admin</option>
                <option value="MCA">MCA - Master of Computer Applications</option>
                <option value="Ph.D.">Ph.D. - Doctor of Philosophy</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                College Roll Number *
              </label>
              <input
                type="text"
                name="rollNumber"
                required
                placeholder="e.g. 20IT101"
                value={formData.rollNumber}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                University Register No *
              </label>
              <input
                type="text"
                name="registerNumber"
                required
                placeholder="e.g. 7376202IT101"
                value={formData.registerNumber}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Batch Start Year *
              </label>
              <input
                type="number"
                name="batchStartYear"
                required
                min="1996"
                max="2100"
                value={formData.batchStartYear}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Graduation / End Year *
              </label>
              <input
                type="number"
                name="batchEndYear"
                required
                min="2000"
                max="2100"
                value={formData.batchEndYear}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Personal & Physical ID Card Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-bit-700 flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>2. Personal & Contact Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Blood Group
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 bg-white"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="+91 98765 43210"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Personal Email
              </label>
              <input
                type="email"
                name="personalEmail"
                placeholder="personal@gmail.com"
                value={formData.personalEmail}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Profile Photo URL
              </label>
              <input
                type="url"
                name="profilePhotoUrl"
                placeholder="https://example.com/photo.jpg"
                value={formData.profilePhotoUrl}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                City
              </label>
              <input
                type="text"
                name="city"
                placeholder="e.g. Coimbatore"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Permanent Postal Address
              </label>
              <textarea
                name="permanentAddress"
                rows="2"
                placeholder="Full residential address as on records"
                value={formData.permanentAddress}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Professional & Directory Settings */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-bit-700 flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>3. Career & Directory Settings</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Current Employer / Company
              </label>
              <input
                type="text"
                name="currentCompany"
                placeholder="e.g. Google, Zoho, TCS"
                value={formData.currentCompany}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Current Designation / Role
              </label>
              <input
                type="text"
                name="currentDesignation"
                placeholder="e.g. Senior Software Engineer"
                value={formData.currentDesignation}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                name="linkedinUrl"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedinUrl}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="isDirectoryVisible"
                checked={formData.isDirectoryVisible}
                onChange={handleChange}
                className="w-4 h-4 rounded text-bit-700 focus:ring-bit-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700">
                Display my profile in the searchable BIT Alumni Directory (PII like phone & address will remain hidden)
              </span>
            </label>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white font-bold shadow-lg shadow-bit-700/20 hover:shadow-xl transition flex items-center space-x-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Submitting for Verification...' : 'Submit Profile for Verification'}</span>
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};
