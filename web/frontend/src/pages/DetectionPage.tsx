import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Play,
  Square,
  FileVideo,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Bike,
  Percent,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { VideoDetectionResult } from '../types/detection';

export const DetectionPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [result, setResult] = useState<VideoDetectionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    setSelectedFile(file);
    setResult(null);
    setProgress(0);

    // Create object URL for local video preview
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleStartDetection = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(5);
    setCurrentStep('Extracting video frames and initializing Co-DETR model pipeline...');

    // Progress simulation while API call executes
    let currentP = 5;
    progressIntervalRef.current = window.setInterval(() => {
      currentP += 5;
      if (currentP <= 85) {
        setProgress(currentP);
        if (currentP === 25) setCurrentStep('Scanning motorcycle bounding proposals with Swin-L backbone...');
        if (currentP === 55) setCurrentStep('Analyzing rider head crops & helmet safety adherence...');
        if (currentP === 75) setCurrentStep('Generating violation timestamps and confidence scores...');
      }
    }, 250);

    try {
      const response = await api.uploadVideo(selectedFile);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(100);
      setCurrentStep('Analysis Complete!');
      setResult(response);
    } catch (err: any) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setErrorMsg(err.message || 'Failed to process detection');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopDetection = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsProcessing(false);
    setCurrentStep('Detection aborted by operator');
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
    setResult(null);
    setProgress(0);
    setCurrentStep('');
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <h1 className="font-tech text-2xl font-bold tracking-wider text-slate-100 uppercase">
            AI Video Detection Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Upload traffic surveillance footage to identify motorcycles, riders, and helmet violations.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-mono px-3 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
            API: POST /api/detection/video
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Upload & Controls + Video Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload and Pipeline Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Drag & Drop Dropzone */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-950/30 shadow-neon-cyan'
                  : 'border-slate-700 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/avi,video/mov,video/mkv,video/webm"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">
                    Drag & drop surveillance video here
                  </p>
                  <p className="text-xs text-slate-400">
                    or <span className="text-cyan-400 underline">browse your files</span>
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Supported formats: MP4, AVI, MOV, MKV (Up to 100MB)
                </span>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-4 border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
                    <FileVideo className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-[260px]">
                      {selectedFile.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs"
                  title="Remove video"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {!isProcessing ? (
                  <button
                    onClick={handleStartDetection}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-semibold text-xs font-mono shadow-neon-cyan hover:opacity-95 transition-opacity"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START AI DETECTION</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopDetection}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs font-mono transition-colors"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>STOP DETECTION</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Progress & Pipeline Step Feedback */}
          {(isProcessing || progress > 0) && (
            <div className="glass-panel rounded-xl p-4 border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-semibold">PIPELINE EXECUTION</span>
                <span className="text-cyan-400 font-bold">{progress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{currentStep}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Video Preview and AI Detection Overlay (7 cols) */}
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-xl p-4 border-slate-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                SURVEILLANCE FEED MONITOR
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                CCTV PROJECTION
              </span>
            </div>

            {/* Video Viewport */}
            <div className="relative flex-1 min-h-[300px] sm:min-h-[360px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
              {videoPreviewUrl ? (
                <video
                  src={videoPreviewUrl}
                  controls
                  className="w-full h-full object-contain max-h-[440px]"
                />
              ) : (
                <div className="text-center p-6 text-slate-500 space-y-2">
                  <FileVideo className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-xs font-mono">No video loaded for monitoring</p>
                  <p className="text-[11px] text-slate-600">
                    Upload a traffic footage clip above to initiate detection
                  </p>
                </div>
              )}

              {/* Simulated Hologram Bounding Box Overlay if processing */}
              {isProcessing && (
                <div className="absolute inset-0 pointer-events-none border border-cyan-500/40 scanline-overlay">
                  <div className="absolute top-4 left-4 bg-slate-950/80 px-2.5 py-1 rounded border border-cyan-500/50 text-[10px] font-mono text-cyan-400 animate-pulse">
                    CO-DETR INFERENCE ACTIVE
                  </div>
                  {/* Mock Bounding Box 1 */}
                  <div className="absolute top-1/3 left-1/4 w-32 h-44 border-2 border-dashed border-cyan-400 rounded">
                    <span className="absolute -top-5 left-0 bg-cyan-950 text-cyan-300 text-[9px] px-1 font-mono">
                      Bike [98.2%]
                    </span>
                  </div>
                  {/* Mock Bounding Box 2 (Helmet) */}
                  <div className="absolute top-[28%] left-[28%] w-12 h-12 border-2 border-rose-500 rounded-full animate-ping opacity-60" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detection Results Area */}
      {result && (
        <div className="glass-panel rounded-xl p-5 border-cyan-500/30 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="font-tech text-lg font-bold tracking-wider text-slate-100 uppercase">
                Detection Results & Violation Audit
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Processed: {new Date(result.processedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* KPI Summary Cards for this video */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
              <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                <Bike className="w-3.5 h-3.5 text-cyan-400" /> Motorcycles Detected
              </div>
              <div className="text-2xl font-bold font-tech text-cyan-300">
                {result.totalMotorcycles}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
              <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Violations Found
              </div>
              <div className="text-2xl font-bold font-tech text-rose-400">
                {result.totalViolations}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
              <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                <Percent className="w-3.5 h-3.5 text-emerald-400" /> Compliance Rate
              </div>
              <div className="text-2xl font-bold font-tech text-emerald-400">
                {result.complianceRate}%
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
              <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Frames Evaluated
              </div>
              <div className="text-2xl font-bold font-tech text-slate-200">
                {result.framesProcessed} <span className="text-xs font-normal text-slate-400">({result.fps} FPS)</span>
              </div>
            </div>
          </div>

          {/* Timeline violation events */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Video Timestamp Infraction Markers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {result.violationsBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-900/90 border border-rose-500/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {item.time}
                    </span>
                    <span className="font-mono text-cyan-300 text-[11px]">{item.confidence}% Conf</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">{item.violation}</div>
                  <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>{item.vehicle}</span>
                    <span className="text-slate-500">{item.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
