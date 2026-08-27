import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  QrCode,
  Users,
  Award,
  Globe2,
  Calendar,
  ArrowRight,
  Sparkles,
  BookOpen,
  Image,
  CheckCircle2,
  ChevronRight,
  GraduationCap
} from "lucide-react";
import StatCounter from "../../components/community/StatCounter";
import ChapterCard from "../../components/community/ChapterCard";
import EventCard from "../../components/community/EventCard";
import DistinguishedAlumnusCard from "../../components/community/DistinguishedAlumnusCard";
import SectionHeader from "../../components/community/SectionHeader";
import {
  alumniAssociationInfo,
  alumniChapters,
  alumniEvents,
  distinguishedAlumni,
  photoGallery,
  alumniNewsletters
} from "../../data/alumniData";

const LandingPage = () => {
  const featuredChapters = alumniChapters.slice(0, 3);
  const featuredEvents = alumniEvents.slice(0, 3);
  const featuredAlumni = distinguishedAlumni.slice(0, 3);
  const galleryPreview = photoGallery.slice(0, 4);
  const latestNewsletter = alumniNewsletters[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-gold-500 selection:text-slate-900">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bit-950 via-bit-900 to-slate-900 text-white pt-24 pb-28 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C59B27_1px,transparent_1px)] [background-size:24px_24px]" />
        
        {/* Subtle decorative glowing orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-bit-700/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-gold-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left Copy */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              {/* College Tagline */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bit-800/80 border border-gold-500/40 text-gold-300 text-xs font-semibold backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping"></span>
                <span>Stay Ahead • Bannari Amman Institute of Technology</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                The Official Global Network of <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-amber-200 bg-clip-text text-transparent">BIT Alumni</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Connect with over 33,000 graduates worldwide, claim your verifiable 3D Digital Alumni ID Card, discover chapters across 4 continents, and participate in reunions.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/register"
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-slate-950 font-bold text-sm shadow-xl shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                >
                  <span>Register as Alumni</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/login"
                  className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm backdrop-blur-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  Alumni Login
                </Link>

                <Link
                  to="/alumni-association"
                  className="px-6 py-3.5 rounded-xl text-gold-300 hover:text-gold-200 font-semibold text-sm inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>About Association</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Micro highlights */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>33,778+ Alumni</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>15 Global & State Chapters</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Cryptographic QR Verification</span>
                </div>
              </div>
            </div>

            {/* Right Card / Visual */}
            <div className="w-full lg:w-5/12 flex justify-center">
              <div className="relative w-full max-w-sm">
                {/* 3D Virtual ID Preview Mockup */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-bit-950 to-slate-950 p-6 border-2 border-gold-500/40 shadow-2xl shadow-bit-950/80 text-white space-y-5">
                  {/* Card Top Brand */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src="/logo/BIT_logo.jpg"
                        alt="BIT Logo"
                        className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.src = "https://www.bitsathy.ac.in/wp-content/uploads/cropped-bit_logo.png";
                        }}
                      />
                      <div>
                        <div className="text-xs font-black tracking-wider text-gold-400">BANNARI AMMAN</div>
                        <div className="text-[10px] font-semibold text-slate-300">INSTITUTE OF TECHNOLOGY</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-[10px] font-bold border border-gold-500/30">
                      OFFICIAL ID
                    </span>
                  </div>

                  {/* Card Alumnus Showcase */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bit-700 to-bit-900 border-2 border-gold-400/80 overflow-hidden flex items-center justify-center text-gold-300 text-xl font-bold">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-white text-sm">Distinguished Alumnus</div>
                      <div className="text-gold-300 font-semibold">B.E. Computer Science</div>
                      <div className="text-slate-400 text-[11px]">Batch: 2018 - 2022 • Sathyamangalam</div>
                    </div>
                  </div>

                  {/* QR Security Strip */}
                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-6 h-6 text-gold-400" />
                      <div className="text-[11px] leading-tight">
                        <span className="font-bold text-white block">Tamper-Proof Digital ID</span>
                        <span className="text-slate-300 text-[10px]">Instant QR Verification</span>
                      </div>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -bottom-4 -right-4 px-4 py-2 rounded-xl bg-gradient-to-r from-bit-800 to-bit-900 border border-gold-500/40 text-gold-300 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-400" />
                  <span>3D Interactive Card</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMMUNITY STATISTICS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 w-full">
        <StatCounter />
      </section>

      {/* 3. ABOUT THE ALUMNI COMMUNITY */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bit-50 text-bit-800 border border-bit-200 text-xs font-semibold uppercase tracking-wider">
              <span>Alumni Association (AABIT)</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              A Lifelong Bond with Your <span className="text-bit-700">Alma Mater</span>
            </h2>

            <p className="text-slate-600 text-base leading-relaxed">
              {alumniAssociationInfo.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 pt-2">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                <span className="font-bold text-bit-800 block">7 Constitutional Objectives</span>
                <span className="text-xs text-slate-500">Structured non-profit welfare and mentorship mission.</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                <span className="font-bold text-bit-800 block">Alumni Welfare Fund</span>
                <span className="text-xs text-slate-500">Dedicated contingency and medical assistance programs.</span>
              </div>
            </div>

            <div>
              <Link
                to="/alumni-association"
                className="inline-flex items-center gap-2 font-bold text-bit-700 hover:text-bit-900 bg-bit-50 hover:bg-bit-100 px-5 py-2.5 rounded-xl border border-bit-200 transition-colors"
              >
                <span>Read Full Charter & Objectives</span>
                <ArrowRight className="w-4 h-4 text-gold-600" />
              </Link>
            </div>
          </div>

          {/* Right visual highlights */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
              <img
                src="https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_2.jpg"
                alt="BIT Alumni Gathering"
                className="w-full h-80 object-cover object-center"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xl max-w-xs space-y-1">
              <span className="text-xs font-bold text-gold-600 uppercase tracking-wider block">Global Homecoming</span>
              <p className="text-xs text-slate-600">
                Thousands of alumni return to the lush 180-acre BIT campus for biennial Global Meets and sports carnivals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CHAPTERS SPOTLIGHT */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Global Presence"
            title="Active Alumni"
            highlight="Chapters"
            description="From Europe and the Middle East to Bengaluru and Chennai, our 15 chapters organize local gatherings and tech conclaves."
            actionText="View All 15 Chapters"
            actionLink="/chapters"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredChapters.map((chap) => (
              <ChapterCard key={chap.id} chapter={chap} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED & UPCOMING EVENTS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Reunions & Conclaves"
          title="Upcoming Alumni"
          highlight="Events & Meets"
          description="Participate in Global Meets, department batch reunions, sports tournaments, and chapter conclaves."
          actionText="Explore All Events"
          actionLink="/events"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      </section>

      {/* 6. DISTINGUISHED ALUMNI SPOTLIGHT */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-gold-300 border border-gold-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
                <Award className="w-3.5 h-3.5 text-gold-400" />
                <span>Hall of Fame</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Distinguished <span className="text-gold-400">BIT Luminaries</span>
              </h2>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                Honoring our alumni in Civil Services, Armed Forces, Aerospace Science, and Global Enterprises.
              </p>
            </div>

            <div>
              <Link
                to="/distinguished-alumni"
                className="inline-flex items-center gap-2 font-semibold text-slate-900 bg-gold-400 hover:bg-gold-500 px-5 py-2.5 rounded-xl transition-colors shadow-md text-sm"
              >
                <span>View Full Showcase</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAlumni.map((alum) => (
              <DistinguishedAlumnusCard key={alum.id} alumnus={alum} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. PHOTO GALLERY HIGHLIGHTS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Memories in Frame"
          title="Homecoming & Chapter"
          highlight="Gallery Highlights"
          description="A glimpse into campus reunions, athletic tournaments, and international chapter gatherings."
          actionText="Open Full Photo Gallery"
          actionLink="/gallery"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {galleryPreview.map((photo) => (
            <Link
              key={photo.id}
              to="/gallery"
              className="group relative h-60 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 block"
            >
              <img
                src={photo.image}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                onError={(e) => {
                  e.currentTarget.src = "https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_1.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] text-gold-300 font-bold uppercase tracking-wider block">{photo.year}</span>
                <h4 className="text-xs font-bold line-clamp-1 group-hover:text-gold-200 transition-colors">{photo.title}</h4>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. NEWSLETTER / PUBLICATION SPOTLIGHT */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-bit-950 via-bit-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bit-800 text-gold-300 text-xs font-semibold border border-gold-500/30">
                <BookOpen className="w-3.5 h-3.5 text-gold-400" />
                <span>Latest AABIT Publication</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {latestNewsletter.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {latestNewsletter.description}
              </p>
              <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-4">
                <a
                  href={latestNewsletter.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold text-xs shadow-md transition-colors"
                >
                  Read Online (PDF)
                </a>
                <Link
                  to="/newsletter"
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors"
                >
                  View All Archives
                </Link>
              </div>
            </div>

            <div className="shrink-0 w-48 h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/20 relative">
              <img
                src={latestNewsletter.coverImage}
                alt="Newsletter Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 text-xs font-bold text-gold-300">
                {latestNewsletter.period}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FINAL COMMUNITY CTA */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-bit-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bit-800 text-gold-300 text-xs font-semibold border border-gold-500/30">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Stay Ahead • Bannari Amman</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Ready to Connect with Your <span className="text-gold-400">Alumni Community?</span>
          </h2>

          <p className="text-slate-300 text-base max-w-xl mx-auto leading-relaxed">
            Register your profile on BIT Connect to claim your verified Digital Alumni ID, connect with classmates, and participate in institutional programs.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-slate-950 font-bold text-sm shadow-xl shadow-gold-500/20 transition-all"
            >
              Join BIT Connect
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
