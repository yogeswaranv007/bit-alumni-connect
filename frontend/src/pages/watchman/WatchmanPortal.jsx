import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { watchmanApi } from '../../api/watchmanApi';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import { decodeQrFromImage } from '../../utils/qrDecoder';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  QrCode,
  Radio,
  CreditCard,
  Hash,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  Building,
  Calendar,
  LogOut,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Info,
  Camera,
  CameraOff,
  SwitchCamera,
  Tv,
  Scan,
  BellRing,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

const playBeepSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } catch {
    // Ignore audio error if not permitted
  }
};

export const WatchmanPortal = () => {
  const { user, logout } = useAuth();

  // Mode tab: 'QR' | 'GATE_DISPLAY' | 'RFID' | 'ALUMNI_ID' | 'REGISTER_NUMBER'
  const [activeTab, setActiveTab] = useState('QR');

  // Input states
  const [qrToken, setQrToken] = useState('');
  const [rfidUid, setRfidUid] = useState('');
  const [alumniIdNumber, setAlumniIdNumber] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [selectedGate, setSelectedGate] = useState('Main Gate');
  const [entryRemarks, setEntryRemarks] = useState('');

  // Camera Scanner states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // File / Image Upload State for QR testing
  const fileInputRef = useRef(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  // Execution states
  const [verifying, setVerifying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null); // GateVerificationResponse
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [liveCheckinAlert, setLiveCheckinAlert] = useState(null);

  // Live gate entries for today
  const [todayLogs, setTodayLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Last processed live checkin timestamp/ID to prevent duplicate sound loops
  const lastProcessedCheckinRef = useRef(null);

  useEffect(() => {
    fetchTodayLogs();
  }, []);

  // Real-time polling for Gate QR Check-ins from Alumni Mobile
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await watchmanApi.getLiveCheckin(selectedGate);
        if (res && res.success && res.data) {
          const checkinData = res.data;
          const checkinUniqueKey = checkinData.checkinId || (checkinData.alumni?.alumniIdNumber + '_' + Date.now());

          if (lastProcessedCheckinRef.current !== checkinUniqueKey) {
            lastProcessedCheckinRef.current = checkinUniqueKey;
            playBeepSound();
            setResult(checkinData);
            setLiveCheckinAlert(`🔔 Live Gate QR Check-In detected from ${checkinData.alumni?.fullName || 'Alumnus'}! Campus visit booking details loaded below.`);
            setSuccessMessage(null);
            setError(null);
          }
        }
      } catch {
        // quiet error
      }
    }, 1500);

    return () => {
      clearInterval(pollInterval);
    };
  }, [selectedGate]);

  // Cleanup camera if changing tabs or unmounting
  useEffect(() => {
    if (activeTab !== 'QR') {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const fetchTodayLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await watchmanApi.getTodayLogs();
      if (response.success && response.data) {
        setTodayLogs(response.data);
      }
    } catch (err) {
      console.warn('Failed to load today gate logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Camera Lifecycle
  const startCamera = async () => {
    setCameraError(null);
    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });

      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play interrupted or muted:', playErr);
        }
      }

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);

    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied or unavailable: ' + (err.message || 'Please check browser camera permissions'));
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraActive) {
      stopCamera();
      setTimeout(startCamera, 200);
    }
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.height = videoRef.current.videoHeight;
    canvas.width = videoRef.current.videoWidth;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data && code.data.trim()) {
      playBeepSound();
      stopCamera();
      setQrToken(code.data.trim());
      executeVerify('QR', code.data.trim());
    } else {
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);
    }
  };

  // Image Upload Scanner for Screenshots & Photos
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFeedback({
      loading: true,
      text: 'Analyzing image with multi-engine QR scanner...'
    });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setUploadedImagePreview(dataUrl);

      try {
        const decoded = await decodeQrFromImage(dataUrl);

        if (decoded) {
          playBeepSound();
          setQrToken(decoded);
          setUploadFeedback({
            success: true,
            text: `✓ Decoded payload from image: ${decoded.length > 50 ? decoded.substring(0, 50) + '...' : decoded}`
          });
          executeVerify('QR', decoded);
        } else {
          setUploadFeedback({
            success: false,
            text: 'Could not detect a QR Code in the uploaded image. Please ensure the QR code is clearly visible and in focus.'
          });
        }
      } catch (decodeErr) {
        console.error('QR decode error:', decodeErr);
        setUploadFeedback({
          success: false,
          text: 'Error processing image: ' + (decodeErr.message || 'Unknown decode error')
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const executeVerify = async (methodType, tokenVal) => {
    setVerifying(true);
    setError(null);
    setResult(null);
    setSuccessMessage(null);
    setLiveCheckinAlert(null);

    try {
      let response;
      if (methodType === 'QR') {
        const val = tokenVal || qrToken;
        if (!val || !val.trim()) throw new Error('Please enter or scan a QR Token');
        response = await watchmanApi.verifyByQr(val.trim());
      } else if (methodType === 'RFID') {
        const val = tokenVal || rfidUid;
        if (!val || !val.trim()) throw new Error('Please scan or enter RFID UID');
        response = await watchmanApi.verifyByRfid(val.trim());
      } else if (methodType === 'ALUMNI_ID') {
        const val = tokenVal || alumniIdNumber;
        if (!val || !val.trim()) throw new Error('Please enter Alumni ID (e.g. BIT-ALU-2024-001245)');
        response = await watchmanApi.verifyByAlumniId(val.trim());
      } else if (methodType === 'REGISTER_NUMBER') {
        const val = tokenVal || registerNumber;
        if (!val || !val.trim()) throw new Error('Please enter College Register Number');
        response = await watchmanApi.verifyByRegisterNumber(val.trim());
      }

      if (response && response.success) {
        setResult(response.data);
      } else {
        setError(response?.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.message || 'Verification request failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifySubmit = (e) => {
    if (e) e.preventDefault();
    executeVerify(activeTab);
  };

  const handleRecordEntry = async () => {
    const profileId = result?.alumni?.id || result?.alumni?.profileId;
    if (!result || !profileId) {
      setError('Cannot record entry: Alumni profile ID is missing.');
      return;
    }
    setRecording(true);
    setError(null);
    setSuccessMessage(null);
    setLiveCheckinAlert(null);

    try {
      const payload = {
        alumniProfileId: profileId,
        verificationMethod: result.verificationMethod,
        gate: selectedGate,
        remarks: entryRemarks.trim() || undefined,
      };

      const response = await watchmanApi.recordEntry(payload);
      if (response.success) {
        setSuccessMessage(`Campus entry recorded successfully at ${selectedGate}! Notifications dispatched.`);
        setResult(null);
        setQrToken('');
        setRfidUid('');
        setAlumniIdNumber('');
        setRegisterNumber('');
        setEntryRemarks('');
        lastProcessedCheckinRef.current = null;
        fetchTodayLogs();
      } else {
        setError(response.message || 'Failed to record entry');
      }
    } catch (err) {
      setError(err.message || 'Failed to record entry');
    } finally {
      setRecording(false);
    }
  };

  const handleQuickDemo = (type) => {
    if (type === 'ARUN_ALUMNI_ID') {
      setActiveTab('ALUMNI_ID');
      setAlumniIdNumber('BIT-ALU-2024-001245');
      executeVerify('ALUMNI_ID', 'BIT-ALU-2024-001245');
    } else if (type === 'SAMPLE_RFID') {
      setActiveTab('RFID');
      setRfidUid('RFID-BIT-001245');
      executeVerify('RFID', 'RFID-BIT-001245');
    } else if (type === 'SAMPLE_REG_NO') {
      setActiveTab('REGISTER_NUMBER');
      setRegisterNumber('7376221IT101');
      executeVerify('REGISTER_NUMBER', '7376221IT101');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Hidden canvas for video & image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Input for QR Screenshot / Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Dedicated Gate Security Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-tight text-white uppercase">
                BIT Campus Gate Verification Portal
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase">
                Watchman Station
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Authorized Gate Control & Identity Clearance • Bannari Amman Institute of Technology
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-200">{user?.fullName || 'Gate Guard'}</p>
            <p className="text-[11px] text-amber-400 font-mono">{selectedGate}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Verification Controls & Results (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Verification Method Selector */}
          <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Identity Verification Method
              </span>
              <select
                value={selectedGate}
                onChange={(e) => setSelectedGate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-400 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Main Gate">Main Gate</option>
                <option value="North Gate (Tech Park)">North Gate (Tech Park)</option>
                <option value="South Gate (Hostel)">South Gate (Hostel)</option>
                <option value="Admin Block Gate">Admin Block Gate</option>
              </select>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => { setActiveTab('QR'); setError(null); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                  activeTab === 'QR'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QR Scanner</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('GATE_DISPLAY'); setError(null); stopCamera(); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                  activeTab === 'GATE_DISPLAY'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>Gate QR</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('RFID'); setError(null); stopCamera(); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                  activeTab === 'RFID'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>RFID Card</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('ALUMNI_ID'); setError(null); stopCamera(); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                  activeTab === 'ALUMNI_ID'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Alumni ID</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('REGISTER_NUMBER'); setError(null); stopCamera(); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                  activeTab === 'REGISTER_NUMBER'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>Reg. No</span>
              </button>
            </div>

            {/* Mode 1: QR Scanner (Live Camera + Image Upload + Barcode Input) */}
            {activeTab === 'QR' && (
              <div className="space-y-4 pt-1">
                {/* Camera & Image Upload Scanner Container */}
                <div className="rounded-2xl bg-slate-950 border border-slate-700 p-4 overflow-hidden relative space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                      <Camera className="w-4 h-4" />
                      <span>Live Camera & Image Upload Scanner</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      {/* Upload QR Screenshot / Photo Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center space-x-1.5 border border-slate-700 shadow-xs cursor-pointer transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload QR Image</span>
                      </button>

                      {cameraActive && (
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <SwitchCamera className="w-3.5 h-3.5" />
                          <span>Flip</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={cameraActive ? stopCamera : startCamera}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition shadow-sm ${
                          cameraActive
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {cameraActive ? (
                          <>
                            <CameraOff className="w-3.5 h-3.5" />
                            <span>Stop Camera</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3.5 h-3.5" />
                            <span>Start Camera</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Video Viewport - ALWAYS mounted in DOM to enable reliable ref attachment */}
                  <div className={`relative w-full aspect-video sm:aspect-4/3 max-h-64 bg-black rounded-xl overflow-hidden flex items-center justify-center ${cameraActive ? 'block' : 'hidden'}`}>
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Aiming Reticle / Laser Line */}
                    <div className="absolute inset-0 border-2 border-dashed border-amber-500/60 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-amber-400 rounded-2xl relative shadow-2xl">
                        <div className="absolute inset-x-0 top-0 h-1 bg-amber-400 shadow-lg shadow-amber-400 animate-pulse" />
                      </div>
                    </div>
                    <p className="absolute bottom-2 text-[11px] text-amber-300 font-mono bg-black/70 px-2 py-0.5 rounded">
                      Point camera at Alumnus QR Pass
                    </p>
                  </div>

                  {!cameraActive && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="py-6 text-center text-slate-400 text-xs space-y-2 border border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-900/40 rounded-xl cursor-pointer transition group"
                    >
                      <Scan className="w-8 h-8 mx-auto text-slate-500 group-hover:text-amber-400 animate-pulse transition" />
                      <p className="text-slate-200 font-bold">
                        Click to Upload Screenshot / Image OR Click "Start Camera"
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supports PNG, JPG, or Screenshot uploads. Also supports 2D USB Barcode Scanners.
                      </p>
                    </div>
                  )}

                  {/* Upload Result Feedback */}
                  {uploadFeedback && (
                    <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                      uploadFeedback.loading
                        ? 'bg-amber-950/80 border border-amber-500/50 text-amber-200'
                        : uploadFeedback.success
                        ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
                    }`}>
                      {uploadFeedback.loading ? (
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                      ) : uploadFeedback.success ? (
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      )}
                      <span>{uploadFeedback.text}</span>
                    </div>
                  )}

                  {cameraError && (
                    <p className="text-xs text-rose-400 pt-1 font-medium">{cameraError}</p>
                  )}
                </div>

                {/* Manual Text / USB Scanner Input */}
                <form onSubmit={handleVerifySubmit} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Or Scan / Paste QR Verification Token / Visit ID / Register Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Scan or enter QR token, visit ID, alumni ID..."
                        value={qrToken}
                        onChange={(e) => setQrToken(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={verifying}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {verifying ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>Verify</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Mode 2: Display Gate Check-In QR Code (for Alumni to scan) */}
            {activeTab === 'GATE_DISPLAY' && (
              <div className="space-y-4 pt-1">
                {/* Live Check-In Alert Banner (Directly Above Gate QR Code with Close X Button) */}
                {liveCheckinAlert && (
                  <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 flex items-start justify-between shadow-xl animate-pulse">
                    <div className="flex items-start space-x-3">
                      <BellRing className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-bounce" />
                      <div className="text-sm">
                        <p className="font-extrabold text-amber-300">Live Gate QR Check-In Received</p>
                        <p className="text-xs text-amber-200/90 mt-0.5">{liveCheckinAlert}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLiveCheckinAlert(null);
                        lastProcessedCheckinRef.current = null;
                      }}
                      className="text-amber-400 hover:text-white p-1 rounded-lg hover:bg-amber-500/30 transition cursor-pointer"
                      title="Dismiss Alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-700 text-center space-y-4 shadow-xl">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-amber-400 uppercase tracking-tight">
                      {selectedGate} Security Check-In QR
                    </h3>
                    <p className="text-xs text-slate-400">
                      Alumni can scan this QR code using their mobile phone to self-verify their campus entry pass.
                    </p>
                  </div>

                  <div className="inline-block p-4 bg-white rounded-3xl shadow-2xl">
                    <QRCodeSVG
                      value={JSON.stringify({
                        type: 'BIT_GATE_CHECKIN',
                        gate: selectedGate,
                        institution: 'Bannari Amman Institute of Technology',
                        timestamp: new Date().toISOString()
                      })}
                      size={220}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Station Active & Listening for Live Mobile Check-Ins</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: RFID Card */}
            {activeTab === 'RFID' && (
              <form onSubmit={handleVerifySubmit} className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Tap Physical Card or Enter RFID UID (Keyboard Wedge Ready)
                  </label>
                  <div className="relative">
                    <Radio className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. RFID-BIT-001245 or tap physical card"
                      value={rfidUid}
                      onChange={(e) => setRfidUid(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {verifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  <span>VERIFY RFID IDENTITY</span>
                </button>
              </form>
            )}

            {/* Mode 4: Alumni ID */}
            {activeTab === 'ALUMNI_ID' && (
              <form onSubmit={handleVerifySubmit} className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Enter Permanent Alumni ID Number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. BIT-ALU-2024-001245"
                      value={alumniIdNumber}
                      onChange={(e) => setAlumniIdNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-500 uppercase"
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {verifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  <span>VERIFY ALUMNI ID</span>
                </button>
              </form>
            )}

            {/* Mode 5: Register Number */}
            {activeTab === 'REGISTER_NUMBER' && (
              <form onSubmit={handleVerifySubmit} className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Controlled Search: College Register Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. 7376221IT101"
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-500 uppercase"
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {verifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  <span>CHECK AUTHORIZATION</span>
                </button>
              </form>
            )}

            {/* Quick Demo Pre-fill Links */}
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Test:</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('ARUN_ALUMNI_ID')}
                className="text-amber-400 hover:underline font-mono cursor-pointer"
              >
                [Alumni ID]
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('SAMPLE_REG_NO')}
                className="text-amber-400 hover:underline font-mono cursor-pointer"
              >
                [Reg No: 7376221IT101]
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('SAMPLE_RFID')}
                className="text-amber-400 hover:underline font-mono cursor-pointer"
              >
                [RFID]
              </button>
            </div>
          </div>

          {/* Success Notification Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 flex items-start justify-between shadow-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-emerald-300">Entry Successfully Recorded</p>
                  <p className="text-xs text-emerald-400/90 mt-0.5">{successMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-800/40 transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-start justify-between shadow-lg">
              <div className="flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-rose-300">Verification Request Failed</p>
                  <p className="text-xs text-rose-400/90 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-white p-1 rounded-lg hover:bg-rose-800/40 transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Verification Decision Output Card */}
          {result && (
            <div className={`rounded-2xl border-2 p-6 shadow-2xl space-y-6 transition-all ${
              result.decision === 'ALLOWED'
                ? 'bg-emerald-950/40 border-emerald-500/80'
                : result.decision === 'REVIEW_REQUIRED'
                ? 'bg-amber-950/40 border-amber-500/80'
                : 'bg-rose-950/40 border-rose-500/80'
            }`}>
              {/* Decision Header Badge */}
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                <div className="flex items-center space-x-3">
                  {result.decision === 'ALLOWED' && (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                  )}
                  {result.decision === 'REVIEW_REQUIRED' && (
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                  )}
                  {result.decision === 'DENIED' && (
                    <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-lg shadow-rose-600/30">
                      <XCircle className="w-8 h-8" />
                    </div>
                  )}

                  <div>
                    <h2 className={`text-xl font-black tracking-tight uppercase ${
                      result.decision === 'ALLOWED'
                        ? 'text-emerald-400'
                        : result.decision === 'REVIEW_REQUIRED'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}>
                      {result.decision === 'ALLOWED'
                        ? '✓ ENTRY AUTHORIZED'
                        : result.decision === 'REVIEW_REQUIRED'
                        ? '⚠ REVIEW REQUIRED'
                        : '✕ ENTRY NOT AUTHORIZED'}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Method: {result.verificationMethod} • Timing: {result.timingStatus || 'VERIFIED'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {result.timingStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      result.timingStatus === 'ON_TIME'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : result.timingStatus === 'EARLY'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {result.timingStatus.replace(/_/g, ' ')}
                    </span>
                  )}

                  {/* Close Cross Button for Watchman to Dismiss Result Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setError(null);
                      setLiveCheckinAlert(null);
                      lastProcessedCheckinRef.current = null;
                    }}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700 cursor-pointer shadow-xs"
                    title="Close Campus Visit Details"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Denial Reason if Denied */}
              {result.decision === 'DENIED' && (
                <div className="p-4 rounded-xl bg-rose-900/30 border border-rose-600/50 text-rose-200 text-sm space-y-1">
                  <p className="font-bold text-rose-300">Reason for Denial:</p>
                  <p className="text-xs text-slate-300">{result.denialReason || 'No approved campus visit found for today.'}</p>
                </div>
              )}

              {/* Review Required Instructions */}
              {result.decision === 'REVIEW_REQUIRED' && (
                <div className="p-4 rounded-xl bg-amber-900/30 border border-amber-600/50 text-amber-200 text-sm space-y-1">
                  <p className="font-bold text-amber-300">Visit Pending Authorization:</p>
                  <p className="text-xs text-slate-300">{result.denialReason || 'Campus visit request has been submitted but is pending approval by the department faculty or alumni admin.'}</p>
                </div>
              )}

              {/* Alumnus Gate-Relevant Profile */}
              {result.alumni && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-700/60">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Alumnus Name</span>
                    <p className="text-sm font-extrabold text-white">
                      {result.alumni.fullName || result.alumni.name || 'Alumnus'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Alumni ID / Reg No</span>
                    <p className="text-xs font-mono font-bold text-amber-400">
                      {result.alumni.alumniIdNumber || result.alumni.registerNumber || result.alumni.rollNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
                    <p className="text-xs font-semibold text-slate-200">
                      {result.alumni.departmentName || result.alumni.department || (result.alumni.departmentCode ? `${result.alumni.departmentCode}` : 'BIT Engineering')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Batch</span>
                    <p className="text-xs font-semibold text-slate-200">
                      {result.alumni.batch || (result.alumni.batchEndYear ? `Class of ${result.alumni.batchEndYear}` : 'BIT Alumnus')}
                    </p>
                  </div>
                </div>
              )}

              {/* Approved Campus Visit Details */}
              {result.campusVisit && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>Today's Campus Visit Details</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      Arrival: <strong className="text-white">{result.campusVisit.approvedArrivalTime || result.campusVisit.preferredArrivalTime || '10:30 AM'}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Purpose:</span>{' '}
                      <strong className="text-slate-200">{result.campusVisit.purpose}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Approver:</span>{' '}
                      <strong className="text-slate-200">
                        {result.campusVisit.approverName || 'Department HOD / Admin'} {result.campusVisit.approverRole ? `(${result.campusVisit.approverRole})` : ''}
                      </strong>
                    </div>
                    {result.campusVisit.meetingLocation && (
                      <div>
                        <span className="text-slate-400">Location:</span>{' '}
                        <strong className="text-slate-200">{result.campusVisit.meetingLocation}</strong>
                      </div>
                    )}
                    {result.campusVisit.contactPerson && (
                      <div>
                        <span className="text-slate-400">Host / Contact:</span>{' '}
                        <strong className="text-slate-200">{result.campusVisit.contactPerson}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {result.decision === 'ALLOWED' && (
                <div className="pt-2 space-y-3 border-t border-slate-700/60">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase">
                      Optional Gate Remarks / Visitor Vehicle No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TN-38-AB-1234, Entry granted via Main Gate"
                      value={entryRemarks}
                      onChange={(e) => setEntryRemarks(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRecordEntry}
                    disabled={recording}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base font-black tracking-wide shadow-xl shadow-emerald-500/30 hover:shadow-2xl transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {recording ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6" />
                        <span>RECORD & ALLOW CAMPUS ENTRY</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {result.decision !== 'ALLOWED' && (
                <div className="pt-2 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => { setResult(null); setLiveCheckinAlert(null); }}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Clear & Scan Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Gate Entry Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 shadow-xl flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Today's Gate Feed
                </h3>
              </div>
              <button
                onClick={fetchTodayLogs}
                disabled={logsLoading}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="Refresh feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Live Logs List */}
            <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
              {logsLoading && todayLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Loading gate log feed...
                </div>
              ) : todayLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <Info className="w-8 h-8 mx-auto text-slate-600" />
                  <p>No entry records logged for today yet.</p>
                </div>
              ) : (
                todayLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{log.alumniName}</p>
                        <p className="text-[11px] font-mono text-amber-400">{log.alumniIdNumber}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        log.entryDecision === 'ALLOWED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {log.entryDecision}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <p>
                        <strong className="text-slate-300">{log.department}</strong> • Gate: {log.gate}
                      </p>
                      <p>
                        Method: <span className="font-mono text-slate-300">{log.verificationMethod}</span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(log.entryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default WatchmanPortal;
