import React, { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Calendar, Tag } from "lucide-react";

const GalleryLightbox = ({ images, currentIndex, isOpen, onClose, onPrev, onNext }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 sm:p-6 transition-all duration-300">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 shadow-lg"
        aria-label="Close Gallery"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev button */}
      <button
        onClick={onPrev}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 shadow-lg disabled:opacity-30"
        aria-label="Previous Image"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Next button */}
      <button
        onClick={onNext}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 shadow-lg disabled:opacity-30"
        aria-label="Next Image"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Content Area */}
      <div className="max-w-5xl w-full flex flex-col items-center justify-center space-y-4">
        <div className="relative max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/40 shadow-2xl border border-white/10">
          <img
            src={currentImage.image}
            alt={currentImage.title}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl select-none"
            onError={(e) => {
              e.currentTarget.src = "https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_1.jpg";
            }}
          />
        </div>

        {/* Caption & Metadata */}
        <div className="w-full text-center space-y-1.5 px-4">
          <div className="flex items-center justify-center gap-3 text-xs text-gold-400 font-semibold">
            {currentImage.year && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {currentImage.year}
              </span>
            )}
            <span className="text-slate-500">•</span>
            <span>
              Photo {currentIndex + 1} of {images.length}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {currentImage.title}
          </h3>

          {currentImage.caption && (
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {currentImage.caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryLightbox;
