import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ShieldCheck, ShieldX, GraduationCap, Building, BookOpen, Calendar, QrCode } from 'lucide-react';

/**
 * Public student ID verification page — accessible without authentication.
 * Displays only the minimum privacy-safe information needed for physical verification.
 */
export const StudentVerifyPage = () => {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    studentApi.verifyToken(token)
      .then(res => setResult(res.data))
      .catch(() => setResult({ valid: false, message: 'Verification failed. The QR code may be invalid or expired.' }))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6">
        {loading ? (
          <LoadingSpinner size="lg" text="Verifying student ID…" />
        ) : result?.valid ? (
          <div className="w-full max-w-sm bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden">
            {/* Status bar */}
            <div className="bg-emerald-500 py-5 flex flex-col items-center gap-2">
              <ShieldCheck className="w-10 h-10 text-white" />
              <p className="text-white font-extrabold text-lg tracking-tight">Identity Verified</p>
              <p className="text-emerald-100 text-xs">BIT Digital Student ID — Valid</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-xl font-extrabold text-slate-900">{result.fullName}</p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{result.studentIdNumber}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: Building, label: 'Department', value: `${result.departmentCode} — ${result.departmentName}` },
                  { icon: BookOpen, label: 'Degree', value: result.degree },
                  { icon: Calendar, label: 'Batch End Year', value: result.batchEndYear },
                  { icon: QrCode, label: 'Scan Count', value: result.scanCount },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">{label}</p>
                      <p className="text-sm font-bold text-slate-900">{value || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Verified by BIT Connect · Bannari Amman Institute of Technology
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm bg-white rounded-3xl border border-rose-200 shadow-xl overflow-hidden">
            <div className="bg-rose-500 py-5 flex flex-col items-center gap-2">
              <ShieldX className="w-10 h-10 text-white" />
              <p className="text-white font-extrabold text-lg">Verification Failed</p>
            </div>
            <div className="p-6 text-center space-y-4">
              <p className="text-sm text-slate-600">{result?.message || 'Invalid or expired QR code.'}</p>
              <Link to="/" className="inline-block text-xs font-bold text-bit-700 hover:underline">
                Return to BIT Connect
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};
