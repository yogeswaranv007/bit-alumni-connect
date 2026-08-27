import React from "react";
import { Calendar, MapPin, Clock, ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const categoryLabels = {
  GLOBAL_MEET: { label: "Global Meet", color: "bg-bit-50 text-bit-700 border-bit-200" },
  DEPARTMENT_REUNION: { label: "Department / Batch Meet", color: "bg-gold-50 text-gold-800 border-gold-200" },
  CHAPTER_MEET: { label: "Chapter Meet", color: "bg-blue-50 text-blue-700 border-blue-200" },
  SPORTS_MEET: { label: "Sports Carnival", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
};

const EventCard = ({ event }) => {
  const cat = categoryLabels[event.category] || { label: "Alumni Event", color: "bg-slate-100 text-slate-700 border-slate-200" };
  const isUpcoming = event.status === "Upcoming";

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1">
      {/* Event Header Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          onError={(e) => {
            e.currentTarget.src = "https://www.bitsathy.ac.in/wp-content/uploads/alumni_image-1.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Category & Status badge */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${cat.color} shadow-sm`}>
            {cat.label}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isUpcoming ? "bg-emerald-500/90 text-white shadow-sm" : "bg-slate-700/80 text-slate-200"
          }`}>
            {event.status}
          </span>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1 group-hover:text-gold-300 transition-colors">
            {event.title}
          </h3>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-bit-600 shrink-0" />
            <span className="font-semibold text-slate-900">{event.date}</span>
            {event.time && <span className="text-slate-400">• {event.time}</span>}
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-600">
            <MapPin className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{event.location}</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 pt-1">
            {event.description}
          </p>
        </div>

        {/* Action Bottom */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {event.mode}
          </span>

          {isUpcoming ? (
            <Link
              to={event.registrationLink || "/register"}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-bit-700 hover:text-bit-900 bg-bit-50 hover:bg-bit-100 px-3 py-1.5 rounded-lg transition-colors group/btn"
            >
              <span>RSVP / Register</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </Link>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Event Concluded</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
