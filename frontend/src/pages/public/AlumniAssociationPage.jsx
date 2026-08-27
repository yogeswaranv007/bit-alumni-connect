import React from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Target,
  ShieldCheck,
  Globe,
  HeartHandshake,
  Rocket,
  Trophy,
  ArrowRight,
  Sparkles,
  Building,
  Mail,
  Phone,
  CheckCircle
} from "lucide-react";
import SectionHeader from "../../components/community/SectionHeader";
import StatCounter from "../../components/community/StatCounter";
import { alumniAssociationInfo, alumniObjectives } from "../../data/alumniData";

const AlumniAssociationPage = () => {
  const welfareIcons = {
    HeartHandshake: HeartHandshake,
    GraduationCap: GraduationCap,
    Rocket: Rocket,
    Trophy: Trophy
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bit-950 via-bit-900 to-slate-900 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C59B27_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bit-800/80 border border-gold-500/30 text-gold-300 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span>Bannari Amman Institute of Technology Alumni Association</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Empowering a Global Network of <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-amber-200 bg-clip-text text-transparent">33,000+ BITians</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                {alumniAssociationInfo.description}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/register"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-slate-950 font-bold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all duration-200 inline-flex items-center gap-2"
                >
                  <span>Join BIT Connect</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/directory"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm backdrop-blur-md transition-all duration-200"
                >
                  Explore Alumni Directory
                </Link>
              </div>
            </div>

            <div className="w-full lg:w-5/12 flex justify-center">
              <div className="relative p-6 sm:p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl space-y-6 text-slate-200 w-full max-w-md">
                <div className="flex items-center gap-4 border-b border-white/15 pb-5">
                  <div className="p-3.5 rounded-2xl bg-gold-500/20 border border-gold-500/40 text-gold-300">
                    <Building className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">AABIT Secretariat</h3>
                    <p className="text-xs text-slate-300">Est. {alumniAssociationInfo.establishedYear} • BIT Campus</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <Globe className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                    <span>{alumniAssociationInfo.headquarters}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                    <a href={`mailto:${alumniAssociationInfo.email}`} className="text-gold-300 hover:underline">
                      {alumniAssociationInfo.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                    <span>Intercom: {alumniAssociationInfo.intercom} | Phone: {alumniAssociationInfo.phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-slate-400">
                  <span>Constitutional Non-Profit Body</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Statistics Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <StatCounter />
      </section>

      {/* Objectives Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Charter & Purpose"
          title="Constitutional Objectives of the"
          highlight="Alumni Association"
          description="The official objectives guiding the Bannari Amman Institute of Technology Alumni Association in serving its alumni and alma mater."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumniObjectives.map((obj) => (
            <div
              key={obj.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-xl bg-bit-50 text-bit-800 font-extrabold flex items-center justify-center border border-bit-200 text-sm group-hover:bg-bit-700 group-hover:text-white transition-colors">
                    0{obj.id}
                  </span>
                  <Target className="w-5 h-5 text-gold-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-bit-700 transition-colors">
                  {obj.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {obj.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-bit-700">
                <span>Objective #{obj.id}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Welfare & Community Initiatives */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Giving Back & Growing Together"
            title="Alumni Community & Welfare"
            highlight="Initiatives"
            description="Active programs connecting alumni capabilities to empower members, mentor students, and fuel innovation."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {alumniAssociationInfo.welfareInitiatives.map((init, idx) => {
              const IconComp = welfareIcons[init.icon] || HeartHandshake;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-gold-300 hover:bg-gold-50/20 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-bit-800 text-gold-400 flex items-center justify-center shadow-md">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{init.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{init.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-16 bg-gradient-to-r from-bit-900 via-bit-950 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Connect with Your Alma Mater on <span className="text-gold-400">BIT Connect</span>
          </h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed">
            Claim your Digital Alumni ID Card, verify credentials via cryptographic QR codes, connect with regional chapter meets, and access the global directory.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold text-sm shadow-xl transition-all"
            >
              Register as Alumni
            </Link>
            <Link
              to="/chapters"
              className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
            >
              Explore Global Chapters
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AlumniAssociationPage;
