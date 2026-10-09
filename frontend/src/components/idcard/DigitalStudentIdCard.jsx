import React, { useState } from 'react';
import { QrCode } from 'lucide-react';

/**
 * Digital Student ID Card — Front + Back, matching the physical BIT student ID.
 *
 * DAY_SCHOLAR (D) = Red card (#9B1C1C / #B91C1C)
 * HOSTELER    (H) = Navy Blue card (#1E3A5F / #1D4ED8)
 *
 * Front face matches physical card:
 *   Vertical colour stripe (left) with batch years written vertically
 *   BIT logo, student photo, name, register number, degree + department
 *   D or H badge at bottom-left, QR at bottom-right
 *
 * Back face matches physical card:
 *   Blood group, DOB, address, student phone, parent phone, official email
 *   Antiragging helpline (static institutional info)
 */

const COLOUR = {
  DAY_SCHOLAR: {
    stripe: '#B91C1C',       // Crimson red
    stripeDark: '#7F1D1D',   // Darker red for gradient
    badge: 'D',
    badgeBg: '#B91C1C',
    label: 'Day Scholar',
    cardBg: '#FFF9F9',       // Warm white card bg
    topBar: '#9B1C1C',
    accent: '#EF4444',
  },
  HOSTELER: {
    stripe: '#1D4ED8',       // Navy blue
    stripeDark: '#1E3A5F',
    badge: 'H',
    badgeBg: '#1D4ED8',
    label: 'Hosteler',
    cardBg: '#F5F8FF',
    topBar: '#1E3A8A',
    accent: '#3B82F6',
  },
};

const DEFAULT_COLOUR = COLOUR.DAY_SCHOLAR;

export const DigitalStudentIdCard = ({
  cardData,
  isFlipped: controlledFlipped,
  onFlipChange,
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  if (!cardData) return null;

  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  const toggleFlip = () => {
    const next = !isFlipped;
    if (onFlipChange) onFlipChange(next);
    else setInternalFlipped(next);
  };

  const theme = COLOUR[cardData.studentType] || DEFAULT_COLOUR;
  const batchText = `${cardData.batchStartYear || '20xx'} – ${cardData.batchEndYear || '20xx'}`;

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="flex flex-col items-center space-y-4 select-none">
      {/* 3D Stage — physical card proportions 85.6mm × 54mm ≈ 1.586:1 → landscape */}
      {/* Using portrait format like actual student ID: taller than wide */}
      <div style={{ width: 340, height: 540, perspective: 1200 }} className="cursor-pointer">
        <div
          onClick={toggleFlip}
          aria-label="Click to flip card"
          style={{
            width: '100%', height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.7s cubic-bezier(0.4,0.2,0.2,1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            borderRadius: 20,
          }}
        >
          {/* ============================== FRONT FACE ============================== */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            borderRadius: 20,
            background: theme.cardBg,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            border: `2px solid ${theme.stripe}33`,
          }}>
            {/* Left vertical stripe with batch year */}
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 40,
              background: `linear-gradient(180deg, ${theme.stripeDark}, ${theme.stripe})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10,
            }}>
              <span style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                color: 'white',
                fontWeight: 900,
                fontSize: 10,
                letterSpacing: '0.3em',
                fontFamily: 'monospace',
                userSelect: 'none',
              }}>
                {batchText}
              </span>
            </div>

            {/* Card content — offset by stripe width */}
            <div style={{ marginLeft: 40, display: 'flex', flexDirection: 'column', flex: 1, padding: '12px 14px 10px 14px' }}>

              {/* Header: BIT Logo + Institution Name */}
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <img src="/logo/BIT_logo.jpg" alt="Bannari Amman Institute of Technology"
                  style={{ height: 60, maxWidth: '100%', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                <p style={{ fontSize: 7.5, fontWeight: 900, color: theme.topBar, letterSpacing: '0.08em', marginTop: 3, lineHeight: 1.3, textTransform: 'uppercase' }}>
                  Bannari Amman Institute of Technology
                </p>
                <p style={{ fontSize: 6.5, color: '#666', marginTop: 1, letterSpacing: '0.05em' }}>
                  Sathyamangalam — 638401, Tamil Nadu
                </p>
                <div style={{
                  height: 2, background: `linear-gradient(90deg, transparent, ${theme.stripe}, transparent)`,
                  margin: '6px 0',
                }} />
                <p style={{ fontSize: 8, fontWeight: 800, color: theme.topBar, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  STUDENT IDENTITY CARD
                </p>
              </div>

              {/* Passport photo */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <div style={{
                  width: 100, height: 126,
                  borderRadius: 4,
                  border: `3px solid ${theme.stripe}`,
                  overflow: 'hidden',
                  background: '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  {cardData.profilePhotoUrl ? (
                    <img src={cardData.profilePhotoUrl} alt={cardData.fullName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: `linear-gradient(135deg, ${theme.stripeDark}, ${theme.stripe})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 36, fontWeight: 900,
                    }}>
                      {cardData.fullName?.charAt(0) || 'S'}
                    </div>
                  )}
                </div>
              </div>

              {/* Student name */}
              <div style={{
                background: theme.stripe, margin: '0 -14px', padding: '4px 14px',
                textAlign: 'center',
              }}>
                <p style={{ color: 'white', fontWeight: 900, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {cardData.fullName || 'STUDENT NAME'}
                </p>
              </div>

              {/* Register number + degree + dept */}
              <div style={{ textAlign: 'center', padding: '6px 0 4px' }}>
                <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 11, color: '#1a1a1a', letterSpacing: '0.1em' }}>
                  {cardData.registerNumber || '—'}
                </p>
                <p style={{ fontSize: 9, color: '#444', marginTop: 2, fontWeight: 600 }}>
                  {cardData.degree} — {cardData.departmentName}
                </p>
              </div>

              {/* Bottom: D/H badge  +  QR code */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8 }}>
                {/* D/H + student type badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: theme.badgeBg,
                    border: '2.5px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: 15,
                  }}>
                    {theme.badge}
                  </div>
                  <span style={{ fontSize: 7, fontWeight: 700, color: theme.stripe, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {theme.label}
                  </span>
                </div>

                {/* Principal signature area */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: `1.5px solid ${theme.stripe}66`, width: 80, marginBottom: 2 }} />
                  <p style={{ fontSize: 7, color: '#666', fontWeight: 600 }}>Principal</p>
                  <p style={{ fontSize: 6, color: '#888' }}>Signature & Seal</p>
                </div>

                {/* QR code */}
                <div style={{
                  background: 'white', padding: 4, borderRadius: 6,
                  border: `1.5px solid ${theme.stripe}44`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  {cardData.qrCodeBase64 ? (
                    <img src={cardData.qrCodeBase64} alt="QR" style={{ width: 52, height: 52 }} />
                  ) : (
                    <QrCode style={{ width: 52, height: 52, color: '#334155' }} />
                  )}
                  <span style={{ fontSize: 5.5, fontWeight: 700, color: '#334155', letterSpacing: '0.05em', marginTop: 2 }}>
                    SCAN TO VERIFY
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ============================== BACK FACE ============================== */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 20,
            background: 'white',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            border: `2px solid ${theme.stripe}33`,
          }}>
            {/* Top bar */}
            <div style={{
              background: `linear-gradient(135deg, ${theme.stripeDark}, ${theme.stripe})`,
              padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <img src="/logo/BIT_logo.jpg" alt="BIT" style={{ height: 36, objectFit: 'contain' }} />
              <div>
                <p style={{ color: 'white', fontWeight: 900, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Bannari Amman Institute of Technology
                </p>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 7.5, fontWeight: 600, marginTop: 1 }}>
                  Student Identity Card — Back
                </p>
              </div>
            </div>

            {/* Back body */}
            <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Details table */}
              {[
                { label: 'Student Name', value: cardData.fullName },
                { label: 'Register No.',  value: cardData.registerNumber },
                { label: 'Blood Group',   value: cardData.bloodGroup },
                { label: 'Date of Birth', value: formatDate(cardData.dateOfBirth) },
                { label: 'Student Phone', value: cardData.studentPhone },
                { label: 'Parent Phone',  value: cardData.parentPhone },
                { label: 'Official Email',value: cardData.officialEmail },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  borderBottom: '1px solid #f1f5f9', paddingBottom: 5, marginBottom: 5,
                }}>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0, width: 80 }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#0f172a', textAlign: 'right', wordBreak: 'break-all' }}>
                    {value || '—'}
                  </span>
                </div>
              ))}

              {/* Address */}
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 5, marginBottom: 5 }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 2 }}>
                  Address
                </span>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.4, display: 'block' }}>
                  {cardData.address || '—'}
                </span>
              </div>

              {/* Antiragging info */}
              <div style={{
                background: `${theme.stripe}11`,
                border: `1px solid ${theme.stripe}44`,
                borderRadius: 8,
                padding: '6px 10px',
                marginTop: 'auto',
              }}>
                <p style={{ fontSize: 7.5, fontWeight: 800, color: theme.stripeDark, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                  Anti-Ragging Helpline
                </p>
                <p style={{ fontSize: 8.5, fontWeight: 700, color: '#1e293b' }}>
                  Toll Free: <strong>1800 180 5522</strong>
                </p>
                <p style={{ fontSize: 7.5, color: '#475569', marginTop: 2, lineHeight: 1.4 }}>
                  This card is the property of BIT, Sathyamangalam.
                  If found, please return to the institution.
                </p>
                <p style={{ fontSize: 7, color: '#94a3b8', marginTop: 3 }}>
                  www.bitsathy.ac.in
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">Click the card to flip and see the back</p>
    </div>
  );
};