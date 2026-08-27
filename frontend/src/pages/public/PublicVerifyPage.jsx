import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { virtualIdApi } from '../../api/virtualIdApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Eye,
  ArrowLeft,
  Award,
  Sparkles
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const PublicVerifyPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    const performVerification = async () => {
      setLoading(true);
      try {
        const response = await virtualIdApi.verifyPublicToken(token);
        // The backend returns ApiResponse with data: PublicVerificationResponse
        if (response.data) {
          setVerificationResult(response.data);
        } else {
          setVerificationResult({ valid: false, message: response.message || 'Verification record not found' });
        }
      } catch (err) {
        setVerificationResult({
          valid: false,
          message: err.message || 'Invalid or revoked verification token',
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      performVerification();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xl text-center">
              <LoadingSpinner size="lg" text="Scanning and verifying institutional identity record..." />
            </div>
          ) : verificationResult?.valid ? (
            /* VALID VERIFIED ALUMNUS CARD */
            <div className="bg-white rounded-3xl overflow-hidden border border-emerald-200/80 shadow-2xl shadow-emerald-900/10 animate-in fade-in zoom-in-95 duration-200">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-bit-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
                  <ShieldCheck className="w-48 h-48" />
                </div>

                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold mb-3 backdrop-blur">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Institutional Credential Verified</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Bannari Amman Institute of Technology
                </h2>
                <p className="text-xs text-emerald-200 mt-1 font-semibold uppercase tracking-wider">
                  Official Alumni Identity Registry
                </p>
              </div>

              {/* Status Ribbon */}
              <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center justify-center space-x-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>✓ ACTIVE & AUTHENTIC ALUMNUS</span>
              </div>

              {/* Profile Details */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                  {verificationResult.profilePhotoUrl ? (
                    <img
                      src={verificationResult.profilePhotoUrl}
                      alt={verificationResult.fullName}
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-emerald-100 shadow-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-bit-800 to-bit-600 text-white font-extrabold text-2xl flex items-center justify-center border-4 border-emerald-100 shadow-md flex-shrink-0">
                      {verificationResult.fullName?.charAt(0) || 'A'}
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="text-2xl font-extrabold text-slate-900">
                      {verificationResult.fullName}
                    </h3>
                    <p className="text-sm font-semibold text-bit-700">
                      {verificationResult.degree} — {verificationResult.departmentName}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200">
                        <Award className="w-3.5 h-3.5 mr-1.5 text-bit-600" />
                        {verificationResult.alumniIdNumber}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        Class of {verificationResult.batchEndYear}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit & Verification Metadata */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Academic Department</span>
                    <span className="font-bold text-slate-800 mt-0.5 block truncate">
                      {verificationResult.departmentCode} ({verificationResult.departmentName})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Issued Date</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {verificationResult.issuedDate || 'Standard Issue'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Verification Mechanism</span>
                    <span className="font-bold text-emerald-700 mt-0.5 block">
                      256-Bit Dynamic QR Token
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Total Verified Scans</span>
                    <span className="font-bold text-slate-800 mt-0.5 block flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{verificationResult.scanCount} scans</span>
                    </span>
                  </div>
                </div>

                {/* Zero-PII Privacy Notice */}
                <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                  🛡️ <strong>Zero-PII Compliance</strong>: Sensitive personal details (phone number, permanent address, date of birth) are intentionally protected and excluded from public verification queries.
                </div>
              </div>
            </div>
          ) : (
            /* INVALID / REVOKED CARD */
            <div className="bg-white rounded-3xl overflow-hidden border border-rose-200 shadow-2xl p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Verification Unsuccessful
                </h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  {verificationResult?.message || 'This QR verification token is either invalid, revoked, or has expired.'}
                </p>
              </div>

              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-800 text-left space-y-1">
                <p className="font-bold">Possible causes:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  <li>The alumnus recently regenerated their QR code, invalidating older copies.</li>
                  <li>The Virtual ID has been temporarily suspended or revoked by an administrator.</li>
                  <li>The token parameter in the scan URL was corrupted or mistyped.</li>
                </ul>
              </div>

              <Link
                to="/"
                className="inline-flex items-center space-x-2 text-xs font-bold text-bit-700 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to BIT Connect Portal</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};
