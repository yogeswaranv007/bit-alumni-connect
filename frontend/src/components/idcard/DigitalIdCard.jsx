import React, { useState } from 'react';
import {
  RotateCw,
  QrCode
} from 'lucide-react';
import { ALUMNI_ASSOCIATION_CONFIG } from '../../constants/alumniAssociation';

/**
 * Format raw date string (YYYY-MM-DD) into DD-MM-YYYY matching physical card
 */
const formatDateOfBirth = (dobString) => {
  if (!dobString) return '11-11-2005';
  try {
    const parts = dobString.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(dobString);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {
    // fallback
  }
  return dobString;
};

export const DigitalIdCard = ({
  cardData,
  onRegenerateQr,
  regenerating = false,
  isFlipped: controlledFlipped,
  onFlipChange,
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);

  if (!cardData) return null;

  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  const toggleFlip = () => {
    const nextVal = !isFlipped;
    if (onFlipChange) {
      onFlipChange(nextVal);
    } else {
      setInternalFlipped(nextVal);
    }
  };

  const batchText = `${cardData.batchStartYear || 2022} - ${cardData.batchEndYear || 2026}`;
  const degreeAndDept = `${cardData.degree ? cardData.degree + ' ' : ''}${
    cardData.departmentName ? cardData.departmentName.toUpperCase() : 'INFORMATION TECHNOLOGY'
  }`;

  const formattedDob = formatDateOfBirth(cardData.dateOfBirth);

  return (
    <div className="flex flex-col items-center space-y-6 select-none">
      {/* 3D Card Stage - Portrait CR80 Proportions (~340px x 540px) */}
      <div className="w-[320px] sm:w-[348px] h-[510px] sm:h-[548px] perspective-1000 cursor-pointer">
        <div
          onClick={toggleFlip}
          aria-label="Click to flip ID card"
          className={`relative w-full h-full duration-700 transform-style-preserve-3d transition-transform rounded-[24px] shadow-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* ========================================================================= */}
          {/* FRONT SIDE (Physical BIT Alumni ID Design)                                */}
          {/* ========================================================================= */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-[24px] bg-[#EB5323] text-slate-900 border-[1.5px] border-amber-600/30 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Right-side Deep Forest Green Vertical Batch Stripe */}
            <div className="absolute top-0 right-0 bottom-0 w-[42px] sm:w-[46px] bg-[#006A38] rounded-r-[23px] flex flex-col items-center justify-center z-10 shadow-inner">
              <span
                style={{ writingMode: 'vertical-rl' }}
                className="rotate-180 font-black text-white tracking-[0.25em] text-xs sm:text-sm font-sans"
              >
                {batchText}
              </span>
            </div>

            {/* Bottom Curved Green Wave */}
            <div className="absolute bottom-0 left-0 right-[42px] sm:right-[46px] h-20 overflow-hidden pointer-events-none z-0">
              <svg
                viewBox="0 0 300 80"
                preserveAspectRatio="none"
                className="w-full h-full"
                fill="none"
              >
                <path
                  d="M0 45 C70 15, 180 75, 300 30 L300 80 L0 80 Z"
                  fill="#006A38"
                />
              </svg>
            </div>

            {/* Front Card Main Body (Left of Green Stripe) */}
            <div className="relative z-10 flex-1 flex flex-col justify-between pr-[44px] sm:pr-[48px] pt-3 pb-2.5 pl-3.5">
              {/* 1. Header: Official BIT Logo Image Asset */}
              <div className="flex justify-center pt-0.5">
                <img
                  src="/logo/BIT_logo.jpg"
                  alt="Bannari Amman Institute of Technology"
                  className="h-16 sm:h-[72px] w-auto max-w-[210px] object-contain drop-shadow-xs rounded-xs"
                />
              </div>

              {/* 2. Middle Section: Passport Photo & Register Number */}
              <div className="flex flex-col items-center my-auto space-y-1.5 pt-1">
                {/* Passport Size Photo Frame */}
                <div className="relative w-[114px] h-[142px] sm:w-[124px] sm:h-[154px] rounded-xs bg-slate-100 border-[2.5px] border-white shadow-md overflow-hidden flex items-center justify-center">
                  {cardData.profilePhotoUrl ? (
                    <img
                      src={cardData.profilePhotoUrl}
                      alt={cardData.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-amber-700 to-amber-900 text-white font-extrabold text-3xl flex items-center justify-center">
                      {cardData.fullName?.charAt(0) || 'A'}
                    </div>
                  )}
                </div>

                {/* Register Number */}
                <div className="text-center">
                  <span className="block text-[11px] sm:text-[12px] font-black tracking-wider text-slate-950 font-mono">
                    {cardData.registerNumber || cardData.rollNumber || '7376221EC262'}
                  </span>
                </div>
              </div>

              {/* 3. Name & Degree/Department Section */}
              <div className="space-y-1.5 pb-1">
                {/* White Horizontal Full-Width Banner (Name) */}
                <div className="-ml-3.5 mr-0 bg-white py-1 px-2 shadow-xs text-center border-y border-slate-200/60">
                  <h3 className="font-black text-[13px] sm:text-[14.5px] text-slate-950 uppercase tracking-wide truncate">
                    {cardData.fullName || 'ALUMNUS NAME'}
                  </h3>
                </div>

                {/* Degree & Department (Bold Dark Text) */}
                <div className="text-center px-1">
                  <p className="text-[9.5px] sm:text-[10px] font-black text-slate-950 uppercase leading-tight tracking-tight">
                    {degreeAndDept}
                  </p>
                </div>
              </div>

              {/* 4. Bottom Row: Scannable Dynamic QR Code & Principal Signature */}
              <div className="flex items-end justify-between pt-1 pb-0.5 px-0.5">
                {/* Embedded Base64 Dynamic QR Code */}
                <div className="flex flex-col items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm z-10">
                  {cardData.qrCodeBase64 ? (
                    <img
                      src={cardData.qrCodeBase64}
                      alt="Verification QR"
                      className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                    />
                  ) : (
                    <QrCode className="w-12 h-12 text-slate-900" />
                  )}
                  <span className="text-[6.5px] font-black text-slate-900 uppercase tracking-tighter mt-0.5">
                    Scan to Verify
                  </span>
                </div>

                {/* Alumni ID & Principal Sign */}
                <div className="flex flex-col items-end text-right z-10">
                  <span className="text-[7.5px] font-mono font-extrabold text-amber-950 tracking-tight bg-amber-100/80 px-1.5 py-0.5 rounded-sm mb-1">
                    {cardData.alumniIdCardNumber || 'BIT-ALU-ACTIVE'}
                  </span>
                  <div className="flex flex-col items-center">
                    <svg
                      viewBox="0 0 100 30"
                      className="w-16 sm:w-20 h-6 object-contain overflow-visible"
                      fill="none"
                    >
                      <path
                        d="M5 20 C12 6, 20 2, 28 16 C32 24, 36 6, 44 12 C48 16, 52 8, 60 18 C66 26, 72 8, 80 16 M18 22 C35 20, 60 21, 92 18"
                        stroke="#0F172A"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-900 mt-0.5">
                      PRINCIPAL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BACK SIDE (Physical BIT Alumni ID Design)                                 */}
          {/* ========================================================================= */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-[24px] bg-[#EB5323] text-slate-950 border-[1.5px] border-amber-600/30 shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden">
            {/* Top Section: Personal & Contact Information */}
            <div className="space-y-3 pt-2 text-slate-950">
              {/* Blood Group */}
              <div className="text-[12px] sm:text-[13px] font-black tracking-wide leading-tight">
                <span className="inline-block w-20 text-slate-950">BG :</span>
                <span className="font-extrabold">{cardData.bloodGroup || 'B+'}</span>
              </div>

              {/* Date of Birth */}
              <div className="text-[12px] sm:text-[13px] font-black tracking-wide leading-tight">
                <span className="inline-block w-20 text-slate-950">DOB :</span>
                <span className="font-extrabold font-mono">{formattedDob}</span>
              </div>

              {/* Personal Email */}
              <div className="text-[12px] sm:text-[13px] font-black tracking-wide leading-tight">
                <span className="inline-block w-20 text-slate-950">E-Mail :</span>
                <span className="font-bold text-[11px] sm:text-[12px] truncate max-w-[180px] inline-block align-bottom">
                  {cardData.personalEmail || 'alumni@bitsathy.ac.in'}
                </span>
              </div>

              {/* Address */}
              <div className="text-[11.5px] sm:text-[12px] font-black tracking-wide leading-snug pt-1">
                <span className="block text-slate-950 pb-0.5">Address :</span>
                <div className="text-slate-900 font-extrabold text-[10.5px] sm:text-[11px] pl-1 space-y-0.5 uppercase">
                  {cardData.permanentAddress ? (
                    <>
                      <p className="truncate">{cardData.permanentAddress}</p>
                      {cardData.city && <p>{cardData.city}</p>}
                      {(cardData.state || cardData.country) && (
                        <p>{[cardData.state, cardData.country].filter(Boolean).join(', ')}</p>
                      )}
                      {cardData.postalCode && <p className="font-mono">{cardData.postalCode}</p>}
                    </>
                  ) : (
                    <>
                      <p>516 KUMBAKOTTAI MATHUR</p>
                      <p>KALLAKURICHI</p>
                      <p>TAMIL NADU</p>
                      <p className="font-mono">606207</p>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Number */}
              <div className="text-[12px] sm:text-[13px] font-black tracking-wide leading-tight pt-2">
                <span className="text-slate-950">Mobile No : </span>
                <span className="font-bold font-mono text-[12px] sm:text-[13px]">
                  {cardData.phoneNumber || '9361009807'}
                </span>
              </div>
            </div>

            {/* Bottom Section: Alumni Association Details & Official Logo Badge */}
            <div className="flex flex-col items-center space-y-2 pt-2 border-t border-amber-700/30">
              {/* Official Alumni Association Badge Box */}
              <div className="flex items-center justify-center p-1.5 bg-white rounded-xl shadow-xs w-full max-w-[210px]">
                <img
                  src="/logo/alumni_association_bit_logo.jpg"
                  alt="Alumni Association Bannari Amman Institute of Technology"
                  className="h-16 sm:h-[70px] w-auto object-contain"
                />
              </div>

              {/* Association Contact Credentials */}
              <div className="text-center text-slate-950 leading-tight space-y-0.5 pt-0.5">
                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-950">
                  {ALUMNI_ASSOCIATION_CONFIG.name}
                </h4>
                <div className="text-[9px] sm:text-[9.5px] font-extrabold space-y-0.5 text-slate-900 pt-0.5">
                  <p>
                    Phone : <span className="font-mono">{ALUMNI_ASSOCIATION_CONFIG.phone}</span>
                  </p>
                  <p>
                    Mobile : <span className="font-mono">{ALUMNI_ASSOCIATION_CONFIG.mobile}</span>
                  </p>
                  <p>
                    E-mail : <span>{ALUMNI_ASSOCIATION_CONFIG.email}</span>
                  </p>
                  <p>
                    Website : <span>{ALUMNI_ASSOCIATION_CONFIG.website}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={toggleFlip}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-300 shadow-sm transition active:scale-95"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Flip to {isFlipped ? 'Front Side' : 'Back Side'}</span>
        </button>

        {onRegenerateQr && (
          <button
            onClick={onRegenerateQr}
            disabled={regenerating}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#006A38] hover:bg-[#00522B] text-white font-bold text-xs shadow-md transition disabled:opacity-50 active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{regenerating ? 'Rotating Token...' : 'Regenerate QR Code'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
