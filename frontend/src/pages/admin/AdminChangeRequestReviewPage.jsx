import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { profileChangeApi } from '../../api/profileChangeApi';
import { DigitalIdCard } from '../../components/idcard/DigitalIdCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  CreditCard,
  AlertCircle,
  Eye,
  Send,
  X,
  Layers,
  Sparkles,
  RotateCw
} from 'lucide-react';

export const AdminChangeRequestReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectError, setRejectError] = useState('');

  // ID preview mode (Proposed vs Current)
  const [previewMode, setPreviewMode] = useState('PROPOSED'); // 'PROPOSED' | 'CURRENT'
  const [isFlipped, setIsFlipped] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await profileChangeApi.getAdminChangeRequestDetail(id);
      if (res.data) {
        setDetail(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load change request review details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to approve this profile change request? This will immediately apply the changes to the official profile and regenerate the active QR verification token.'
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await profileChangeApi.approveChangeRequest(id);
      if (res.success) {
        setSuccessMessage('Profile change request approved successfully. Official profile and Digital ID updated.');
        fetchDetail();
      }
    } catch (err) {
      alert('Approval failed: ' + (err.message || 'Server error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectComment.trim()) {
      setRejectError('Please provide a specific rejection comment or guidance for the alumnus.');
      return;
    }

    setActionLoading(true);
    setRejectError('');
    try {
      const res = await profileChangeApi.rejectChangeRequest(id, { comment: rejectComment.trim() });
      if (res.success) {
        setShowRejectModal(false);
        setSuccessMessage('Change request has been rejected with feedback sent to the alumnus.');
        fetchDetail();
      }
    } catch (err) {
      setRejectError(err.message || 'Failed to reject change request.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Rendering change comparison & 3D ID preview..." />;
  }

  if (error || !detail) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Change Request Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'The requested change record could not be located.'}</p>
        <Link
          to="/admin/change-requests"
          className="inline-block px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
        >
          Return to Request List
        </Link>
      </div>
    );
  }

  const { request, alumni, currentProfile, requestedChanges, changedFields, currentVirtualId, proposedVirtualIdPreview } = detail;
  const isPending = request.status === 'PENDING';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation & Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <Link
            to="/admin/change-requests"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Review Profile Change Request
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  request.status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : request.status === 'REJECTED'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                }`}
              >
                {request.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Alumnus: <strong>{alumni.fullName}</strong> • Reg No: <strong>{alumni.registerNumber}</strong> • Dept: <strong>{alumni.departmentName}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons for Pending Request */}
        {isPending ? (
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition flex-1 sm:flex-none disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Request</span>
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="inline-flex items-center justify-center space-x-1.5 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition flex-1 sm:flex-none disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Update ID</span>
            </button>
          </div>
        ) : (
          <div className="text-right text-xs text-slate-500">
            <span>Reviewed on {new Date(request.reviewedAt || request.updatedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Review Feedback if Rejected */}
      {request.status === 'REJECTED' && request.adminComment && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
          <span className="font-bold text-xs block text-rose-800">Rejection Feedback Sent to Alumnus:</span>
          <p className="text-xs italic bg-white/80 p-3 rounded-xl border border-rose-200 font-medium">
            "{request.adminComment}"
          </p>
        </div>
      )}

      {/* Main Grid: Comparison & 3D Proposed Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side (7 cols): Field-by-field side-by-side comparison */}
        <div className="lg:col-span-7 space-y-6">
          {/* Photo Comparison Card if photo was changed */}
          {requestedChanges.profilePhotoUrl && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-bit-700" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  Passport Photograph Comparison
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                    Current Official Photo
                  </span>
                  <div className="w-24 h-32 mx-auto rounded-xl bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                    {currentProfile.profilePhotoUrl ? (
                      <img
                        src={currentProfile.profilePhotoUrl}
                        alt="Current Official"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 font-bold">No Photo</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-2">
                  <span className="text-[11px] font-extrabold text-amber-900 block uppercase tracking-wider">
                    Requested New Photo ★
                  </span>
                  <div className="w-24 h-32 mx-auto rounded-xl bg-white border-2 border-amber-400 shadow-md overflow-hidden flex items-center justify-center">
                    <img
                      src={requestedChanges.profilePhotoUrl}
                      alt="Requested New"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Changes Comparison Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-bit-700" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  Modified Profile Attributes ({changedFields.length} changed)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Differences Highlighted
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {changedFields.map((field) => {
                const currentVal = currentProfile[field] ?? '—';
                const requestedVal = requestedChanges[field] ?? '—';

                // Skip long photo url display in table since it's displayed above
                if (field === 'profilePhotoUrl') return null;

                return (
                  <div key={field} className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="font-extrabold text-slate-700 capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </div>

                    <div className="text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 break-words">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                        Current Value
                      </span>
                      <span>{String(currentVal)}</span>
                    </div>

                    <div className="text-emerald-950 font-bold bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 break-words">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-700 block mb-0.5">
                        Requested Value
                      </span>
                      <span>{String(requestedVal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side (5 cols): Proposed Digital ID Card Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-bit-700" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  Digital Alumni ID Preview
                </h3>
              </div>

              <div className="inline-flex p-0.5 rounded-xl bg-slate-100 text-[11px] font-bold">
                <button
                  onClick={() => setPreviewMode('PROPOSED')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    previewMode === 'PROPOSED'
                      ? 'bg-bit-700 text-white shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Proposed ID
                </button>
                <button
                  onClick={() => setPreviewMode('CURRENT')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    previewMode === 'CURRENT'
                      ? 'bg-slate-800 text-white shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Current ID
                </button>
              </div>
            </div>

            <div className="text-center">
              <span
                className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 ${
                  previewMode === 'PROPOSED'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {previewMode === 'PROPOSED'
                  ? '✨ Proposed Live Preview (If Approved)'
                  : 'Official Issued Active ID'}
              </span>
            </div>

            {/* Render DigitalIdCard */}
            <div className="bg-gradient-to-b from-slate-100 to-slate-200/70 p-4 sm:p-6 rounded-2xl flex justify-center shadow-inner">
              <DigitalIdCard
                cardData={
                  previewMode === 'PROPOSED'
                    ? proposedVirtualIdPreview
                    : currentVirtualId || proposedVirtualIdPreview
                }
                isFlipped={isFlipped}
                onFlipChange={setIsFlipped}
              />
            </div>

            <p className="text-[11px] text-slate-500 text-center font-medium">
              💡 Click the ID card to flip between front identity and back credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Reject Modal with Mandatory Feedback */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Profile Change Request</h3>
                  <p className="text-xs text-slate-500">Provide specific feedback for the alumnus</p>
                </div>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rejectError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{rejectError}</span>
              </div>
            )}

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rejection Reason / Guidance *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="e.g. Please upload a clear passport-size photograph with plain white background..."
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
                <span className="text-[11px] text-slate-400 block">
                  This explanation will be shown directly to the alumnus so they can modify and resubmit their request.
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
