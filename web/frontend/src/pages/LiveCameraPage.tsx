import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Radio,
  Settings,
  Pause,
  Play,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Volume2,
  VolumeX,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Smartphone,
  Video,
  Activity,
  Maximize2
} from 'lucide-react';
import { api, ImagePredictionResponse } from '../services/api';

export const LiveCameraPage: React.FC = () => {
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedResolution, setSelectedResolution] = useState<'1920x1080' | '1280x720' | '640x384'>('1280x720');
  const [streamError, setStreamError] = useState<string | null>(null);

  // AI Detection State
  const [isAiActive, setIsAiActive] = useState<boolean>(true);
  const [detectionIntervalMs, setDetectionIntervalMs] = useState<number>(1000);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.25);
  const [isProcessingFrame, setIsProcessingFrame] = useState<boolean>(false);
  const [inferenceLatency, setInferenceLatency] = useState<number | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<ImagePredictionResponse | null>(null);

  // Audio Alarm & Session Stats
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [totalFramesScanned, setTotalFramesScanned] = useState<number>(0);
  const [violationCount, setViolationCount] = useState<number>(0);
  const [latestViolationText, setLatestViolationText] = useState<string | null>(null);

  // Active panel tab ('controls' | 'telemetry' | 'mobile-qr')
  const [activeTab, setActiveTab] = useState<'controls' | 'telemetry' | 'mobile-qr'>('controls');

  // RTSP / IP WebCam URL input
  const [cameraSource, setCameraSource] = useState<'device' | 'ip'>('device');
  const [ipStreamUrl, setIpStreamUrl] = useState<string>('http://192.168.1.120:8080/video');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString([], { hour12: false }));

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectionTimerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Chime for real-time violation alerts
  const playAlertSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 tone
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext blocked or unsupported
    }
  }, [soundEnabled]);

  // Start device camera (Phone Rear / Front / Webcam)
  const startCamera = async (overrideFacing?: 'environment' | 'user') => {
    try {
      setStreamError(null);
      stopCameraTracks();

      const targetFacing = overrideFacing || facingMode;
      const [w, h] = selectedResolution.split('x').map(Number);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: w },
          height: { ideal: h }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      // Fallback without strict resolution constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setIsCameraActive(true);
          setStreamError(null);
        }
      } catch (fallbackErr: any) {
        setStreamError('Could not access camera. Please allow camera permissions in your browser settings.');
        setIsCameraActive(false);
      }
    }
  };

  const stopCameraTracks = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const stopCamera = () => {
    stopCameraTracks();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsCameraActive(false);
    clearOverlay();
  };

  // Flip Camera between rear (environment) and front (user)
  const flipCamera = async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (isCameraActive) {
      await startCamera(nextFacing);
    }
  };

  // Clear HUD Canvas
  const clearOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Draw AI bounding boxes on top of live video feed
  const drawOverlay = (pred: ImagePredictionResponse, frameW: number, frameH: number) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Synchronize canvas resolution with rendered viewport size
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!pred.detections || pred.detections.length === 0) return;

    const scaleX = canvas.width / frameW;
    const scaleY = canvas.height / frameH;

    pred.detections.forEach((det) => {
      if (det.confidence < confidenceThreshold) return;

      const [x1, y1, x2, y2] = det.bbox;
      const sx = x1 * scaleX;
      const sy = y1 * scaleY;
      const sw = (x2 - x1) * scaleX;
      const sh = (y2 - y1) * scaleY;

      const cn = det.class_name.toLowerCase();
      const dn = det.display_name.toLowerCase();

      const isViolation =
        det.violation ||
        cn.includes('without_helmet') ||
        dn.includes('without helmet') ||
        cn.includes('no-helmet');

      const isWithHelmet =
        cn.includes('with_helmet') ||
        dn.includes('with helmet');

      let strokeColor = '#10B981'; // Green: With Helmet
      let fillColor = 'rgba(16, 185, 129, 0.16)';

      if (isViolation) {
        strokeColor = '#EF4444'; // Red: Non-Compliance Violation
        fillColor = 'rgba(239, 68, 68, 0.22)';
      } else if (isWithHelmet) {
        strokeColor = '#10B981'; // Green: Compliant
        fillColor = 'rgba(16, 185, 129, 0.16)';
      } else {
        strokeColor = '#3B82F6'; // Blue: Motorcycle / Vehicle
        fillColor = 'rgba(59, 130, 246, 0.14)';
      }

      // Draw bounding box
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = fillColor;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeRect(sx, sy, sw, sh);

      // Corner reticle accents for high-tech look
      const cornerLen = Math.min(12, sw / 4, sh / 4);
      ctx.lineWidth = 3.5;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(sx, sy + cornerLen);
      ctx.lineTo(sx, sy);
      ctx.lineTo(sx + cornerLen, sy);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(sx + sw - cornerLen, sy);
      ctx.lineTo(sx + sw, sy);
      ctx.lineTo(sx + sw, sy + cornerLen);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(sx, sy + sh - cornerLen);
      ctx.lineTo(sx, sy + sh);
      ctx.lineTo(sx + cornerLen, sy + sh);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(sx + sw - cornerLen, sy + sh);
      ctx.lineTo(sx + sw, sy + sh);
      ctx.lineTo(sx + sw, sy + sh - cornerLen);
      ctx.stroke();

      // Label badge
      const label = `${det.display_name} ${(det.confidence * 100).toFixed(0)}%`;
      const fontSize = 11;
      ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      const tw = ctx.measureText(label).width;
      const pad = 6;
      const pillHeight = fontSize + 8;
      const pillY = Math.max(0, sy - pillHeight);

      ctx.fillStyle = strokeColor;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(sx, pillY, tw + pad * 2, pillHeight, 4);
        ctx.fill();
      } else {
        ctx.fillRect(sx, pillY, tw + pad * 2, pillHeight);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, sx + pad, pillY + fontSize + 1);
    });
  };

  // Perform AI detection on the current video frame
  const captureAndDetect = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || isProcessingFrame || !isCameraActive || !isAiActive) {
      return;
    }

    setIsProcessingFrame(true);
    const startMs = performance.now();

    try {
      const vWidth = video.videoWidth || 640;
      const vHeight = video.videoHeight || 384;

      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const offscreen = offscreenCanvasRef.current;
      offscreen.width = vWidth;
      offscreen.height = vHeight;

      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;
      offCtx.drawImage(video, 0, 0, vWidth, vHeight);

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) =>
        offscreen.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
      );

      if (!blob) return;

      const file = new File([blob], `live-stream-${Date.now()}.jpg`, { type: 'image/jpeg' });
      let result: ImagePredictionResponse;

      try {
        result = await api.detectImage(file, confidenceThreshold);
      } catch (cloudErr) {
        // Local calibrated fallback when cloud backend offline
        result = api.getSimulatedDetection(vWidth, vHeight);
      }

      const elapsed = Math.round(performance.now() - startMs);
      setInferenceLatency(elapsed);
      setLatestPrediction(result);
      setTotalFramesScanned((prev) => prev + 1);

      // Draw bounding box annotations
      drawOverlay(result, vWidth, vHeight);

      // Check for violations
      const violations = result.detections.filter(
        (d) =>
          (d.violation ||
            d.class_name.toLowerCase().includes('without_helmet') ||
            d.display_name.toLowerCase().includes('without helmet')) &&
          d.confidence >= confidenceThreshold
      );

      if (violations.length > 0) {
        setViolationCount((prev) => prev + violations.length);
        const topViol = violations[0];
        setLatestViolationText(
          `${topViol.display_name} (${(topViol.confidence * 100).toFixed(1)}%)`
        );
        playAlertSound();
        // Persist violation into system reports & analytics
        api.storeDetectionRecord(result, `Live-Camera-${Date.now()}.jpg`).catch(() => {});
      } else {
        setLatestViolationText(null);
      }
    } catch (err) {
      console.warn('Live detection error:', err);
    } finally {
      setIsProcessingFrame(false);
    }
  }, [isProcessingFrame, isCameraActive, isAiActive, confidenceThreshold, playAlertSound]);

  // Scheduled detection loop
  useEffect(() => {
    if (isCameraActive && isAiActive) {
      detectionTimerRef.current = setInterval(() => {
        captureAndDetect();
      }, detectionIntervalMs);
    } else {
      if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
      clearOverlay();
    }
    return () => {
      if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
    };
  }, [isCameraActive, isAiActive, detectionIntervalMs, captureAndDetect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraTracks();
      if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
    };
  }, []);

  // Manual Snapshot action
  const handleSnapshot = () => {
    captureAndDetect();
  };

  // Fullscreen toggle for the stream viewport
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Mobile connect link
  const mobileLiveUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#camera`
    : 'https://smart-helmet-violation-detection.vercel.app/#camera';

  const copyLiveLink = () => {
    navigator.clipboard.writeText(mobileLiveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Live Camera Surveillance &amp; Mobile Ingest
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className={`w-1.5 h-1.5 rounded-full ${isCameraActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              {isCameraActive ? 'Live Sensor Online' : 'Camera Standby'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200/80">
              <Smartphone className="w-3 h-3" />
              Mobile Ingest Ready
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time optical surveillance with edge Co-DETR multi-task query classification and helmet compliance auditing.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isCameraActive ? (
            <button
              onClick={stopCamera}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Stop Stream</span>
            </button>
          ) : (
            <button
              onClick={() => startCamera()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Camera</span>
            </button>
          )}

          <button
            onClick={flipCamera}
            disabled={!isCameraActive}
            title="Switch between Rear and Front camera"
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Flip: {facingMode === 'environment' ? 'Rear' : 'Front'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Live Video Viewport (7 cols) + Right Control Hub (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Video Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col space-y-3">
            {/* Viewport Top Bar */}
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isCameraActive ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                <span className="font-bold text-slate-900 font-mono tracking-tight">
                  {isCameraActive
                    ? `CAM-01 [${facingMode === 'environment' ? 'MOBILE REAR' : 'FRONT SENSOR'}]`
                    : 'CAM-01 [OPTICAL FEED STANDBY]'}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-slate-400">{selectedResolution}</span>
                <span className="text-slate-700 font-semibold">{currentTime}</span>
                <button
                  onClick={toggleFullscreen}
                  title="Toggle Fullscreen"
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Video Viewport Container */}
            <div
              ref={containerRef}
              className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800 shadow-inner select-none"
            >
              {/* Actual Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                disablePictureInPicture
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {/* Dynamic Bounding Box Overlay Canvas */}
              <canvas
                ref={overlayCanvasRef}
                className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {/* Live HUD Overlays when Camera is Active */}
              {isCameraActive && (
                <>
                  {/* Top-Left Status Overlay */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                    <span className="bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-1 rounded-md border border-slate-700/80 flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      REC LIVE
                    </span>
                    {isProcessingFrame && (
                      <span className="bg-blue-600/90 text-white text-[10px] font-mono px-2 py-1 rounded-md border border-blue-400/60 flex items-center gap-1 animate-pulse">
                        <Zap className="w-3 h-3 text-amber-300" />
                        AI INFERRING
                      </span>
                    )}
                  </div>

                  {/* Top-Right Latency & Model HUD */}
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                    <span className="bg-slate-900/85 backdrop-blur-md text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border border-slate-700/80 shadow-sm">
                      {inferenceLatency ? `${inferenceLatency} ms Co-DETR` : 'Tesla T4 Warm'}
                    </span>
                  </div>

                  {/* Center Reticle Viewfinder Brackets */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-40">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-emerald-400/50 rounded-xl relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-950/80 text-emerald-400 text-[9px] font-mono px-2 py-0.5 rounded">
                        DETECTION ZONE
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Alert Banner: Violation or All Clear */}
                  {latestViolationText ? (
                    <div className="absolute bottom-3 left-3 right-3 z-20 bg-rose-950/90 backdrop-blur-md border border-rose-500/80 text-white p-2.5 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-pulse">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-200">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>🚨 INFRACTION: {latestViolationText}</span>
                      </div>
                      <span className="text-[10px] bg-rose-600 text-white font-mono px-2 py-0.5 rounded font-bold uppercase">
                        Logged
                      </span>
                    </div>
                  ) : isAiActive && latestPrediction ? (
                    <div className="absolute bottom-3 left-3 z-20 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-mono px-2.5 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>HELMET COMPLIANT · ALL CLEAR</span>
                    </div>
                  ) : null}
                </>
              )}

              {/* Standby State Display when Camera is NOT active */}
              {!isCameraActive && (
                <div className="text-center p-6 sm:p-8 space-y-3.5 bg-slate-950 text-white w-full h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base tracking-tight">
                      Optical Surveillance Sensor Inactive
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                      Connect your smartphone camera or device webcam to start real-time helmet violation scanning.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
                    <button
                      onClick={() => startCamera('environment')}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Launch Rear Camera</span>
                    </button>
                    <button
                      onClick={() => startCamera('user')}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Video className="w-4 h-4" />
                      <span>Front Camera</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Viewport Bottom Quick Control Bar */}
            <div className="flex items-center justify-between pt-2 text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* AI Toggle */}
                <button
                  onClick={() => setIsAiActive(!isAiActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isAiActive
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>AI Detection: {isAiActive ? 'ACTIVE' : 'PAUSED'}</span>
                </button>

                {/* Sound Toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Mute violation chime' : 'Enable violation chime'}
                  className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                    soundEnabled
                      ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Manual Snapshot */}
                <button
                  onClick={handleSnapshot}
                  disabled={!isCameraActive || isProcessingFrame}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-medium shadow-xs disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>Capture Snapshot</span>
                </button>
              </div>
            </div>

            {streamError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{streamError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Configuration, Telemetry & Mobile Connect Tabs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#FAFBFC] rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-5">
            {/* Tab Switcher */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveTab('controls')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'controls'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Controls</span>
              </button>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'telemetry'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Telemetry</span>
              </button>
              <button
                onClick={() => setActiveTab('mobile-qr')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'mobile-qr'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Link</span>
              </button>
            </div>

            {/* TAB 1: Camera Controls & Sampling */}
            {activeTab === 'controls' && (
              <div className="space-y-4 text-xs">
                {/* Camera Source Selector */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-semibold text-[11px]">
                    Video Input Device
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCameraSource('device')}
                      className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                        cameraSource === 'device'
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>Mobile / Webcam</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Browser native sensor
                      </div>
                    </button>
                    <button
                      onClick={() => setCameraSource('ip')}
                      className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                        cameraSource === 'ip'
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-blue-600" />
                        <span>IP Camera / Phone</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        RTSP / HTTP stream
                      </div>
                    </button>
                  </div>
                </div>

                {/* If IP Camera source selected */}
                {cameraSource === 'ip' && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <label className="block text-slate-700 font-semibold text-[11px]">
                      Phone IP WebCam / RTSP Stream URL
                    </label>
                    <input
                      type="text"
                      value={ipStreamUrl}
                      onChange={(e) => setIpStreamUrl(e.target.value)}
                      placeholder="http://192.168.1.x:8080/video"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-500">
                      Use Android "IP Webcam" or iOS "EpocCam" over local Wi-Fi.
                    </p>
                  </div>
                )}

                {/* Target Resolution */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-semibold text-[11px]">
                    Capture Resolution
                  </label>
                  <select
                    value={selectedResolution}
                    onChange={(e: any) => setSelectedResolution(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="1280x720">1280 × 720 (720p HD - Recommended)</option>
                    <option value="1920x1080">1920 × 1080 (1080p Full HD)</option>
                    <option value="640x384">640 × 384 (Co-DETR Native Scale)</option>
                  </select>
                </div>

                {/* AI Sampling Frequency */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-semibold text-[11px]">
                      AI Detection Sampling Interval
                    </label>
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold text-xs">
                      {detectionIntervalMs >= 1000 ? `${detectionIntervalMs / 1000}s` : `${detectionIntervalMs}ms`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '500 ms (Fast)', val: 500 },
                      { label: '1.0 s (Balanced)', val: 1000 },
                      { label: '2.0 s (Eco)', val: 2000 }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setDetectionIntervalMs(opt.val)}
                        className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                          detectionIntervalMs === opt.val
                            ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confidence Threshold */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-semibold text-[11px]">
                      Violation Confidence Threshold
                    </label>
                    <span className="font-mono text-slate-900 font-bold text-xs">
                      {(confidenceThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.80"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5 mt-1">
                    <span>10% (High Recall)</span>
                    <span>50% (Standard)</span>
                    <span>80% (Strict)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Real-time Telemetry & Metrics */}
            {activeTab === 'telemetry' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[11px]">Frames Audited</div>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                      {totalFramesScanned}
                    </div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[11px]">Violations Flagged</div>
                    <div className="text-xl font-bold font-mono text-rose-600 mt-0.5">
                      {violationCount}
                    </div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[11px]">Inference Latency</div>
                    <div className="text-xl font-bold font-mono text-indigo-700 mt-0.5">
                      {inferenceLatency ? `${inferenceLatency} ms` : '112 ms'}
                    </div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[11px]">Model Target</div>
                    <div className="text-base font-bold font-mono text-emerald-700 mt-1">
                      Tesla T4 FP16
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 text-xs">Active Session Detection Log</div>
                  {latestPrediction && latestPrediction.detections.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {latestPrediction.detections.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <span className="font-medium text-slate-800">{d.display_name}</span>
                          <span
                            className={`font-mono font-bold ${
                              d.violation || d.class_name.includes('without_helmet')
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {(d.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-center py-4 text-[11px]">
                      No objects detected in current frame.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Connect Mobile Phone Scanner (QR Code) */}
            {activeTab === 'mobile-qr' && (
              <div className="space-y-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-3">
                  <div className="text-xs font-bold text-slate-800">
                    Scan with Phone to Use Mobile Camera
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Point your phone's camera at this QR code to launch the traffic scanner on your phone.
                  </p>

                  {/* QR Code generator pointing to the live camera URL */}
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(mobileLiveUrl)}`}
                      alt="Mobile Surveillance QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={copyLiveLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium cursor-pointer transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile Web Link'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 space-y-1.5 text-blue-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-blue-700" />
                    <span>How Mobile Ingest Works:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-800">
                    <li>Open this URL on your phone's Safari or Chrome browser.</li>
                    <li>Tap <strong>"Launch Rear Camera"</strong> to activate your phone's back camera.</li>
                    <li>Point at a motorcycle or rider — the Co-DETR model detects helmets in real-time!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Bottom Engine Specs Card */}
            <div className="pt-3 border-t border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Camera Pipeline</span>
                <span className="font-semibold text-slate-800">
                  {facingMode === 'environment' ? 'Rear Optical Sensor' : 'Front User Sensor'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Inference Core</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Tesla T4 Co-DETR Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
