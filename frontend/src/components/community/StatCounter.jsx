import React from "react";
import { Users, Globe2, Trophy, Award, Calendar, Sparkles } from "lucide-react";
import { alumniStatistics } from "../../data/alumniData";

const statsConfig = [
  {
    label: "Global Alumni Community",
    value: alumniStatistics.totalAlumniDisplay,
    subtext: `Graduating batches (${alumniStatistics.batchCoverage})`,
    icon: Users,
    gradient: "from-blue-600 to-bit-800"
  },
  {
    label: "Active Alumni Chapters",
    value: `${alumniStatistics.totalChapters}+`,
    subtext: "International, National & State Chapters",
    icon: Globe2,
    gradient: "from-bit-700 to-gold-600"
  },
  {
    label: "Global & National Meets",
    value: `${alumniStatistics.globalAlumniMeets + alumniStatistics.nationalMeets + alumniStatistics.interstateMeets}`,
    subtext: "Homecomings, State & Inter-State Meets",
    icon: Calendar,
    gradient: "from-gold-600 to-amber-700"
  },
  {
    label: "Annual Sports & Carnivals",
    value: "Annual",
    subtext: "Alumni Trophy & Multi-Sport Tournaments",
    icon: Trophy,
    gradient: "from-emerald-600 to-teal-800"
  }
];

const StatCounter = ({ className = "" }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {statsConfig.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={idx}
            className="relative overflow-hidden bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            {/* Top Accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${stat.gradient}`} />

            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md group-hover:scale-110 transition-transform`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <Sparkles className="w-4 h-4 text-gold-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-slate-700">
                {stat.label}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {stat.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatCounter;
