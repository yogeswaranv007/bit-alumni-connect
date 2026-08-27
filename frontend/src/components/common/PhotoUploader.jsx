import React, { useRef, useState } from 'react';
import { Upload, Camera, X, Image as ImageIcon, CheckCircle, AlertCircle, Link2 } from 'lucide-react';

export const PhotoUploader = ({
  photoUrl,
  onPhotoChange,
  disabled = false,
  isLocked = false,
  lockedMessage = 'Profile photo is locked after admin approval of your Digital Alumni ID.',
  onRequestChange,
}) => {
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format & size (max 3MB)
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('Image file is too large. Please select a photo smaller than 3MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      onPhotoChange(reader.result);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (disabled || isLocked) return;
    onPhotoChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLocked) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-3">
        <div className="flex items-center space-x-4">
          <div className="relative w-16 h-20 rounded-xl bg-slate-100 border-2 border-white shadow-md overflow-hidden flex-shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt="Official Photo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
            <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center pointer-events-none">
              <span className="bg-amber-600 text-white text-[8px] font-black uppercase px-1 py-0.5 rounded shadow">
                LOCKED
              </span>
            </div>
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
              <span>🔒 Official Photo Locked</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              {lockedMessage}
            </p>
            {onRequestChange && (
              <button
                type="button"
                onClick={onRequestChange}
                className="inline-flex items-center space-x-1 text-xs font-bold text-bit-700 hover:text-bit-800 underline mt-1"
              >
                <span>Request photo change from admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Passport Size Profile Photo *
        </label>
        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-[11px] font-semibold text-bit-700 hover:text-bit-800 flex items-center space-x-1"
        >
          <Link2 className="w-3 h-3" />
          <span>{isUrlMode ? 'Switch to File Upload' : 'Use Photo URL'}</span>
        </button>
      </div>

      {isUrlMode ? (
        <div className="flex items-center space-x-3">
          <input
            type="url"
            placeholder="https://example.com/passport-photo.jpg"
            value={photoUrl || ''}
            onChange={(e) => onPhotoChange(e.target.value)}
            disabled={disabled}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-bit-500/20 focus:border-bit-600"
          />
          {photoUrl && (
            <div className="w-10 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
              <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      ) : (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            disabled={disabled}
          />

          <div
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`relative p-4 rounded-2xl border-2 border-dashed transition flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer ${
              photoUrl
                ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center space-x-4">
              <div className="relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Uploaded Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div className="space-y-0.5 text-left">
                <span className="block text-xs font-bold text-slate-800">
                  {photoUrl ? '✓ Photo selected' : 'Upload Passport Photo'}
                </span>
                <p className="text-[11px] text-slate-500">
                  {photoUrl
                    ? 'Click to change photo from device'
                    : 'Click or drag a clear front-facing portrait (JPG, PNG max 3MB)'}
                </p>
                <span className="inline-block text-[10px] font-semibold text-bit-700 bg-bit-50 px-2 py-0.5 rounded-md mt-1">
                  Appears on official Digital Alumni ID
                </span>
              </div>
            </div>

            {photoUrl && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 shadow-xs transition"
                title="Remove Photo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="text-[11px] text-rose-600 font-semibold flex items-center space-x-1 pt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
