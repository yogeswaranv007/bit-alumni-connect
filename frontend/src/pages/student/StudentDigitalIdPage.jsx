import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DigitalStudentIdCard } from '../../components/idcard/DigitalStudentIdCard';
import {
  CreditCard, RotateCw, QrCode, AlertCircle, CheckCircle2,
  ArrowLeft, ShieldCheck, Clock
} from 'lucide-react';

export const StudentDigitalIdPage = () => {
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [rotating, setRotating] = useState(false);
  const [success, setSuccess]   = useState('');

  const fetchId = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await studentApi.getMyDigitalId();
      setCardData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (err.response?.status === 400 && msg.includes('approved')) {
        setError('pending');
      } else if (err.response?.status === 404) {
        setError('not_issued');
      } else {
        setError(msg || 'Failed to load Digital Student ID');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchId(); }, [fetchId]);

  const handleRotateQr = async () => {
    setRotating(true); setSuccess(''); setError('');
    try {
      const res = await studentApi.regenerateQrToken();
      setCardData(res.data);
      setSuccess('QR code refreshed successfully');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refresh QR code');
    } finally {
      setRotating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Loading Digital Student ID..." />
      </div>
    );
  }

  if (error === 'pending') {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-16">
        <div className="inline-flex w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 items-center justify-center">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Registration Pending Approval</h1>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Your Digital Student ID will be issued automatically once an administrator approves your registration.
        </p>
        <Link to="/student/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition">
          <ArrowLeft className="w-4 h-4" />Back to Dashboard
        </Link>
      </div>
    );
  }

  if (error === 'not_issued' || (!cardData && error)) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-16">
        <div className="inline-flex w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 items-center justify-center">
          <CreditCard className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Digital ID Not Yet Issued</h1>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          {typeof error === 'string' && error !== 'not_issued' ? error : 'Please contact the administrator.'}
        </p>
        <Link to="/student/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition">
          <ArrowLeft className="w-4 h-4" />Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Digital Student ID</h1>
          <p className="text-sm text-slate-500 mt-1">
            BIT Connect official student identity card
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button id="refresh-student-qr-btn" onClick={handleRotateQr} disabled={rotating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition disabled:opacity-60">
            {rotating ? <LoadingSpinner size="sm" /> : <RotateCw className="w-3.5 h-3.5" />}
            Refresh QR
          </button>
        </div>
      </div>

      {/* Success/error alerts */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}
        </div>
      )}
      {error && error !== 'pending' && error !== 'not_issued' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* The card */}
      {cardData && (
        <DigitalStudentIdCard cardData={cardData} />
      )}

      {/* Card info */}
      {cardData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-bit-600" />Card Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Card Number</span>
              <span className="font-mono font-bold text-slate-800">{cardData.studentIdCardNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Issued Date</span>
              <span className="font-semibold text-slate-800">{cardData.issuedDate}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Valid Until</span>
              <span className="font-semibold text-slate-800">{cardData.expiryDate}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Student Type</span>
              <span className="font-semibold text-slate-800">
                {cardData.studentType === 'DAY_SCHOLAR' ? '🔴 Day Scholar' : '🔵 Hosteler'}
              </span>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-start gap-2 text-xs text-slate-600">
            <QrCode className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              The QR code on this card links to a public verification page.
              You can refresh the QR code at any time — your card number remains the same.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};