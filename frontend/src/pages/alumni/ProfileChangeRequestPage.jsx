import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { alumniApi } from '../../api/alumniApi';
import { profileChangeApi } from '../../api/profileChangeApi';
import { PhotoUploader } from '../../components/common/PhotoUploader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ArrowLeft,
  FileEdit,
  Building,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Send,
  RotateCcw,
  Info
} from 'lucide-react';

export const ProfileChangeRequestPage = () => {
  const [searchParams] = useSearchParams();
  const editRequestId = searchParams.get('edit');

  const [currentProfile, setCurrentProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
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
    industry: '',
    linkedinUrl: '',
    departmentId: '',
    degree: '',
    batchStartYear: '',
    batchEndYear: '',
    rollNumber: '',
    registerNumber: '',
    isDirectoryVisible: true,
  });

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, deptsRes, requestsRes] = await Promise.all([
          alumniApi.getMyProfile(),
          alumniApi.getDepartments(),
          profileChangeApi.getMyChangeRequests(),
        ]);

        if (profileRes.data) {
          const p = profileRes.data;
          setCurrentProfile(p);

          // Check if there's an existing request
          const pendingReq = requestsRes.data?.find((r) => r.status === 'PENDING');
          const rejectedReq = editRequestId
            ? requestsRes.data?.find((r) => r.id === editRequestId)
            : requestsRes.data?.find((r) => r.status === 'REJECTED');

          if (pendingReq) {
            setExistingRequest(pendingReq);
          } else if (rejectedReq) {
            setExistingRequest(rejectedReq);
            // Pre-populate with previously requested changes
            try {
              const parsedChanges = JSON.parse(rejectedReq.requestedChanges || '{}');
              setFormData({
                fullName: parsedChanges.fullName || p.fullName || '',
                profilePhotoUrl: parsedChanges.profilePhotoUrl || p.profilePhotoUrl || '',
                dateOfBirth: parsedChanges.dateOfBirth || p.dateOfBirth || '',
                bloodGroup: parsedChanges.bloodGroup || p.bloodGroup || '',
                personalEmail: parsedChanges.personalEmail || p.personalEmail || '',
                phoneNumber: parsedChanges.phoneNumber || p.phoneNumber || '',
                permanentAddress: parsedChanges.permanentAddress || p.permanentAddress || '',
                city: parsedChanges.city || p.city || '',
                state: parsedChanges.state || p.state || '',
                country: parsedChanges.country || p.country || 'India',
                postalCode: parsedChanges.postalCode || p.postalCode || '',
                currentCompany: parsedChanges.currentCompany || p.currentCompany || '',
                currentDesignation: parsedChanges.currentDesignation || p.currentDesignation || '',
                industry: parsedChanges.industry || p.industry || '',
                linkedinUrl: parsedChanges.linkedinUrl || p.linkedinUrl || '',
                departmentId: parsedChanges.departmentId || p.department?.id || '',
                degree: parsedChanges.degree || p.degree || '',
                batchStartYear: parsedChanges.batchStartYear || p.batchStartYear || '',
                batchEndYear: parsedChanges.batchEndYear || p.batchEndYear || '',
                rollNumber: parsedChanges.rollNumber || p.rollNumber || '',
                registerNumber: parsedChanges.registerNumber || p.registerNumber || '',
                isDirectoryVisible: parsedChanges.isDirectoryVisible ?? p.isDirectoryVisible ?? true,
              });
            } catch (e) {
              console.warn('Failed to parse requested changes', e);
            }
          } else {
            // Populate with official profile values
            setFormData({
              fullName: p.fullName || '',
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
              industry: p.industry || '',
              linkedinUrl: p.linkedinUrl || '',
              departmentId: p.department?.id || '',
              degree: p.degree || '',
              batchStartYear: p.batchStartYear || '',
              batchEndYear: p.batchEndYear || '',
              rollNumber: p.rollNumber || '',
              registerNumber: p.registerNumber || '',
              isDirectoryVisible: p.isDirectoryVisible ?? true,
            });
          }
        }

        if (deptsRes.data) {
          setDepartments(deptsRes.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [editRequestId]);

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
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : null,
        batchStartYear: formData.batchStartYear ? parseInt(formData.batchStartYear, 10) : null,
        batchEndYear: formData.batchEndYear ? parseInt(formData.batchEndYear, 10) : null,
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : null,
      };

      if (existingRequest?.status === 'REJECTED') {
        // Update rejected request and resubmit
        await profileChangeApi.updateChangeRequest(existingRequest.id, payload);
        const resubmitRes = await profileChangeApi.resubmitChangeRequest(existingRequest.id);
        if (resubmitRes.success) {
          setSuccess('Profile change request updated and resubmitted for admin review.');
          setTimeout(() => navigate('/alumni/profile'), 1500);
        }
      } else {
        // Create new change request
        const res = await profileChangeApi.createChangeRequest(payload);
        if (res.success) {
          setSuccess('Profile change request submitted successfully for administrative review.');
          setTimeout(() => navigate('/alumni/profile'), 1500);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to submit profile change request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading change request portal..." />;
  }

  if (existingRequest?.status === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Info className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Change Request Already Under Review</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            You already have an active profile change request submitted on{' '}
            <strong>{new Date(existingRequest.createdAt).toLocaleDateString()}</strong> currently being reviewed by the Alumni Management Office.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/alumni/profile"
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs shadow-md transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Official Profile</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-bit-50 text-bit-700 flex items-center justify-center font-bold flex-shrink-0">
            <FileEdit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {existingRequest?.status === 'REJECTED'
                ? 'Update & Resubmit Profile Change Request'
                : 'Request Official Profile & ID Card Changes'}
            </h1>
            <p className="text-xs text-slate-500">
              Submit proposed modifications for administrative review. Your official Digital ID remains active until approved.
            </p>
          </div>
        </div>

        <Link
          to="/alumni/profile"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </Link>
      </div>

      {existingRequest?.status === 'REJECTED' && existingRequest.adminComment && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 animate-in fade-in">
          <div className="flex items-center space-x-2 text-xs font-bold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Previous Request Feedback from Alumni Management:</span>
          </div>
          <p className="text-xs bg-white/80 p-3 rounded-xl border border-rose-200/80 font-medium italic text-rose-950">
            "{existingRequest.adminComment}"
          </p>
          <p className="text-[11px] text-rose-700">
            Please make the requested adjustments below and click "Resubmit for Review".
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Passport Photo */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-bit-700 flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>1. Official Profile Photograph</span>
          </h2>
          <PhotoUploader
            photoUrl={formData.profilePhotoUrl}
            onPhotoChange={(url) => setFormData((prev) => ({ ...prev, profilePhotoUrl: url }))}
          />
        </div>

        {/* Section 2: Personal Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-bit-700 flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>2. Personal & Contact Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

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
              <input
                type="text"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mobile Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
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
                value={formData.personalEmail}
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
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Permanent Residential Address
              </label>
              <textarea
                name="permanentAddress"
                rows="2"
                value={formData.permanentAddress}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Postal Pincode
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Career & Employment Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-bit-700 flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>3. Career & Employment Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Current Employer / Company
              </label>
              <input
                type="text"
                name="currentCompany"
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
                value={formData.currentDesignation}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Industry Domain
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4">
          <Link
            to="/alumni/profile"
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs shadow-lg shadow-bit-700/20 hover:shadow-xl transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>
              {submitting
                ? 'Submitting Changes...'
                : existingRequest?.status === 'REJECTED'
                ? 'Update & Resubmit for Review'
                : 'Submit Change Request for Admin Review'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
