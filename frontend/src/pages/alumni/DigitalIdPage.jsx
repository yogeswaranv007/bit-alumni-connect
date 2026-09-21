import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { virtualIdApi } from '../../api/virtualIdApi';
import { DigitalIdCard } from '../../components/idcard/DigitalIdCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  CreditCard,
  ShieldCheck,
  QrCode,
  ExternalLink,
  Printer,
  Download,
  FileText,
  Image as ImageIcon,
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Layers
} from 'lucide-react';

export const DigitalIdPage = () => {
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState('');
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

  const fetchCard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await virtualIdApi.getMyVirtualId();
      if (res.data) {
        setCardData(res.data);
      }
    } catch (err) {
      setError(
        err.message || 'Virtual Alumni ID is not available. Please ensure your profile is verified.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, []);

  // Download ID as High-Resolution Image (PNG)
  const handleDownloadImage = async (mode = 'both') => {
    setDownloading(true);
    setDownloadType(`image-${mode}`);
    setIsDownloadMenuOpen(false);
    setNotification('');

    try {
      let targetElement;
      let filename = `BIT_Alumni_ID_${cardData?.alumniIdCardNumber || 'Badge'}`;

      if (mode === 'front') {
        targetElement = document.getElementById('bit-id-card-front-export');
        filename += '_Front.png';
      } else if (mode === 'back') {
        targetElement = document.getElementById('bit-id-card-back-export');
        filename += '_Back.png';
      } else {
        targetElement = document.getElementById('bit-id-printable-stage');
        filename += '_FullCard.png';
      }

      if (!targetElement) {
        throw new Error('ID card element not found for image rendering.');
      }

      const canvas = await html2canvas(targetElement, {
        scale: 3, // 300+ DPI equivalent crisp rendering
        useCORS: true,
        allowTaint: true,
        backgroundColor: mode === 'both' ? '#ffffff' : null,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setNotification(`Downloaded Alumni ID card as high-resolution PNG image (${mode === 'both' ? 'Front & Back' : mode} side).`);
    } catch (err) {
      console.error('Failed to export ID image:', err);
      alert('Failed to download image. Please try again.');
    } finally {
      setDownloading(false);
      setDownloadType('');
    }
  };

  // Download ID as Printable Vector-Framed PDF (A4 / CR80 standard)
  const handleDownloadPdf = async () => {
    setDownloading(true);
    setDownloadType('pdf');
    setIsDownloadMenuOpen(false);
    setNotification('');

    try {
      const frontEl = document.getElementById('bit-id-card-front-export');
      const backEl = document.getElementById('bit-id-card-back-export');

      if (!frontEl || !backEl) {
        throw new Error('ID card elements not found for PDF compilation.');
      }

      // Render front and back at 3x scale
      const [frontCanvas, backCanvas] = await Promise.all([
        html2canvas(frontEl, { scale: 3, useCORS: true, allowTaint: true, logging: false }),
        html2canvas(backEl, { scale: 3, useCORS: true, allowTaint: true, logging: false }),
      ]);

      const frontImgData = frontCanvas.toDataURL('image/png');
      const backImgData = backCanvas.toDataURL('image/png');

      // Create PDF in Portrait A4 format
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Top Institutional Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('BANNARI AMMAN INSTITUTE OF TECHNOLOGY', pageWidth / 2, 20, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text('Official Digital Alumni Identification Document', pageWidth / 2, 26, { align: 'center' });

      // Divider Line
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.setLineWidth(0.5);
      pdf.line(20, 30, pageWidth - 20, 30);

      // Metadata Banner
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(235, 83, 35); // #EB5323 BIT orange
      pdf.text(`ALUMNUS: ${(cardData.fullName || 'ALUMNUS').toUpperCase()}`, 20, 37);
      pdf.setTextColor(0, 106, 56); // #006A38 BIT green
      pdf.text(`PERMANENT ALUMNI ID: ${cardData.alumniIdCardNumber || 'BIT-ALU-ACTIVE'}`, pageWidth - 20, 37, { align: 'right' });

      // Card Dimensions on PDF (Standard CR80 size aspect ratio ~54mm x 85.6mm, scaled to 60mm x 94mm for easy cut/fold)
      const cardWidth = 75;
      const cardHeight = 118;
      const startY = 46;

      // Front Card Position (Left Side)
      const frontX = (pageWidth / 2) - cardWidth - 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('FRONT SIDE', frontX + (cardWidth / 2), startY - 3, { align: 'center' });
      pdf.addImage(frontImgData, 'PNG', frontX, startY, cardWidth, cardHeight);

      // Back Card Position (Right Side)
      const backX = (pageWidth / 2) + 10;
      pdf.text('BACK SIDE', backX + (cardWidth / 2), startY - 3, { align: 'center' });
      pdf.addImage(backImgData, 'PNG', backX, startY, cardWidth, cardHeight);

      // Bottom Security Verification Instructions
      const bottomY = startY + cardHeight + 15;
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.roundedRect(20, bottomY, pageWidth - 40, 48, 3, 3, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Security Verification & Validation Policy', 26, bottomY + 8);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      const instructionText = [
        '1. This digital credential is the official property of Bannari Amman Institute of Technology Alumni Association.',
        '2. The dynamic QR code embeds an authorized zero-PII cryptographic token verifiable at any campus security gate.',
        '3. For gate entry authorization, visit passes must be approved through the BIT Connect portal for the date of visit.',
        '4. Verification Endpoint: ' + (cardData.verificationUrl || 'https://bitsathy.ac.in/alumni/verify'),
      ];
      instructionText.forEach((line, index) => {
        pdf.text(line, 26, bottomY + 16 + (index * 6));
      });

      // Footer
      pdf.setFontSize(7.5);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Generated on ${new Date().toLocaleDateString()} via BIT Connect • Document ID: ${cardData.id}`, pageWidth / 2, pageHeight - 12, { align: 'center' });

      // Save PDF
      pdf.save(`BIT_Alumni_ID_${cardData.alumniIdCardNumber || 'Card'}.pdf`);
      setNotification('Official BIT Alumni ID Card PDF generated and downloaded successfully.');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
      setDownloadType('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Rendering your Official BIT Digital Alumni ID..." />;
  }

  if (error || !cardData) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <CreditCard className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Digital ID Not Yet Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {error || 'Your profile is currently under review by college administrators. Once approved, your official BIT Virtual Alumni ID and secure dynamic QR code will appear here automatically.'}
        </p>
        <Link
          to="/alumni/dashboard"
          className="inline-block px-6 py-2.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white font-bold text-xs shadow-md transition"
        >
          Check Status on Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header Banner with Download & Print Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#EB5323] flex items-center justify-center font-bold flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Official BIT Alumni ID Card
            </h1>
            <p className="text-xs text-slate-500">
              Interactive 3D digital identity badge • Permanent ID: <strong className="font-mono text-amber-800">{cardData.alumniIdCardNumber}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls: Download PDF, Download Image, Print Badge */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto relative">
          {/* Download Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              disabled={downloading}
              onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-bit-700 hover:bg-bit-800 text-white text-xs font-bold transition shadow-sm shadow-bit-700/20 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Exporting...' : 'Download ID'}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {isDownloadMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1 animate-in fade-in">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition text-left cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <div>
                    <p>Download as PDF</p>
                    <p className="text-[10px] text-slate-400 font-normal">A4 Printable Card Sheet</p>
                  </div>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => handleDownloadImage('both')}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition text-left cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-bit-700" />
                  <div>
                    <p>Download Image (Both Sides)</p>
                    <p className="text-[10px] text-slate-400 font-normal">High-Resolution PNG</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadImage('front')}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-semibold transition text-left cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>Front Side Only (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadImage('back')}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-semibold transition text-left cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Back Side Only (PNG)</span>
                </button>
              </div>
            )}
          </div>

          {/* Clean Card Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
            title="Print only the ID Card cleanly"
          >
            <Printer className="w-4 h-4" />
            <span>Print Badge</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* 3D Flippable Card Stage */}
      <div className="bg-gradient-to-b from-slate-100 to-slate-200/70 rounded-3xl p-6 sm:p-12 border border-slate-200 flex flex-col items-center justify-center shadow-inner space-y-4">
        {/* Front / Back Side View Toggle Tabs */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 border border-slate-300 shadow-inner">
          <button
            onClick={() => setIsFlipped(false)}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              !isFlipped
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Front Side (Identity & Photo)
          </button>
          <button
            onClick={() => setIsFlipped(true)}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              isFlipped
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Back Side (Personal & Association)
          </button>
        </div>

        {/* 3D Card */}
        <DigitalIdCard
          cardData={cardData}
          isFlipped={isFlipped}
          onFlipChange={setIsFlipped}
        />

        <p className="text-[11px] text-slate-500 font-medium text-center">
          💡 Click or tap the card anywhere to flip between Front and Back sides.
        </p>
      </div>

      {/* Security & Verification Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Link Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-bit-700">
              <QrCode className="w-4 h-4" />
              <span>Public Verification Endpoint</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When security staff or attendees scan the official QR code on the card, they are directed to the secure BIT registry verification page confirming your official verified alumnus status.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={`/verify/${cardData.activeToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-bit-700 hover:text-bit-800"
            >
              <span>Test Public Verification Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security Info Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span>Permanent & Stable Identity Verification</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your QR code embeds a tamper-proof cryptographic token tied to your official permanent Alumni ID (<strong className="font-mono text-emerald-950">{cardData.alumniIdCardNumber}</strong>) for stable and consistent verification. QR code modifications are exclusively governed by college administrators.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DigitalIdPage;
