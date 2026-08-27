import React, { useState } from "react";
import { BookOpen, Search, Download, FileText, Sparkles } from "lucide-react";
import SectionHeader from "../../components/community/SectionHeader";
import NewsletterCard from "../../components/community/NewsletterCard";
import { alumniNewsletters } from "../../data/alumniData";

const availableYears = ["ALL", "2026", "2025", "2024", "2023"];

const NewsletterPage = () => {
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNewsletters = alumniNewsletters.filter((item) => {
    const matchesYear = selectedYear === "ALL" || item.year === selectedYear;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-bit-950 via-bit-900 to-slate-900 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bit-800/80 border border-gold-500/30 text-gold-300 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-gold-400" />
            <span>Official AABIT Publications</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Alumni Newsletter <span className="text-gold-400">Archives</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Read and download biannual editions of the Bannari Amman Institute of Technology Alumni Association Newsletter covering research achievements, batch reunions, and institutional milestones.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  selectedYear === year
                    ? "bg-bit-800 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {year === "ALL" ? "All Volumes" : `Edition ${year}`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-bit-700/20 focus:border-bit-700 shadow-sm"
            />
          </div>
        </div>

        {/* Newsletters Grid */}
        {filteredNewsletters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNewsletters.map((newsletter) => (
              <NewsletterCard key={newsletter.id} newsletter={newsletter} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No newsletters found</h3>
            <p className="text-xs text-slate-500 mt-1">Try selecting a different edition or clearing your search.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default NewsletterPage;
