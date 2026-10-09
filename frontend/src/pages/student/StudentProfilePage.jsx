import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { alumniApi } from '../../api/alumniApi';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PhotoUploader } from '../../components/common/PhotoUploader';
import {
  User, BookOpen, Building, Calendar, CheckCircle2, AlertCircle,
  Edit3, Save, X, GraduationCap, Clock, XCircle, RotateCw,
  CreditCard, Phone, MapPin, Heart, Mail, Shield, Info
} from 'lucide-react';

const STUDENT_TYPE_OPTIONS = [
  { value: '', label: '-- Select Student Type --' },
  { value: 'DAY_SCHOLAR', label: 'Day Scholar (Red card)' },
  { value: 'HOSTELER',    label: 'Hosteler (Blue card)' },
];

const DEGREE_OPTIONS = ['B.Tech', 'M.Tech', 'MBA', 'MCA', 'B.Sc', 'M.Sc', 'B.E'];

// Batch year helpers — always computed from current date, never hardcoded
const currentYear = new Date().getFullYear();
const ALLOWED_START_YEARS = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
const getEndYear = (startYear) => parseInt(startYear) + 4;

// DOB constraint: latest selectable DOB is today − 14 years (student must be at least 14)
const maxDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 14);
  return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
})();

export const StudentProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const emptyForm = {
    departmentId: '', registerNumber: '', degree: 'B.Tech',
    batchStartYear: currentYear,
    // batchEndYear is computed as batchStartYear + 4; NOT editable by student
    studentType: '', bloodGroup: '', dateOfBirth: '',
    address: '', studentPhone: '', parentPhone: '',
    officialEmail: '', profilePhotoUrl: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    alumniApi.getDepartments().then(r => setDepartments(r.data || [])).catch(() => {});
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await studentApi.getMyProfile();
      const p = res.data;
      setProfile(p);
      setForm({
        departmentId: p.departmentId || '',
        registerNumber: p.registerNumber || '',
        degree: p.degree || 'B.Tech',
        batchStartYear: p.batchStartYear || new Date().getFullYear() - 1,
        batchEndYear: p.batchEndYear || new Date().getFullYear() + 3,
        studentType: p.studentType || '',
        bloodGroup: p.bloodGroup || '',
        dateOfBirth: p.dateOfBirth || '',
        address: p.address || '',
        studentPhone: p.studentPhone || '',
        parentPhone: p.parentPhone || '',
        officialEmail: p.officialEmail || '',
        profilePhotoUrl: p.profilePhotoUrl || '',
      });
    } catch (err) {
      const status = err.status || err.response?.status;
      if (status === 404 || status === 400) setProfile(null);
      else setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => {
      const updated = { ...f, [name]: value };
      // Auto-compute batchEndYear whenever batchStartYear changes
      if (name === 'batchStartYear') {
        updated.batchEndYear = getEndYear(value);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const payload = {
        departmentId: parseInt(form.departmentId),
        registerNumber: form.registerNumber.trim().toUpperCase(),
        degree: form.degree.trim(),
        batchStartYear: parseInt(form.batchStartYear),
        batchEndYear: parseInt(form.batchEndYear),
        studentType: form.studentType || null,
        bloodGroup: form.bloodGroup || null,
        dateOfBirth: form.dateOfBirth || null,
        address: form.address || null,
        studentPhone: form.studentPhone || null,
        parentPhone: form.parentPhone || null,
        officialEmail: form.officialEmail || null,
        profilePhotoUrl: form.profilePhotoUrl || null,
      };

      let res;
      if (profile) res = await studentApi.updateMyProfile(payload);
      else res = await studentApi.createProfile(payload);

      setProfile(res.data);
      setEditing(false); setCreating(false);
      const wasRejected = profile?.registrationStatus === 'REJECTED';
      setSuccess(
        profile
          ? wasRejected
            ? 'Registration resubmitted! Status reset to Pending — awaiting admin review.'
            : 'Profile updated successfully.'
          : 'Student registration submitted! Your profile is now pending admin review.'
      );
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" text="Loading profile..." /></div>;

  const isApproved = profile?.registrationStatus === 'APPROVED';
  const isRejected = profile?.registrationStatus === 'REJECTED';
  const isPending  = profile?.registrationStatus === 'PENDING';
  const showForm   = editing || creating || !profile;
  const isReadOnly = isApproved;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Student Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Your institutional academic identity for BIT Connect</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{success}</span>
        </div>
      )}

      {/* REJECTION BANNER — student sees reason and is prompted to correct */}
      {isRejected && !editing && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-700">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-bold text-sm">Registration Requires Correction</h3>
          </div>
          <p className="text-sm text-rose-700 leading-relaxed">
            <span className="font-semibold">Admin feedback: </span>{profile.rejectionReason}
          </p>
          <button
            id="fix-registration-btn"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Correct & Resubmit
          </button>
        </div>
      )}

      {/* PENDING BANNER */}
      {isPending && !editing && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-amber-800">Registration Pending Admin Review</h3>
            <p className="text-xs text-amber-700 mt-1">
              Your registration has been submitted and is awaiting administrator approval.
              You will be notified once a decision is made. You can update your information below while it is pending.
            </p>
          </div>
        </div>
      )}

      {/* APPROVED BANNER */}
      {isApproved && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-sm text-emerald-800">Registration Approved</h3>
            <p className="text-xs text-emerald-700 mt-1">
              Your institutional identity has been verified. Your Digital Student ID is available.
            </p>
          </div>
          <Link to="/student/digital-id"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition">
            <CreditCard className="w-3.5 h-3.5" />View ID
          </Link>
        </div>
      )}

      {/* No profile yet */}
      {!profile && !creating && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-bit-50 border border-bit-100 items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-bit-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Register your student identity</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
            Submit your institutional details for admin verification to receive your Digital Student ID.
          </p>
          <button id="create-student-profile-btn" onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white text-sm font-bold shadow transition">
            <User className="w-4 h-4" />Register Now
          </button>
        </div>
      )}

      {/* Profile view (read mode) */}
      {profile && !showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Photo header */}
          <div className={`relative h-28 flex items-end px-8 pb-0 ${isApproved ? 'bg-gradient-to-br from-emerald-700 to-emerald-900' : isPending ? 'bg-gradient-to-br from-amber-700 to-amber-900' : 'bg-gradient-to-br from-rose-700 to-rose-900'}`}>
            <div className="absolute bottom-0 translate-y-1/2">
              {profile.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt={profile.fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                  <User className="w-9 h-9 text-slate-400" />
                </div>
              )}
            </div>
          </div>

          <div className="px-8 pt-14 pb-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{profile.fullName}</h2>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <div className="mt-2"><StatusBadge status={profile.registrationStatus} /></div>
              </div>
              {!isApproved && (
                <button id="edit-student-profile-btn" onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bit-50 hover:bg-bit-100 border border-bit-200 text-bit-700 text-xs font-bold transition">
                  <Edit3 className="w-3.5 h-3.5" />{isRejected ? 'Correct & Resubmit' : 'Edit'}
                </button>
              )}
            </div>

            {/* Academic fields */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Register Number', value: profile.registerNumber, icon: BookOpen },
                { label: 'Degree', value: profile.degree, icon: GraduationCap },
                { label: 'Department', value: `${profile.departmentName} (${profile.departmentCode})`, icon: Building },
                { label: 'Batch', value: `${profile.batchStartYear} – ${profile.batchEndYear}`, icon: Calendar },
                { label: 'Student Type', value: profile.studentType === 'DAY_SCHOLAR' ? 'Day Scholar' : profile.studentType === 'HOSTELER' ? 'Hosteler' : '—', icon: User },
                { label: 'Blood Group', value: profile.bloodGroup || '—', icon: Heart },
                { label: 'Date of Birth', value: profile.dateOfBirth || '—', icon: Calendar },
                { label: 'Student Phone', value: profile.studentPhone || '—', icon: Phone },
                { label: 'Parent Phone', value: profile.parentPhone || '—', icon: Phone },
                { label: 'Official Email', value: profile.officialEmail || '—', icon: Mail },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Icon className="w-3 h-3" />{label}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 break-words">{value}</span>
                </div>
              ))}
              <div className="col-span-2 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />Address
                </span>
                <span className="text-sm font-semibold text-slate-800">{profile.address || '—'}</span>
              </div>
            </div>

            {isApproved && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
                <Shield className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600">
                  Your registration is <strong>approved</strong>. Official institutional fields are now locked.
                  To request a correction, contact the administrator.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form (create / edit) */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {creating ? 'Student Registration' : isRejected ? 'Correct & Resubmit Registration' : 'Edit Registration'}
              </h2>
              {isRejected && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Saving these changes will resubmit your registration for admin review.
                </p>
              )}
            </div>
            {!creating && (
              <button type="button" onClick={() => { setEditing(false); setCreating(false); setError(''); }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Photo */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />Photo
            </h3>
            <PhotoUploader
              currentPhotoUrl={form.profilePhotoUrl}
              onUpload={(url) => setForm(f => ({ ...f, profilePhotoUrl: url }))}
              name={user?.fullName}
            />
          </section>

          {/* Academic identity */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />Academic Identity
              {isReadOnly && <span className="ml-2 text-amber-600 text-[10px] font-bold uppercase bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Locked after approval</span>}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Register Number <span className="text-rose-500">*</span></label>
              <input name="registerNumber" value={form.registerNumber} onChange={handleChange} required disabled={!!profile}
                placeholder="e.g. 7376232IT286"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-bit-300 disabled:bg-slate-50 disabled:text-slate-500" />
              {!!profile && <p className="text-[10px] text-slate-400 mt-1">Register number cannot be changed after submission.</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Department <span className="text-rose-500">*</span></label>
                <select name="departmentId" value={form.departmentId} onChange={handleChange} required disabled={isReadOnly}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300 disabled:bg-slate-50">
                  <option value="">Select...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.code} – {d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Degree <span className="text-rose-500">*</span></label>
                <select name="degree" value={form.degree} onChange={handleChange} required disabled={isReadOnly}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300 disabled:bg-slate-50">
                  {DEGREE_OPTIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Batch year — dropdown for start year, end year auto-calculated */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Batch Start Year <span className="text-rose-500">*</span></label>
                <select name="batchStartYear" value={form.batchStartYear}
                  onChange={handleChange} required disabled={isReadOnly}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300 disabled:bg-slate-50">
                  {ALLOWED_START_YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Batch End Year</label>
                <div className="w-full px-3.5 py-2.5 border border-slate-100 rounded-xl text-sm bg-slate-50 text-slate-700 font-semibold">
                  {getEndYear(form.batchStartYear)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Automatically = Start Year + 4</p>
              </div>
            </div>


            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Student Type</label>
              <select name="studentType" value={form.studentType} onChange={handleChange} disabled={isReadOnly}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300 disabled:bg-slate-50">
                {STUDENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </section>

          {/* Physical ID card fields */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />ID Card Details (Back Face)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Blood Group</label>
                <input name="bloodGroup" value={form.bloodGroup} onChange={handleChange} disabled={isReadOnly}
                  placeholder="e.g. O+ve" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300 disabled:bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange}
                  disabled={isReadOnly}
                  max={maxDob}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300 disabled:bg-slate-50" />
                <p className="text-[10px] text-slate-400 mt-1">
                  Must be on or before {maxDob} (student must be ≥ 14 years old)
                </p>
              </div>
            </div>


            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Student Phone</label>
                <input name="studentPhone" value={form.studentPhone} onChange={handleChange} disabled={isReadOnly}
                  placeholder="+91 XXXXXXXXXX" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300 disabled:bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Parent / Guardian Phone</label>
                <input name="parentPhone" value={form.parentPhone} onChange={handleChange} disabled={isReadOnly}
                  placeholder="+91 XXXXXXXXXX" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300 disabled:bg-slate-50" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Official Institutional Email</label>
              <input type="email" name="officialEmail" value={form.officialEmail} onChange={handleChange} disabled={isReadOnly}
                placeholder="yourname.dept23@bitsathy.ac.in"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300 disabled:bg-slate-50" />
              <p className="text-[10px] text-slate-400 mt-1">This is the institutional email printed on your physical ID card (not your login email).</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Home Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows={3} disabled={isReadOnly}
                placeholder="Full postal address as on physical ID"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bit-300 resize-none disabled:bg-slate-50" />
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button type="submit" id="save-student-profile-btn" disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bit-700 hover:bg-bit-800 disabled:opacity-60 text-white text-sm font-bold shadow transition">
              {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
              {creating
                ? 'Submit Registration'
                : isRejected
                  ? 'Correct & Resubmit'
                  : 'Save Changes'}
            </button>
            {!creating && (
              <button type="button" onClick={() => { setEditing(false); setCreating(false); setError(''); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition">
                <X className="w-4 h-4" />Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};