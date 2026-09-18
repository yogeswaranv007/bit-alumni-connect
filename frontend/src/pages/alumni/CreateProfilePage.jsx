import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alumniApi } from '../../api/alumniApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PhotoUploader } from '../../components/common/PhotoUploader';
import { StatusBadge } from '../../components/common/StatusBadge';
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
  ArrowRight,
  RotateCcw,
  Clock,
  XCircle,
  Save
} from 'lucide-react';
import { validateDeptCodeMatch } from '../../utils/departmentValidation';

export const CreateProfilePage = () => {
  const [departments, setDepartments] = useState([]);
  const [existingProfile, setExistingProfile] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      try {
        // Fetch departments
        const deptRes = await alumniApi.getDepartments();
        if (deptRes.data) {
          setDepartments(deptRes.data);
          if (deptRes.data.length > 0) {
            setFormData((prev) => ({ ...prev, departmentId: deptRes.data[0].id }));
          }
        }

        // Check if user already has an existing profile
        try {
          const profileRes = await alumniApi.getMyProfile();
          if (profileRes.data) {
            const p = profileRes.data;
            setExistingProfile(p);

            // Prepopulate form data
            setFormData({
              departmentId: p.department?.id || (deptRes.data && deptRes.data[0]?.id) || '',
              rollNumber: p.rollNumber || '',
              registerNumber: p.registerNumber || '',
              degree: p.degree || 'B.Tech',
              batchStartYear: p.batchStartYear || 2020,
              batchEndYear: p.batchEndYear || 2024,
              profilePhotoUrl: p.profilePhotoUrl || '',
              dateOfBirth: p.dateOfBirth || '',
              bloodGroup: p.bloodGroup || '',
              personalEmail: p.personalEmail || '',
              phoneNumber: p.phoneNumber || '',
              permanentAddress: p.permanentAddress || '',
              city: p.city || '',
              state: p.state || '',
              country: p.country || 'India',
              postalCode: p.postalCode || '',
              currentCompany: p.currentCompany || '',
              currentDesignation: p.currentDesignation || '',
              industry: p.industry || 'Technology',
              linkedinUrl: p.linkedinUrl || '',
              isDirectoryVisible: p.isDirectoryVisible ?? true,
            });

            // If already verified, direct them to profile page with change request
            if (p.verificationStatus === 'VERIFIED') {
              navigate('/alumni/profile');
              return;
            }
          }
        } catch (profileErr) {
          // No profile yet, fresh creation mode
        }
      } catch (err) {
        setError('Failed to load initial data. Please check server connection.');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const selectedDept = departments.find((d) => String(d.id) === String(formData.departmentId));
  const deptValidation = validateDeptCodeMatch(
    selectedDept?.code,
    formData.registerNumber,
    formData.rollNumber
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!deptValidation.valid) {
      setError(deptValidation.regMismatch || deptValidation.rollMismatch || 'Academic department code mismatch.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        departmentId: parseInt(formData.departmentId, 10),
        batchStartYear: parseInt(formData.batchStartYear, 10),
        batchEndYear: parseInt(formData.batchEndYear, 10),
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : null,
      };

      let response;
      if (existingProfile) {
        response = await alumniApi.updateMyProfile(payload);
      } else {
        response = await alumniApi.createProfile(payload);
      }

      if (response.success) {
        setSuccessMessage('Profile submitted successfully for administrative review!');
        setTimeout(() => {
          navigate('/alumni/dashboard');
        }, 1200);
      } else {
        setError(response.message || 'Failed to submit profile');
      }
    } catch (err) {
      setError(err.message || 'Error submitting profile details');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return <LoadingSpinner size="lg" text="Loading registration profile..." />;
  }

  const isRejected = existingProfile?.verificationStatus === 'REJECTED';
  const isPending = existingProfile?.verificationStatus === 'PENDING';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-bit-50 text-bit-700 flex items-center justify-center font-bold">
            {isRejected ? <RotateCcw className="w-6 h-6 text-rose-600" /> : <GraduationCap className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isRejected
                  ? 'Update & Resubmit Alumni Profile'
                  : isPending
                  ? 'Edit Pending Alumni Profile'
                  : 'Alumni Profile Registration'}
              </h1>
              {existingProfile && <StatusBadge status={existingProfile.verificationStatus} />}
            </div>
            <p className="text-xs text-slate-500">
              {isRejected
                ? 'Address administrative feedback, update your details, and resubmit for official verification'
                : 'Submit your official institutional and contact details for administrative identity verification'}
            </p>
          </div>
        </div>
      </div>

      {/* Rejection Alert Banner */}
      {isRejected && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-start space-x-3">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900">
                Action Required: Profile Rejected by Administrator
              </h3>
              <p className="text-xs text-rose-800">
                <strong>Reason for Rejection:</strong> {existingProfile.rejectionReason || 'Details incomplete or inaccurate.'}
              </p>
              <p className="text-[11px] text-rose-700">
                Please update your missing or incorrect details (such as Permanent Address, Contact Number, or Academic records) below and click <strong>"Resubmit Profile for Verification"</strong> to send your corrected application to the admin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
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
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none uppercase font-mono transition-colors ${
                  deptValidation.rollMismatch
                    ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-400/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 bg-white'
                }`}
              />
              {deptValidation.rollMismatch && (
                <p className="text-[11px] text-rose-600 flex items-start space-x-1 font-medium leading-tight">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{deptValidation.rollMismatch}</span>
                </p>
              )}
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
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none uppercase font-mono transition-colors ${
                  deptValidation.regMismatch
                    ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-400/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 bg-white'
                }`}
              />
              {deptValidation.regMismatch && (
                <p className="text-[11px] text-rose-600 flex items-start space-x-1 font-medium leading-tight">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{deptValidation.regMismatch}</span>
                </p>
              )}
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
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                required
                placeholder="+91 98765 43210"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Personal Email *
              </label>
              <input
                type="email"
                name="personalEmail"
                required
                placeholder="personal@gmail.com"
                value={formData.personalEmail}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <PhotoUploader
                photoUrl={formData.profilePhotoUrl}
                onPhotoChange={(url) => setFormData((prev) => ({ ...prev, profilePhotoUrl: url }))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Permanent Residential Address *
              </label>
              <textarea
                name="permanentAddress"
                rows="2"
                required
                placeholder="Full residential door number, street, locality as on official records"
                value={formData.permanentAddress}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                City / Town *
              </label>
              <input
                type="text"
                name="city"
                required
                placeholder="e.g. Coimbatore, Sathyamangalam"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                State *
              </label>
              <input
                type="text"
                name="state"
                required
                placeholder="e.g. Tamil Nadu, Karnataka"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Postal PIN Code *
              </label>
              <input
                type="text"
                name="postalCode"
                required
                placeholder="e.g. 638401"
                value={formData.postalCode}
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
                Display my profile in the searchable BIT Alumni Directory (Personal address & phone will remain hidden)
              </span>
            </label>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className={`px-8 py-3.5 rounded-xl text-white font-bold shadow-lg transition flex items-center space-x-2 disabled:opacity-50 ${
              isRejected
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-bit-700 hover:bg-bit-800 shadow-bit-700/20'
            }`}
          >
            {isRejected ? (
              <>
                <RotateCcw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                <span>{submitting ? 'Resubmitting Profile...' : 'Resubmit Corrected Profile for Verification'}</span>
              </>
            ) : (
              <>
                <span>{submitting ? 'Submitting for Verification...' : 'Submit Profile for Verification'}</span>
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProfilePage;
