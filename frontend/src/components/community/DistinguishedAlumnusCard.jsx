import React from "react";
import { Award, Building2, Briefcase, GraduationCap, Sparkles } from "lucide-react";

const categoryTheme = {
  CIVIL_SERVICES: {
    label: "Civil Services & Governance",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    glow: "border-blue-200"
  },
  DEFENSE: {
    label: "Defense & Armed Forces",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    glow: "border-emerald-200"
  },
  RESEARCH_SCIENCE: {
    label: "Research & Space Science",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    glow: "border-purple-200"
  },
  CORPORATE_LEADERS: {
    label: "Global Corporate Leadership",
    badge: "bg-bit-50 text-bit-700 border-bit-200",
    glow: "border-bit-200"
  },
  ENTREPRENEURS: {
    label: "Innovation & Enterprise",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    glow: "border-amber-200"
  }
};

const DistinguishedAlumnusCard = ({ alumnus }) => {
  const theme = categoryTheme[alumnus.category] || categoryTheme.CORPORATE_LEADERS;

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1">
      {/* Top Banner accent */}
      <div className="h-20 bg-gradient-to-r from-bit-800 via-bit-900 to-slate-900 relative">
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-md border ${theme.badge} shadow-sm`}>
            {theme.label}
          </span>
        </div>
      </div>

      {/* Avatar & Content */}
      <div className="px-5 pb-5 pt-0 flex-1 flex flex-col justify-between -mt-10">
        <div>
          {/* Avatar */}
          <div className="relative inline-block mb-3">
            <img
              src={alumnus.image}
              alt={alumnus.name}
              className="w-20 h-20 rounded-2xl object-cover object-center border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300 bg-slate-100"
              onError={(e) => {
                e.currentTarget.src = "https://www.bitsathy.ac.in/wp-content/uploads/cropped-bit_logo.png";
              }}
            />
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-gold-500 text-white shadow">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>

          {/* Name & Role */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-bit-700 transition-colors">
              {alumnus.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-bit-800">
              <Briefcase className="w-3.5 h-3.5 text-gold-600 shrink-0" />
              <span>{alumnus.role}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="line-clamp-1">{alumnus.organization}</span>
            </div>
          </div>

          {/* Achievement Description */}
          <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-3">
            {alumnus.achievement}
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
            <GraduationCap className="w-3.5 h-3.5 text-bit-600" />
            BIT {alumnus.batch}
          </span>
          <span className="text-[11px] font-semibold text-gold-700 bg-gold-50 px-2 py-0.5 rounded-md border border-gold-200/60">
            Distinguished Luminary
          </span>
        </div>
      </div>
    </div>
  );
};

export default DistinguishedAlumnusCard;
