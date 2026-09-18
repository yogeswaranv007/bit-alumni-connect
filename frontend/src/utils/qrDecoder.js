import jsQR from 'jsqr';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  GlobalHistogramBinarizer
} from '@zxing/library';

/**
 * Ultra-robust multi-engine QR Code reader that handles:
 * - Phone photos of computer screens (moire, scanlines, glare, perspective)
 * - Screenshots and compressed images
 * - Embedded QR codes inside large documents / cards / partial views
 * - Inverted colors and low-contrast images
 */
export async function decodeQrFromImage(imageSource) {
  let img;
  if (typeof imageSource === 'string') {
    img = await loadImage(imageSource);
  } else if (imageSource instanceof HTMLImageElement) {
    img = imageSource;
  } else if (imageSource instanceof HTMLVideoElement || imageSource instanceof HTMLCanvasElement) {
    const canvas = document.createElement('canvas');
    canvas.width = imageSource.videoWidth || imageSource.width;
    canvas.height = imageSource.videoHeight || imageSource.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);
    return decodeQrFromCanvas(canvas);
  } else {
    throw new Error('Unsupported image source type');
  }

  // Engine 1: Native Hardware BarcodeDetector (Chrome, Edge, Chromium Android/Desktop)
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const barcodes = await detector.detect(img);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue.trim();
      }
    } catch (e) {
      console.debug('BarcodeDetector pass skipped or failed:', e);
    }
  }

  // Create canvas for multi-scale / multi-pass processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Define candidate crops and scale factors
  // Phone photos often have the QR in top half (gate pass) or bottom-left (ID card) or center
  const cropRegions = [
    { name: 'full', x: 0, y: 0, w: 1.0, h: 1.0 },
    { name: 'top_center', x: 0.1, y: 0.05, w: 0.8, h: 0.6 },
    { name: 'center', x: 0.15, y: 0.15, w: 0.7, h: 0.7 },
    { name: 'bottom_left', x: 0.0, y: 0.3, w: 0.7, h: 0.7 },
    { name: 'top_half', x: 0, y: 0, w: 1.0, h: 0.55 },
    { name: 'bottom_half', x: 0, y: 0.45, w: 1.0, h: 0.55 },
  ];

  // Try multiple scales (downsampling large 12MP/4K camera photos makes QR features much easier to detect)
  const scales = [1.0, 0.5, 0.75, 0.35, 1.25, 0.25, 1.5];

  for (const crop of cropRegions) {
    const sx = Math.floor(img.naturalWidth * crop.x);
    const sy = Math.floor(img.naturalHeight * crop.y);
    const sw = Math.floor(img.naturalWidth * crop.w);
    const sh = Math.floor(img.naturalHeight * crop.h);

    for (const scale of scales) {
      const targetW = Math.max(64, Math.round(sw * scale));
      const targetH = Math.max(64, Math.round(sh * scale));

      canvas.width = targetW;
      canvas.height = targetH;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

      // Attempt 1: ZXing Hybrid Binarizer
      const zxingResult = tryZxing(canvas, ctx);
      if (zxingResult) return zxingResult;

      // Attempt 2: jsQR with raw image data
      const imageData = ctx.getImageData(0, 0, targetW, targetH);
      const jsqrResult = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });
      if (jsqrResult && jsqrResult.data && jsqrResult.data.trim()) {
        return jsqrResult.data.trim();
      }

      // Attempt 3: Enhanced Contrast & Grayscale Preprocessing (eliminates screen moire and glare)
      if (scale === 1.0 || scale === 0.5 || scale === 0.75) {
        const enhancedData = applyContrastAndBinarization(imageData);
        const jsqrEnhanced = jsQR(enhancedData.data, enhancedData.width, enhancedData.height, {
          inversionAttempts: 'attemptBoth'
        });
        if (jsqrEnhanced && jsqrEnhanced.data && jsqrEnhanced.data.trim()) {
          return jsqrEnhanced.data.trim();
        }
      }
    }
  }

  return null;
}

function tryZxing(canvas, ctx) {
  try {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    reader.setHints(hints);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const len = imageData.data.length;
    const luminancesUint8Array = new Uint8ClampedArray(len / 4);

    for (let i = 0; i < len; i += 4) {
      // Standard RGB to Luminance
      luminancesUint8Array[i / 4] = ((imageData.data[i] * 306 + imageData.data[i + 1] * 601 + imageData.data[i + 2] * 117) >> 10);
    }

    const lumSource = new RGBLuminanceSource(luminancesUint8Array, canvas.width, canvas.height);

    // Try HybridBinarizer
    try {
      const bitmap = new BinaryBitmap(new HybridBinarizer(lumSource));
      const res = reader.decode(bitmap);
      if (res && res.getText()) return res.getText().trim();
    } catch {
      // try next
    }

    // Try GlobalHistogramBinarizer
    try {
      const bitmap2 = new BinaryBitmap(new GlobalHistogramBinarizer(lumSource));
      const res2 = reader.decode(bitmap2);
      if (res2 && res2.getText()) return res2.getText().trim();
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
  return null;
}

function applyContrastAndBinarization(imageData) {
  const data = new Uint8ClampedArray(imageData.data);
  const len = data.length;

  let min = 255;
  let max = 0;

  // Step 1: Find min and max luminance
  for (let i = 0; i < len; i += 4) {
    const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    if (gray < min) min = gray;
    if (gray > max) max = gray;
  }

  const range = max - min || 1;

  // Step 2: Stretch histogram for maximal contrast between black and white QR modules
  for (let i = 0; i < len; i += 4) {
    const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    const normalized = Math.min(255, Math.max(0, ((gray - min) / range) * 255));
    // High contrast thresholding curve
    const contrastVal = normalized > 128 ? Math.min(255, normalized * 1.2) : Math.max(0, normalized * 0.8);
    data[i] = contrastVal;
    data[i + 1] = contrastVal;
    data[i + 2] = contrastVal;
  }

  return new ImageData(data, imageData.width, imageData.height);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}
