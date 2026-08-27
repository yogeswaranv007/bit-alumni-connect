import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const SectionHeader = ({
  eyebrow,
  title,
  highlight,
  description,
  actionText,
  actionLink,
  centered = false,
  className = ""
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 ${
        centered ? "text-center md:text-center items-center" : ""
      } ${className}`}
    >
      <div className={`max-w-3xl ${centered ? "mx-auto" : ""}`}>
        {eyebrow && (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bit-50 text-bit-700 border border-bit-200 text-xs font-semibold uppercase tracking-wider mb-3 ${centered ? "mx-auto" : ""}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse"></span>
            {eyebrow}
          </div>
        )}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {title} {highlight && <span className="bg-gradient-to-r from-bit-700 via-bit-800 to-gold-600 bg-clip-text text-transparent">{highlight}</span>}
        </h2>
        {description && (
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionText && actionLink && (
        <div className="shrink-0">
          <Link
            to={actionLink}
            className="inline-flex items-center gap-2 font-semibold text-bit-700 hover:text-bit-900 bg-bit-50 hover:bg-bit-100 border border-bit-200 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow group"
          >
            <span>{actionText}</span>
            <ArrowRight className="w-4 h-4 text-gold-600 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
