import React from "react";
import { BookOpen, Download, Calendar, ExternalLink, FileText } from "lucide-react";

const NewsletterCard = ({ newsletter }) => {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1">
      {/* Cover Header */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
        <img
          src={newsletter.coverImage}
          alt={newsletter.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

        {/* Volume badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-bit-900/80 text-gold-300 backdrop-blur-md border border-gold-500/30">
            <FileText className="w-3 h-3" />
            {newsletter.volume}
          </span>
        </div>

        {/* Title */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-md">
            {newsletter.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-gold-400" />
            <span>{newsletter.period}</span>
          </div>
        </div>
      </div>

      {/* Body & Actions */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          {newsletter.description}
        </p>

        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          {newsletter.pdfUrl ? (
            <>
              <a
                href={newsletter.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-bit-800 hover:bg-bit-900 rounded-xl transition-colors shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5 text-gold-400" />
                <span>Read Online</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <a
                href={newsletter.pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
                title="Download Official PDF"
              >
                <Download className="w-4 h-4 text-slate-600" />
              </a>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">Digital Archive in Library</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterCard;
