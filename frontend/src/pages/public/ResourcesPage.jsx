import React from "react";
import {
  ShieldCheck,
  ClipboardCheck,
  Rocket,
  Cpu,
  FileCheck,
  Briefcase,
  ExternalLink,
  BookOpen,
  Sparkles
} from "lucide-react";
import SectionHeader from "../../components/community/SectionHeader";
import { officialInstitutionalLinks } from "../../data/alumniData";

const iconMap = {
  ShieldCheck: ShieldCheck,
  ClipboardCheck: ClipboardCheck,
  Rocket: Rocket,
  Cpu: Cpu,
  FileCheck: FileCheck,
  Briefcase: Briefcase
};

const ResourcesPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-bit-950 via-bit-900 to-slate-900 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bit-800/80 border border-gold-500/30 text-gold-300 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-gold-400" />
            <span>Alumni & Institutional Portals</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Official BIT <span className="text-gold-400">Resources & Services</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Direct access to official Bannari Amman Institute of Technology institutional portals, genuineness verification, accreditation feedback forms, and innovation centres.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {officialInstitutionalLinks.map((res, idx) => {
            const IconComp = iconMap[res.icon] || ExternalLink;
            return (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-gold-300 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-bit-50 text-bit-700 group-hover:bg-bit-800 group-hover:text-gold-400 flex items-center justify-center transition-colors shadow-sm">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-bit-700 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-bit-700 transition-colors leading-snug">
                      {res.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {res.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-bit-700 group-hover:text-bit-900">
                  <span>Open Official Portal</span>
                  <span className="text-gold-600 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ResourcesPage;
