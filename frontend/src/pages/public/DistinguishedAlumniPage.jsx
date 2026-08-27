import React, { useState } from "react";
import { Award, Search, Sparkles, Star } from "lucide-react";
import SectionHeader from "../../components/community/SectionHeader";
import DistinguishedAlumnusCard from "../../components/community/DistinguishedAlumnusCard";
import { distinguishedAlumni } from "../../data/alumniData";

const categories = [
  { id: "ALL", label: "All Luminaries" },
  { id: "CIVIL_SERVICES", label: "Civil Services & Governance" },
  { id: "DEFENSE", label: "Defense & Armed Forces" },
  { id: "RESEARCH_SCIENCE", label: "Research & Space Science" },
  { id: "CORPORATE_LEADERS", label: "Corporate Leaders" },
  { id: "ENTREPRENEURS", label: "Entrepreneurs & Founders" }
];

const DistinguishedAlumniPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlumni = distinguishedAlumni.filter((alum) => {
    const matchesCat =
      selectedCategory === "ALL" || alum.category === selectedCategory;
    const matchesSearch =
      alum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.achievement.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-bit-950 via-bit-900 to-slate-900 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bit-800/80 border border-gold-500/30 text-gold-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-gold-400" />
            <span>Alumni Hall of Fame</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Distinguished <span className="text-gold-400">BIT Alumni</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Celebrating alumni who have achieved exceptional distinction in public administration, aerospace science, armed forces, global enterprises, and entrepreneurship.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
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
              placeholder="Search by name, organization or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-bit-700/20 focus:border-bit-700 shadow-sm"
            />
          </div>
        </div>

        {/* Cards Grid */}
        {filteredAlumni.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlumni.map((alum) => (
              <DistinguishedAlumnusCard key={alum.id} alumnus={alum} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No alumni found</h3>
            <p className="text-xs text-slate-500 mt-1">Try another category or search filter.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DistinguishedAlumniPage;
