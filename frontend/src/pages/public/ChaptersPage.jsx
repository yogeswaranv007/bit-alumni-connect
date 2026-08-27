import React, { useState } from "react";
import { Globe, MapPin, Search, Sparkles } from "lucide-react";
import SectionHeader from "../../components/community/SectionHeader";
import ChapterCard from "../../components/community/ChapterCard";
import { alumniChapters, alumniStatistics } from "../../data/alumniData";

const categories = [
  { id: "ALL", label: "All Chapters" },
  { id: "INTERNATIONAL", label: "International Chapters" },
  { id: "NATIONAL", label: "National Chapters" },
  { id: "STATE", label: "State & Regional Chapters" }
];

const ChaptersPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChapters = alumniChapters.filter((chap) => {
    const matchesCategory =
      selectedCategory === "ALL" || chap.category === selectedCategory;
    const matchesSearch =
      chap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chap.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chap.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-bit-950 via-bit-900 to-slate-900 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bit-800/80 border border-gold-500/30 text-gold-300 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-gold-400" />
            <span>Global Alumni Footprint</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            BIT Alumni <span className="text-gold-400">Chapters Worldwide</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Spanning 15 regional, national, and international chapters, our alumni chapters organize local meetups, host technical conclaves, and provide homecoming networks across continents.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-6 text-xs text-slate-300 font-semibold">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-gold-400"></span>
              <span>4 International Chapters (Germany, UK, Singapore, UAE)</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>3 National Chapters (Mumbai, Hyderabad, Bangalore)</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>5 State Chapters (Parent, Chennai, Karur, CBE, Salem)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Filter & Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters and Search bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? "bg-bit-800 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by city, country or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-bit-700/20 focus:border-bit-700 shadow-sm"
            />
          </div>
        </div>

        {/* Chapters Grid */}
        {filteredChapters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChapters.map((chap) => (
              <ChapterCard key={chap.id} chapter={chap} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No chapters found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or category filter.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ChaptersPage;
