import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  CreditCard,
  Users,
  Search,
  ArrowRight,
  CheckCircle2,
  Building2,
  QrCode,
  Sparkles
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const LandingPage = () => {
  const [qrInputToken, setQrInputToken] = useState('');
  const navigate = useNavigate();

  const handleManualVerify = (e) => {
    e.preventDefault();
    if (qrInputToken.trim()) {
      // If user pasted full url or just token, extract token
      const token = qrInputToken.trim().split('/').pop();
      navigate(`/verify/${token}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-bit-950 text-white py-20 lg:py-28">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-bit-900/60 border border-bit-500/30 text-bit-300 text-xs font-semibold backdrop-blur">
                <Sparkles className="w-3.5 h-3.5 text-bit-400" />
                <span>Official BIT Alumni Ecosystem</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Connect. Verify. <br />
                <span className="bg-gradient-to-r from-bit-400 to-teal-200 bg-clip-text text-transparent">
                  Inspire the Next Generation.
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                BIT Connect is the unified digital platform for Bannari Amman Institute of Technology alumni. Access your authentic <strong>Virtual Alumni ID</strong>, connect with fellow graduates worldwide, and streamline campus engagements.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-bit-600 hover:bg-bit-500 text-white font-bold shadow-lg shadow-bit-600/30 transition transform hover:-translate-y-0.5"
                >
                  <span>Join Alumni Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/directory"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition"
                >
                  <Users className="w-4 h-4" />
                  <span>Browse Directory</span>
                </Link>
              </div>

              {/* Quick Scanner Input */}
              <div className="pt-8 border-t border-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Instant QR Identity Lookup
                </p>
                <form onSubmit={handleManualVerify} className="flex max-w-md mx-auto lg:mx-0 gap-2">
                  <div className="relative flex-1">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Paste verification token or URL..."
                      value={qrInputToken}
                      onChange={(e) => setQrInputToken(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-bit-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-bit-700 hover:bg-bit-600 text-white text-xs font-bold transition"
                  >
                    Verify
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Virtual ID Badge Graphic */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm rounded-3xl p-6 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700 shadow-2xl backdrop-blur-md">
                <div className="flex justify-between items-start border-b border-slate-700 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-bit-600 flex items-center justify-center text-white font-bold text-xs">
                      BIT
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">Virtual Alumni ID</h4>
                      <p className="text-[10px] text-slate-400">Institutional Credential</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </span>
                </div>

                <div className="py-6 flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-bit-800 to-bit-500 flex items-center justify-center text-white text-xl font-bold border-2 border-bit-400/30 shadow-inner">
                    PK
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-white">Praveen Kumar</h3>
                    <p className="text-xs text-bit-300 font-medium">B.Tech - Information Technology</p>
                    <p className="text-[11px] text-slate-400 font-mono">BIT-ALU-2024-000001</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Security Standard</p>
                    <p className="text-xs font-semibold text-slate-200">Zero-PII Dynamic QR</p>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-bit-700">
            Core Platform Capabilities
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for seamless alumni identity & lifelong connection
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-bit-50 text-bit-700 flex items-center justify-center mb-6">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Virtual Alumni ID</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Official institutional digital credentials automatically generated upon administrative approval. Instant 3D digital card preview with front and back data.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Zero-PII QR Verification</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cryptographically secure high-entropy QR tokens enable gate security and recruiters to verify authenticity without exposing personal contact info or addresses.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Privacy-Safe Directory</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Search verified graduates by department, graduation batch, current company, and professional domain with granular privacy visibility controls.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
