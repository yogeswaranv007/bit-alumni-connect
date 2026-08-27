import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { virtualIdApi } from '../../api/virtualIdApi';
import { DigitalIdCard } from '../../components/idcard/DigitalIdCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  CreditCard,
  ShieldCheck,
  QrCode,
  ExternalLink,
  Printer,
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Layers
} from 'lucide-react';

export const DigitalIdPage = () => {
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  const fetchCard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await virtualIdApi.getMyVirtualId();
      if (res.data) {
        setCardData(res.data);
      }
    } catch (err) {
      setError(
        err.message || 'Virtual Alumni ID is not available. Please ensure your profile is verified.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, []);

  const handleRegenerateQr = async () => {
    const confirmed = window.confirm(
      'Regenerating your QR code will immediately invalidate all existing screenshots and previous tokens. Do you want to proceed?'
    );
    if (!confirmed) return;

    setRegenerating(true);
    setNotification('');
    try {
      const res = await virtualIdApi.regenerateMyQr();
      if (res.success && res.data) {
        setCardData(res.data);
        setNotification('QR code token rotated successfully. Old screenshots/tokens are now revoked.');
      }
    } catch (err) {
      alert('Failed to regenerate QR code: ' + (err.message || 'Server error'));
    } finally {
      setRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Rendering your Official BIT Digital Alumni ID..." />;
  }

  if (error || !cardData) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <CreditCard className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Digital ID Not Yet Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {error || 'Your profile is currently under review by college administrators. Once approved, your official BIT Virtual Alumni ID and secure dynamic QR code will appear here automatically.'}
        </p>
        <Link
          to="/alumni/dashboard"
          className="inline-block px-6 py-2.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs shadow-md transition"
        >
          Check Status on Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#EB5323] flex items-center justify-center font-bold flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Official BIT Alumni ID Card
            </h1>
            <p className="text-xs text-slate-500">
              Interactive 3D digital identity badge inspired by the official Bannari Amman Institute of Technology Alumni Card
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs w-full sm:w-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Print Badge</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* 3D Flippable Card Stage */}
      <div className="bg-gradient-to-b from-slate-100 to-slate-200/70 rounded-3xl p-6 sm:p-12 border border-slate-200 flex flex-col items-center justify-center shadow-inner space-y-4">
        {/* Front / Back Side View Toggle Tabs */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 border border-slate-300 shadow-inner">
          <button
            onClick={() => setIsFlipped(false)}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition ${
              !isFlipped
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Front Side (Identity & Photo)
          </button>
          <button
            onClick={() => setIsFlipped(true)}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition ${
              isFlipped
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Back Side (Personal & Association)
          </button>
        </div>

        {/* 3D Card */}
        <DigitalIdCard
          cardData={cardData}
          onRegenerateQr={handleRegenerateQr}
          regenerating={regenerating}
          isFlipped={isFlipped}
          onFlipChange={setIsFlipped}
        />

        <p className="text-[11px] text-slate-500 font-medium text-center">
          💡 Click or tap the card anywhere to flip between Front and Back sides.
        </p>
      </div>

      {/* Security & Verification Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Link Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-bit-700">
              <QrCode className="w-4 h-4" />
              <span>Public Verification Endpoint</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When security staff or attendees scan the dynamic QR code on the card, they are directed to the secure BIT registry verification page confirming your verified alumnus status.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={`/verify/${cardData.activeToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-bit-700 hover:text-bit-800"
            >
              <span>Test Public Verification Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security Info Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-PII Dynamic Token Security</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your QR code does not embed unencrypted personal data. If you share a screenshot or lose a badge, click <strong>"Regenerate QR Code"</strong> to instantly invalidate old verification tokens while keeping your permanent Alumni ID intact.
          </p>
        </div>
      </div>
    </div>
  );
};
