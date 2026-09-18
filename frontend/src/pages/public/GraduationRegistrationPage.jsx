import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck,
  Building2,
  Mail,
  Phone,
  Sparkles,
  ArrowRight
} from "lucide-react";
import SectionHeader from "../../components/community/SectionHeader";
import { graduationResources } from "../../data/alumniData";

const GraduationRegistrationPage = () => {
  const { isAuthenticated, isAlumni } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-bit-950 via-bit-900 to-slate-900 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bit-800/80 border border-gold-500/30 text-gold-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-gold-400" />
            <span>Academic Convocation & Degrees</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            {graduationResources.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {graduationResources.description}
          </p>
        </div>
      </section>

      {/* Main Container */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
          {/* Official Portal Box */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-bit-50 via-slate-50 to-gold-50/40 border border-bit-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-bit-800 bg-bit-100/80 px-2.5 py-1 rounded-md">
                <FileCheck className="w-3.5 h-3.5 text-bit-700" />
                <span>Official BIT Convocation Portal</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Direct Graduation Day Registration
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Access the official Bannari Amman Institute of Technology Convocation Registration portal to confirm your attendance, regalia sizing, and guest passes.
              </p>
            </div>

            <a
              href={graduationResources.officialPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-bit-800 to-bit-900 hover:from-bit-900 hover:to-slate-900 text-white font-bold text-sm shadow-md inline-flex items-center gap-2 shrink-0 transition-all group"
            >
              <span>Go to Official Registration</span>
              <ExternalLink className="w-4 h-4 text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          {/* Instructions and Guidelines */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Important Instructions for Graduands</span>
            </h3>

            <div className="grid grid-cols-1 gap-3 text-sm text-slate-700">
              {graduationResources.instructions.map((inst, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <span className="w-6 h-6 rounded-full bg-bit-100 text-bit-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm leading-relaxed">{inst}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Institutional Support Contacts */}
          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Official Helpdesk & CoE Enquiries</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {graduationResources.importantContacts.map((contact, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <span className="text-slate-500 font-medium block">{contact.label}</span>
                  <span className="text-slate-900 font-bold block">{contact.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Integration with Digital Alumni ID */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base font-bold text-white">
                {isAuthenticated ? 'Access Your 3D Digital Alumni ID' : 'Have you received your Digital Alumni ID?'}
              </h4>
              <p className="text-xs text-slate-300">
                {isAuthenticated
                  ? 'View, download, or present your cryptographically signed Digital Alumni ID Card.'
                  : 'Register on BIT Connect to generate your 3D Digital Alumni ID Card with cryptographic QR verification.'}
              </p>
            </div>
            <Link
              to={isAuthenticated ? (isAlumni() ? '/alumni/id-card' : '/admin/dashboard') : '/register'}
              className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold text-xs shrink-0 transition-colors inline-flex items-center gap-1.5"
            >
              <span>{isAuthenticated ? 'View Digital ID' : 'Get Digital ID'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GraduationRegistrationPage;
