import React from "react";
import { MapPin, Mail, Globe, CheckCircle2 } from "lucide-react";

const categoryStyles = {
  INTERNATIONAL: {
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    badge: "International Chapter",
    glow: "group-hover:border-purple-300"
  },
  NATIONAL: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "National Chapter",
    glow: "group-hover:border-blue-300"
  },
  STATE: {
    bg: "bg-amber-50 text-amber-800 border-amber-200",
    badge: "State / Regional Chapter",
    glow: "group-hover:border-amber-300"
  }
};

const ChapterCard = ({ chapter }) => {
  const catStyle = categoryStyles[chapter.category] || categoryStyles.STATE;

  return (
    <div className={`group relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col ${catStyle.glow}`}>
      {/* Visual Image Header */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <img
          src={chapter.image}
          alt={chapter.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          onError={(e) => {
            e.currentTarget.src = "https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_1.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

        {/* Badge top right */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${catStyle.bg} shadow-sm`}>
            <Globe className="w-3 h-3" />
            {catStyle.badge}
          </span>
        </div>

        {/* Chapter Title overlay */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-md">
            {chapter.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-200 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            <span>{chapter.city}, {chapter.country}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          {chapter.description}
        </p>

        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
          {chapter.email && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-bit-600 shrink-0" />
              <a
                href={`mailto:${chapter.email}`}
                className="text-bit-700 hover:text-bit-900 font-medium truncate transition-colors"
              >
                {chapter.email}
              </a>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-500 font-medium">Est. {chapter.established}</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3" />
              Active Network
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterCard;
