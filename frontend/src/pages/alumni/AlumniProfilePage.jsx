import React, { useEffect, useState } from 'react';
import { alumniApi } from '../../api/alumniApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  User,
  Building,
  Briefcase,
  MapPin,
  Lock,
  Check,
  AlertCircle,
  Linkedin,
  Mail,
  Phone,
  Save
} from 'lucide-react';

export const AlumniProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    profilePhotoUrl: '',
    dateOfBirth: '',
    bloodGroup: '',
    personalEmail: '',
    phoneNumber: '',
    permanentAddress: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    currentCompany: '',
    currentDesignation: '',
    industry: '',
    linkedinUrl: '',
    isDirectoryVisible: true,
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await alumniApi.getMyProfile();
      if (res.data) {
        setProfile(res.data);
        setFormData({
          profilePhotoUrl: res.data.profilePhotoUrl || '',
          dateOfBirth: res.data.dateOfBirth || '',
          bloodGroup: res.data.bloodGroup || '',
          personalEmail: res.data.personalEmail || '',
          phoneNumber: res.data.phoneNumber || '',
          permanentAddress: res.data.permanentAddress || '',
          city: res.data.city || '',
          state: res.data.state || '',
          country: res.data.country || 'India',
          postalCode: res.data.postalCode || '',
          currentCompany: res.data.currentCompany || '',
          currentDesignation: res.data.currentDesignation || '',
          industry: res.data.industry || '',
          linkedinUrl: res.data.linkedinUrl || '',
          isDirectoryVisible: res.data.isDirectoryVisible ?? true,
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load profile. Please complete registration.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);

    try {
      const payload = {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : null,
      };

      const res = await alumniApi.updateMyProfile(payload);
      if (res.success) {
        setProfile(res.data);
        setMessage({
          type: 'success',
          text: res.data.verificationStatus === 'PENDING'
            ? 'Profile updated and re-submitted for verification review.'
            : 'Profile details updated successfully.',
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading your profile..." />;
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
        <h3 className="text-xl font-bold text-slate-800">No Alumni Profile Found</h3>
        <p className="text-xs text-slate-500">Please complete your alumni registration.</p>
        <a
          href="/alumni/create-profile"
          className="inline-block px-6 py-2.5 rounded-xl bg-bit-700 text-white font-bold text-xs"
        >
          Create Profile
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          {profile.profilePhotoUrl ? (
            <img
              src={profile.profilePhotoUrl}
              alt={profile.fullName}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-bit-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-sm">
              {profile.fullName?.charAt(0) || 'A'}
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">{profile.fullName}</h1>
            <p className="text-xs font-semibold text-slate-500">{profile.accountEmail}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <StatusBadge status={profile.verificationStatus} size="md" />
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Protected Academic Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
            <Building className="w-4 h-4 text-bit-700" />
            <span>Academic Identity (Institutional Record)</span>
          </h2>
          <span className="inline-flex items-center text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            <Lock className="w-3 h-3 mr-1" />
            Protected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-semibold block">Roll Number</span>
            <span className="font-bold text-slate-800 mt-0.5 block font-mono">{profile.rollNumber}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-semibold block">Register Number</span>
            <span className="font-bold text-slate-800 mt-0.5 block font-mono">{profile.registerNumber}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-semibold block">Degree & Dept</span>
            <span className="font-bold text-slate-800 mt-0.5 block truncate">
              {profile.degree} - {profile.department?.code}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-semibold block">Batch Duration</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {profile.batchStartYear} - {profile.batchEndYear}
            </span>
          </div>
        </div>
      </div>

      {/* Editable Details Form */}
      <form onSubmit={handleUpdate} className="space-y-8">
        {/* Personal Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-bit-700 flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Contact & Personal Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                placeholder="e.g. O+, B+"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600 uppercase"
              />
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

            <div className="space-y-1.5 sm:col-span-2">
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

            <div className="space-y-1.5 sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Permanent Address
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
          </div>
        </div>

        {/* Professional Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-bit-700 flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>Employment & Professional Domain</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Current Employer
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
                Designation
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
                Show my profile in the searchable BIT Alumni Directory (Privacy-Safe)
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-bit-700 hover:bg-bit-800 text-white text-sm font-bold shadow-md shadow-bit-700/20 transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Updates...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
