import React, { useState } from 'react';
import {
  GraduationCap,
  RotateCw,
  QrCode,
  CheckCircle2,
  Calendar,
  Award,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const DigitalIdCard = ({ cardData, onRegenerateQr, regenerating = false }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!cardData) return null;

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* 3D Card Container */}
      <div className="w-full max-w-[420px] h-[260px] sm:h-[270px] perspective-1000 cursor-pointer select-none">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full h-full duration-500 transform-style-preserve-3d transition-transform rounded-3xl shadow-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* ========================================================================= */}
          {/* FRONT FACE                                                                */}
          {/* ========================================================================= */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-bit-950 to-slate-900 text-white border border-bit-500/40 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Holographic Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-bit-400/10 pointer-events-none" />

            {/* Header: Institution Branding */}
            <div className="relative z-10 flex justify-between items-start border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-bit-600 to-bit-400 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                  BIT
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-100 leading-tight">
                    Bannari Amman Institute of Technology
                  </h4>
                  <p className="text-[9px] font-bold text-bit-300 uppercase tracking-widest">
                    Official Virtual Alumni ID
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                VERIFIED
              </span>
            </div>

            {/* Body: Photo, Info, and Live QR Code */}
            <div className="relative z-10 flex items-center justify-between gap-4 py-2">
              {/* Left Column: Alumnus Details */}
              <div className="flex items-center space-x-3.5 min-w-0">
                {cardData.profilePhotoUrl ? (
                  <img
                    src={cardData.profilePhotoUrl}
                    alt={cardData.fullName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-bit-400/50 shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-bit-700 to-bit-500 text-white font-extrabold text-2xl flex items-center justify-center border-2 border-bit-400/50 shadow-md flex-shrink-0">
                    {cardData.fullName?.charAt(0) || 'A'}
                  </div>
                )}

                <div className="space-y-0.5 min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-white truncate tracking-tight">
                    {cardData.fullName}
                  </h3>
                  <p className="text-[11px] font-semibold text-bit-300 truncate">
                    {cardData.degree} • {cardData.departmentCode}
                  </p>
                  <p className="text-[10px] font-mono text-slate-300 font-bold tracking-wider">
                    {cardData.alumniIdCardNumber}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Class of {cardData.batchEndYear}
                  </p>
                </div>
              </div>

              {/* Right Column: Base64 Rendered QR Code */}
              <div className="flex-shrink-0 flex flex-col items-center bg-white p-1.5 rounded-xl border border-white/20 shadow-inner">
                {cardData.qrCodeBase64 ? (
                  <img
                    src={cardData.qrCodeBase64}
                    alt="Verification QR"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                  />
                ) : (
                  <QrCode className="w-16 h-16 text-slate-800" />
                )}
                <span className="text-[7px] font-extrabold text-slate-700 uppercase tracking-tighter mt-0.5">
                  Scan to Verify
                </span>
              </div>
            </div>

            {/* Footer: Flip Instruction */}
            <div className="relative z-10 flex justify-between items-center border-t border-white/10 pt-2 text-[9px] text-slate-400 font-medium">
              <span>Lifetime Alumni Membership</span>
              <span className="text-bit-300 font-bold flex items-center space-x-1">
                <RotateCw className="w-2.5 h-2.5" />
                <span>Click to Flip Card</span>
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BACK FACE                                                                 */}
          {/* ========================================================================= */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-5 sm:p-6 bg-gradient-to-bl from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-700 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Magnetic Stripe Bar */}
            <div className="absolute top-4 left-0 right-0 h-8 bg-slate-950/90 border-y border-white/10" />

            {/* Back Details Content */}
            <div className="relative z-10 pt-10 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-400 block font-semibold">Roll No:</span>
                  <span className="font-mono font-bold text-slate-200">{cardData.rollNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Register No:</span>
                  <span className="font-mono font-bold text-slate-200">{cardData.registerNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Blood Group:</span>
                  <span className="font-bold text-slate-200">{cardData.bloodGroup || 'O+'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Date of Birth:</span>
                  <span className="font-bold text-slate-200">{cardData.dateOfBirth || 'On File'}</span>
                </div>
              </div>

              <div className="text-[10px] pt-1">
                <span className="text-slate-400 block font-semibold">Contact & Address:</span>
                <span className="text-slate-300 block truncate">
                  {cardData.permanentAddress || `${cardData.city || ''}, ${cardData.country || 'India'}`}
                </span>
              </div>
            </div>

            {/* Authorized Signature Line */}
            <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-2">
              <div className="text-[8px] text-slate-400 leading-tight max-w-[200px]">
                Property of Bannari Amman Institute of Technology Alumni Association.
              </div>
              <div className="text-right">
                <p className="font-serif italic text-xs text-slate-300 leading-none">Secretary, BIT AA</p>
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm transition"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Flip Card ({isFlipped ? 'Show Front' : 'Show Back'})</span>
        </button>

        {onRegenerateQr && (
          <button
            onClick={onRegenerateQr}
            disabled={regenerating}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{regenerating ? 'Rotating QR Token...' : 'Regenerate QR Code'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
