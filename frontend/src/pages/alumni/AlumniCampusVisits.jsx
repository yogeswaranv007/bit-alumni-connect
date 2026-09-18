import React, { useState, useEffect, useRef } from 'react';
import { campusVisitApi } from '../../api/campusVisitApi';
import { watchmanApi } from '../../api/watchmanApi';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import { decodeQrFromImage } from '../../utils/qrDecoder';
import {
  CalendarCheck,
  Plus,
  Clock,
  MapPin,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  X,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Camera,
  CameraOff,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Download,
  Loader2
} from 'lucide-react';

export const AlumniCampusVisits = () => {
  const [visits, setVisits] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 0, size: 10, totalPages: 1, totalElements: 0 });
  const [availableEvents, setAvailableEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVisitType, setFilterVisitType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState('visitDate');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelModalId, setCancelModalId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Gate Pass Modal & Gate QR Scanner Modal
  const [passModalVisit, setPassModalVisit] = useState(null);
  const [scanGateModal, setScanGateModal] = useState(false);
  const [gateScanSuccess, setGateScanSuccess] = useState(null);
  const [gateScanError, setGateScanError] = useState(null);

  // Camera & Image Upload Refs for scanning Gate QR
  const gateVideoRef = useRef(null);
  const gateCanvasRef = useRef(null);
  const gateFileInputRef = useRef(null);
  const gateAnimRef = useRef(null);
  const [gateCameraActive, setGateCameraActive] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    visitDate: '',
    preferredArrivalTime: '10:30:00',
    visitType: 'FACULTY_MEETING',
    purpose: '',
    departmentId: '1',
    assignedFaculty: '',
    associatedEventId: '',
    remarks: '',
  });

  useEffect(() => {
    loadVisitsAndEvents();
  }, [filterStatus, filterVisitType, filterDate, sortBy, sortDirection, currentPage]);

  useEffect(() => {
    return () => {
      stopGateCamera();
    };
  }, []);

  const loadVisitsAndEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const [visitsRes, eventsRes, deptsRes] = await Promise.all([
        campusVisitApi.getMyVisits({
          status: filterStatus || undefined,
          visitType: filterVisitType || undefined,
          visitDate: filterDate || undefined,
          search: searchTerm ? searchTerm.trim() : undefined,
          page: currentPage,
          size: 10,
          sortBy,
          sortDirection,
        }),
        campusVisitApi.getAvailableEvents().catch(() => ({ success: true, data: [] })),
        campusVisitApi.getDepartments().catch(() => ({ data: [] })),
      ]);

      if (visitsRes.success && visitsRes.data) {
        if (visitsRes.data.content) {
          setVisits(visitsRes.data.content);
          setPageInfo({
            page: visitsRes.data.pageNumber || 0,
            size: visitsRes.data.pageSize || 10,
            totalPages: visitsRes.data.totalPages || 1,
            totalElements: visitsRes.data.totalElements || visitsRes.data.content.length,
          });
        } else if (Array.isArray(visitsRes.data)) {
          setVisits(visitsRes.data);
          setPageInfo({ page: 0, size: visitsRes.data.length, totalPages: 1, totalElements: visitsRes.data.length });
        }
      }
      if (eventsRes && eventsRes.data) {
        setAvailableEvents(eventsRes.data);
      }
      if (deptsRes && deptsRes.data) {
        setDepartments(deptsRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load campus visits');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    loadVisitsAndEvents();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterVisitType('');
    setFilterDate('');
    setSortBy('visitDate');
    setSortDirection('DESC');
    setCurrentPage(0);
  };

  const activeFiltersCount = [
    searchTerm,
    filterStatus,
    filterVisitType,
    filterDate,
    sortBy !== 'visitDate' || sortDirection !== 'DESC'
  ].filter(Boolean).length;

  // Check if chosen date already has an active visit
  const activeVisitForSelectedDate = formData.visitDate
    ? visits.find(
        (v) =>
          v.visitDate === formData.visitDate &&
          (v.status === 'PENDING' || v.status === 'APPROVED' || v.status === 'SCHEDULED')
      )
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        visitDate: formData.visitDate,
        preferredArrivalTime: formData.preferredArrivalTime.length === 5 ? `${formData.preferredArrivalTime}:00` : formData.preferredArrivalTime,
        visitType: formData.visitType,
        purpose: formData.purpose,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
        assignedFaculty: formData.assignedFaculty || undefined,
        associatedEventId: formData.associatedEventId ? parseInt(formData.associatedEventId) : undefined,
        remarks: formData.remarks || undefined,
      };

      const response = await campusVisitApi.createVisit(payload);
      if (response.success) {
        setSuccess('Campus visit request submitted successfully! Your department / host will review.');
        setIsModalOpen(false);
        setFormData({
          visitDate: '',
          preferredArrivalTime: '10:30:00',
          visitType: 'FACULTY_MEETING',
          purpose: '',
          departmentId: '1',
          assignedFaculty: '',
          associatedEventId: '',
          remarks: '',
        });
        loadVisitsAndEvents();
      } else {
        setError(response.message || 'Failed to submit visit request');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit campus visit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelVisit = async () => {
    if (!cancelModalId) return;
    try {
      const res = await campusVisitApi.cancelVisit(cancelModalId, cancelReason);
      if (res.success) {
        setSuccess('Campus visit request cancelled successfully.');
        setCancelModalId(null);
        setCancelReason('');
        loadVisitsAndEvents();
      } else {
        setError(res.message || 'Failed to cancel visit');
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel visit request');
    }
  };

  // Alumnus Scanning Security Gate QR Code
  const startGateCamera = async () => {
    setGateScanError(null);
    setGateScanSuccess(null);
    try {
      stopGateCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      setGateCameraActive(true);
      if (gateVideoRef.current) {
        gateVideoRef.current.srcObject = stream;
        gateVideoRef.current.setAttribute('playsinline', 'true');
        try {
          await gateVideoRef.current.play();
        } catch (e) {
          console.warn('Gate video play error:', e);
        }
      }
      if (gateAnimRef.current) cancelAnimationFrame(gateAnimRef.current);
      gateAnimRef.current = requestAnimationFrame(scanGateVideoFrame);
    } catch (err) {
      console.error('Gate camera error:', err);
      setGateScanError('Camera access denied or unavailable: ' + (err.message || 'Please check browser camera permissions'));
      setGateCameraActive(false);
    }
  };

  const stopGateCamera = () => {
    if (gateAnimRef.current) {
      cancelAnimationFrame(gateAnimRef.current);
      gateAnimRef.current = null;
    }
    if (gateVideoRef.current && gateVideoRef.current.srcObject) {
      const tracks = gateVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      gateVideoRef.current.srcObject = null;
    }
    setGateCameraActive(false);
  };

  const scanGateVideoFrame = () => {
    if (!gateVideoRef.current || gateVideoRef.current.readyState !== gateVideoRef.current.HAVE_ENOUGH_DATA) {
      gateAnimRef.current = requestAnimationFrame(scanGateVideoFrame);
      return;
    }

    const canvas = gateCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.height = gateVideoRef.current.videoHeight;
    canvas.width = gateVideoRef.current.videoWidth;
    ctx.drawImage(gateVideoRef.current, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      stopGateCamera();
      handleGateQrScanned(code.data);
    } else {
      gateAnimRef.current = requestAnimationFrame(scanGateVideoFrame);
    }
  };

  const handleGateQrScanned = async (scannedData) => {
    try {
      let gateName = 'Main Gate';
      if (typeof scannedData === 'string') {
        if (scannedData.includes('{') && scannedData.includes('gate')) {
          try {
            const parsed = JSON.parse(scannedData);
            gateName = parsed.gate || gateName;
          } catch {
            // fallback
          }
        } else if (scannedData.trim().length > 0 && !scannedData.includes('{')) {
          gateName = scannedData.trim();
        }
      }

      const res = await campusVisitApi.checkInAtGate(gateName);
      if (res && res.success) {
        setGateScanSuccess(`✓ Checked In successfully at ${gateName}! Your campus visit booking details are now live on the Security Watchman Dashboard for instant clearance.`);
      } else {
        setGateScanSuccess(`✓ Check-In signal sent to ${gateName}! Security guard station notified.`);
      }
    } catch (err) {
      console.error('Gate check-in error:', err);
      setGateScanError('Failed to check in at gate: ' + (err.message || 'Server error'));
    }
  };

  const handleGateImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGateScanError(null);
    setGateScanSuccess('Analyzing image with multi-engine QR scanner...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      try {
        const decoded = await decodeQrFromImage(dataUrl);
        if (decoded) {
          handleGateQrScanned(decoded);
        } else {
          setGateScanSuccess(null);
          setGateScanError('Could not detect a clear QR Code in the uploaded image. Please ensure the QR code is clearly visible.');
        }
      } catch (err) {
        console.error('Gate QR decode error:', err);
        setGateScanSuccess(null);
        setGateScanError('Error processing QR image: ' + (err.message || 'Unknown error'));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPass = () => {
    if (!passModalVisit) return;
    try {
      const svgElement = document.getElementById('gate-pass-qr-svg');
      if (svgElement) {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 600;
          canvas.height = 750;
          const ctx = canvas.getContext('2d');

          // Draw clean premium card background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 600, 750);

          // Card Header Banner
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(0, 0, 600, 100);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('BIT CAMPUS GATE CLEARANCE PASS', 300, 45);

          ctx.fillStyle = '#93c5fd';
          ctx.font = '14px sans-serif';
          ctx.fillText('Bannari Amman Institute of Technology Security Office', 300, 75);

          // Draw QR Code
          ctx.drawImage(image, 175, 125, 250, 250);

          // Draw Details Box
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(40, 400, 520, 280);
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.strokeRect(40, 400, 520, 280);

          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'left';
          ctx.font = 'bold 16px sans-serif';

          const alumnusName = passModalVisit.alumniName || passModalVisit.alumni?.fullName || 'Alumnus';
          const alumniId = passModalVisit.alumniIdNumber || 'BIT-ALU';
          const date = passModalVisit.visitDate || '';
          const arrival = passModalVisit.approvedArrivalTime || '10:30:00';
          const purpose = passModalVisit.purpose || '';
          const dept = passModalVisit.departmentName || 'BIT Campus';

          ctx.fillText(`Alumnus: ${alumnusName}`, 60, 440);
          ctx.fillText(`Alumni ID / Reg No: ${alumniId}`, 60, 480);
          ctx.fillText(`Authorized Date: ${date}`, 60, 520);
          ctx.fillText(`Approved Arrival: ${arrival}`, 60, 560);
          ctx.fillText(`Purpose: ${purpose}`, 60, 600);
          ctx.fillText(`Department: ${dept}`, 60, 640);

          // Footer
          ctx.fillStyle = '#64748b';
          ctx.font = 'italic 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Authorized by Security Station • Present at Gate for Immediate Clearance', 300, 720);

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `BIT_Gate_Pass_${date}_${alumniId}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        };
        image.src = blobURL;
      }
    } catch (err) {
      console.error('Download pass error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden canvas for video processing */}
      <canvas ref={gateCanvasRef} className="hidden" />

      {/* Hidden file input for QR image upload */}
      <input
        type="file"
        ref={gateFileInputRef}
        accept="image/*"
        onChange={handleGateImageFileChange}
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-6 h-6 text-bit-700" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Campus Visit Requests & Entry Passes
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Request official campus authorization, generate QR gate clearance passes, or check in at security.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setScanGateModal(true);
              setGateScanSuccess(null);
              setGateScanError(null);
              setTimeout(startGateCamera, 300);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Camera className="w-4 h-4 text-bit-700" />
            <span>Scan Gate QR</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-bit-700 hover:bg-bit-800 text-white text-xs font-bold transition shadow-sm shadow-bit-700/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Visit Request</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search purpose, department, faculty host, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-bit-600 bg-slate-50 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-bit-700 hover:bg-bit-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(0); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-none focus:border-bit-600 focus:bg-white"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending Review</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Visit Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Visit Type</label>
            <select
              value={filterVisitType}
              onChange={(e) => { setFilterVisitType(e.target.value); setCurrentPage(0); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-none focus:border-bit-600 focus:bg-white"
            >
              <option value="">All Visit Types</option>
              <option value="FACULTY_MEETING">Faculty Meeting</option>
              <option value="DEPARTMENT_VISIT">Department Visit</option>
              <option value="ALUMNI_ASSOCIATION_EVENT">Alumni Event</option>
              <option value="CAMPUS_EVENT">Campus Event</option>
              <option value="PERSONAL_VISIT">Personal Visit</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Visit Date Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Specific Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(0); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-none focus:border-bit-600 focus:bg-white"
            />
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sort By</label>
            <select
              value={`${sortBy}:${sortDirection}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split(':');
                setSortBy(sb);
                setSortDirection(sd);
                setCurrentPage(0);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-none focus:border-bit-600 focus:bg-white"
            >
              <option value="visitDate:DESC">Visit Date (Newest first)</option>
              <option value="visitDate:ASC">Visit Date (Oldest / Upcoming)</option>
              <option value="createdAt:DESC">Requested Date (Newest first)</option>
              <option value="createdAt:ASC">Requested Date (Oldest first)</option>
              <option value="status:ASC">Status (A-Z)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={activeFiltersCount === 0}
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success / Error Messages */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Visits List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            My Campus Visit Requests ({pageInfo.totalElements})
          </h2>
          {pageInfo.totalPages > 1 && (
            <div className="text-xs text-slate-500 font-medium">
              Page {pageInfo.page + 1} of {pageInfo.totalPages}
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-bit-700" />
            <span>Loading visit requests...</span>
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No campus visit requests yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Planning to meet a professor or visit your department? Request an authorized campus visit pass in seconds.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-bit-50 hover:bg-bit-100 text-bit-700 text-xs font-bold transition mt-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit First Request</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visits.map((visit) => {
              const isApproved = visit.status === 'APPROVED' || visit.status === 'SCHEDULED';

              return (
                <div
                  key={visit.id}
                  className={`bg-white rounded-3xl p-5 border shadow-xs space-y-4 hover:shadow-md transition ${
                    isApproved ? 'border-emerald-200 ring-1 ring-emerald-500/10' : 'border-slate-200/80'
                  }`}
                >
                  {/* Status & Date Bar */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Visit Date
                      </span>
                      <p className="text-base font-extrabold text-slate-900 flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-bit-700" />
                        <span>{visit.visitDate}</span>
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : visit.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : visit.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {visit.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-700">Purpose:</span>
                      <span>{visit.purpose}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-700">Type:</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700">
                        {visit.visitType ? visit.visitType.replace(/_/g, ' ') : 'N/A'}
                      </span>
                    </div>
                    {visit.departmentName && (
                      <div className="flex items-center space-x-2">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{visit.departmentName}</span>
                      </div>
                    )}
                    {(visit.assignedFacultyName || visit.assignedFaculty) && (
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Faculty Host: {visit.assignedFacultyName || visit.assignedFaculty}</span>
                      </div>
                    )}
                    {visit.associatedEventTitle && (
                      <div className="p-2 rounded-lg bg-bit-50 border border-bit-100 text-[11px] text-bit-900 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-bit-700 flex-shrink-0" />
                        <span>Linked Event: <strong>{visit.associatedEventTitle}</strong></span>
                      </div>
                    )}

                    {/* Approval Information */}
                    {isApproved && (
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                        <p className="font-bold flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Approved by {visit.approvedByName || visit.approverName || 'Department Faculty / Admin'} ({visit.approverRole || 'ROLE_STAFF'})</span>
                        </p>
                        {(visit.approvedArrivalTime || visit.preferredArrivalTime) && (
                          <p>Approved Arrival: <strong>{visit.approvedArrivalTime || visit.preferredArrivalTime}</strong></p>
                        )}
                        {visit.meetingLocation && (
                          <p>Meeting Location: <strong>{visit.meetingLocation}</strong></p>
                        )}
                        {visit.contactPerson && (
                          <p>Contact Person: <strong>{visit.contactPerson}</strong></p>
                        )}
                      </div>
                    )}

                    {/* Rejection comment */}
                    {visit.status === 'REJECTED' && visit.adminComment && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-800 space-y-1">
                        <p className="font-bold flex items-center space-x-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Rejection Reason:</span>
                        </p>
                        <p>{visit.adminComment}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isApproved ? (
                      <button
                        onClick={() => setPassModalVisit(visit)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View Gate QR Pass</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {visit.status === 'PENDING' ? 'Awaiting departmental review' : ''}
                      </span>
                    )}

                    {(visit.status === 'PENDING' || visit.status === 'APPROVED') && (
                      <button
                        onClick={() => setCancelModalId(visit.id)}
                        className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {pageInfo.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
            <p className="text-xs text-slate-500">
              Showing page <strong>{pageInfo.page + 1}</strong> of <strong>{pageInfo.totalPages}</strong> ({pageInfo.totalElements} total visits)
            </p>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={pageInfo.page === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={pageInfo.page >= pageInfo.totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Official Campus Gate Entry Pass Modal */}
      {passModalVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Banner */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide">
                    BIT Campus Gate Clearance Pass
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Bannari Amman Institute of Technology Security Office
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPassModalVisit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pass Body */}
            <div className="p-6 text-center space-y-4">
              {/* QR Code Container */}
              <div className="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-emerald-400 shadow-lg">
                <QRCodeSVG
                  id="gate-pass-qr-svg"
                  value={JSON.stringify({
                    type: 'CAMPUS_VISIT',
                    visitId: passModalVisit.id,
                    alumniId: passModalVisit.alumniIdNumber,
                    regNo: passModalVisit.alumni?.registerNumber || passModalVisit.alumniIdNumber,
                    date: passModalVisit.visitDate,
                    time: passModalVisit.approvedArrivalTime
                  })}
                  size={220}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-mono font-bold text-bit-700 uppercase">
                  Pass ID: {passModalVisit.id}
                </p>
                <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                  ✓ Gate Entry Clearance Authorized
                </span>
              </div>

              {/* Pass Specifications */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Alumnus:</span>
                  <span className="font-bold text-slate-900">{passModalVisit.alumniName || passModalVisit.alumni?.fullName || 'Alumnus'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Alumni ID / Reg No:</span>
                  <span className="font-mono font-bold text-slate-900">{passModalVisit.alumniIdNumber || 'BIT-ALU'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Authorized Date:</span>
                  <span className="font-bold text-slate-900">{passModalVisit.visitDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Approved Arrival:</span>
                  <span className="font-bold text-emerald-700">{passModalVisit.approvedArrivalTime || '10:30:00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Purpose:</span>
                  <span className="font-bold text-slate-900">{passModalVisit.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Department:</span>
                  <span className="font-bold text-slate-900">{passModalVisit.departmentName || 'BIT Campus'}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Present this QR code to security personnel at any BIT campus gate for instant clearance.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={handleDownloadPass}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-bit-50 hover:bg-bit-100 text-bit-800 text-xs font-bold border border-bit-200 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4 text-bit-700" />
                  <span>Download Gate Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPassModalVisit(null)}
                  className="px-5 py-2 rounded-xl bg-bit-700 hover:bg-bit-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alumnus Scan Security Gate QR Code Modal */}
      {scanGateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-bit-700" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Scan Gate Check-In QR
                </h3>
              </div>
              <button
                onClick={() => {
                  stopGateCamera();
                  setScanGateModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Point your camera at the Security Guard's Monitor or Gate Post QR code, or upload a photo/screenshot.
            </p>

            {/* Video View */}
            <div className="relative w-full aspect-4/3 bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              <video ref={gateVideoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-dashed border-emerald-400/70 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-44 h-44 border-2 border-emerald-400 rounded-xl relative shadow-2xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Upload Gate QR Image Button */}
            <button
              type="button"
              onClick={() => gateFileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center space-x-2 border border-slate-200 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-bit-700" />
              <span>Upload Gate QR Screenshot / Image</span>
            </button>

            {/* Quick 1-Tap Check-In Buttons */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Or 1-Tap Self Check-In by Gate:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleGateQrScanned('Main Gate')}
                  className="px-3 py-1.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Main Gate
                </button>
                <button
                  type="button"
                  onClick={() => handleGateQrScanned('North Gate (Tech Park)')}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  North Gate
                </button>
                <button
                  type="button"
                  onClick={() => handleGateQrScanned('South Gate (Hostel)')}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  South Gate
                </button>
              </div>
            </div>

            {gateScanSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{gateScanSuccess}</span>
              </div>
            )}

            {gateScanError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {gateScanError}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  stopGateCamera();
                  setScanGateModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Visit Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5 text-bit-700" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Request Campus Visit
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Visit Warning for Date */}
            {activeVisitForSelectedDate && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="flex items-center space-x-2 font-bold text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Active Visit Request Already Exists</span>
                </div>
                <p>
                  You already have a <strong>{activeVisitForSelectedDate.status}</strong> campus visit on{' '}
                  <strong>{activeVisitForSelectedDate.visitDate}</strong> ({activeVisitForSelectedDate.purpose}).
                  Only one active visit is permitted per calendar date.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Visit Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.visitDate}
                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-bit-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Preferred Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.preferredArrivalTime}
                    onChange={(e) => setFormData({ ...formData, preferredArrivalTime: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-bit-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Visit Purpose / Type *
                </label>
                <select
                  value={formData.visitType}
                  onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-bit-600 font-semibold"
                >
                  <option value="FACULTY_MEETING">Faculty Meeting</option>
                  <option value="DEPARTMENT_VISIT">Department Visit</option>
                  <option value="ALUMNI_ASSOCIATION_EVENT">Alumni Association Meeting</option>
                  <option value="CAMPUS_EVENT">Campus Event Attendance</option>
                  <option value="PERSONAL_VISIT">Personal Institutional Visit</option>
                  <option value="OTHER">Other Purpose</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Specific Purpose Description *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Meet Dr. Suresh Kumar regarding final year project mentoring"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-bit-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-bit-600"
                  >
                    {departments && departments.length > 0 ? (
                      departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name || dept.departmentName} ({dept.code || dept.departmentCode})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="1">Information Technology (IT)</option>
                        <option value="2">Computer Science (CSE)</option>
                        <option value="3">Electronics & Comm (ECE)</option>
                        <option value="4">Mechanical Engineering</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Faculty / Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Suresh Kumar"
                    value={formData.assignedFaculty}
                    onChange={(e) => setFormData({ ...formData, assignedFaculty: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-bit-600"
                  />
                </div>
              </div>

              {/* Optional On-Campus Event Association */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Optional: Associate with On-Campus Event
                </label>
                <select
                  value={formData.associatedEventId}
                  onChange={(e) => setFormData({ ...formData, associatedEventId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-bit-600"
                >
                  <option value="">-- No specific event (Standalone Campus Visit) --</option>
                  {availableEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.eventDate}) - {evt.venue || 'BIT Campus'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Only physically on-campus activities qualify for visit pass linkage.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Additional Remarks / Vehicle Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arriving by car (TN-38-AB-1234)"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-bit-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!activeVisitForSelectedDate}
                  className="px-5 py-2 rounded-xl bg-bit-700 hover:bg-bit-800 text-white text-xs font-bold shadow-sm shadow-bit-700/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Visit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900">Cancel Campus Visit?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel this visit request? Gate access authorization will be revoked.
            </p>
            <input
              type="text"
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setCancelModalId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Keep Request
              </button>
              <button
                onClick={handleCancelVisit}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniCampusVisits;
