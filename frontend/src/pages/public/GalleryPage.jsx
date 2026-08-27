import React, { useState } from "react";
import { Image, Maximize2, Sparkles, Filter, Calendar } from "lucide-react";
import SectionHeader from "../../components/community/SectionHeader";
import GalleryLightbox from "../../components/community/GalleryLightbox";
import { photoGallery } from "../../data/alumniData";

const galleryCategories = [
  { id: "ALL", label: "All Memories" },
  { id: "GLOBAL_MEETS", label: "Global Meets" },
  { id: "CAMPUS_REUNIONS", label: "Campus Reunions" },
  { id: "INTERNATIONAL_CHAPTERS", label: "International Chapters" },
  { id: "REGIONAL_CHAPTERS", label: "Regional Chapters" },
  { id: "SPORTS_MEETS", label: "Sports Carnivals" }
];

const GalleryPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredPhotos = photoGallery.filter(
    (photo) => selectedCategory === "ALL" || photo.category === selectedCategory
  );

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredPhotos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < filteredPhotos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-bit-950 via-bit-900 to-slate-900 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bit-800/80 border border-gold-500/30 text-gold-300 text-xs font-semibold">
            <Image className="w-3.5 h-3.5 text-gold-400" />
            <span>Alumni Photo Gallery</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Memories, Reconnects & <span className="text-gold-400">Celebrations</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Visual highlights capturing three decades of alumni homecomings, global chapter gatherings, sports trophies, and campus moments.
          </p>
        </div>
      </section>

      {/* Main Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {galleryCategories.map((cat) => (
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

        {/* Image Masonry/Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => openLightbox(idx)}
              className="group relative h-72 rounded-2xl overflow-hidden cursor-pointer bg-slate-900 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={photo.image}
                alt={photo.title}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                onError={(e) => {
                  e.currentTarget.src = "https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_1.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              {/* Top metadata */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center">
                  <Maximize2 className="w-4 h-4" />
                </span>
              </div>

              {/* Bottom Caption */}
              <div className="absolute bottom-3 left-4 right-4 text-white space-y-1">
                {photo.year && (
                  <div className="flex items-center gap-1.5 text-xs text-gold-300 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{photo.year}</span>
                  </div>
                )}
                <h3 className="text-base font-bold leading-tight group-hover:text-gold-200 transition-colors">
                  {photo.title}
                </h3>
                {photo.caption && (
                  <p className="text-xs text-slate-300 line-clamp-1">
                    {photo.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fullscreen Lightbox Modal */}
      <GalleryLightbox
        images={filteredPhotos}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
};

export default GalleryPage;
