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
  RefreshCw,
  ShieldCheck
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
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-[#00E5FF]/20">
        <div>
          <h1 className="font-tech text-2xl sm:text-3xl font-black tracking-wider text-white uppercase text-glow-cyan">
            AI Video Detection Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Upload traffic surveillance footage to identify motorcycles, riders, and helmet violations.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg bg-[#00E5FF]/15 border-2 border-[#00E5FF] text-[#00E5FF] shadow-neon-cyan">
            API: POST /api/detection/video
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FF3158]/20 border-2 border-[#FF3158] text-[#FF3158] text-xs font-mono flex items-center gap-2.5 shadow-neon-red">
          <AlertTriangle className="w-5 h-5 text-[#FF3158] flex-shrink-0 animate-bounce" />
          <span className="font-bold">{errorMsg}</span>
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
              className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? 'border-[#00E5FF] bg-[#00E5FF]/20 shadow-neon-cyan scale-[1.02]'
                  : 'border-[#00E5FF]/40 hover:border-[#00E5FF] bg-[#060D1F]/80 hover:bg-[#0A1632]/90 shadow-[0_0_20px_rgba(0,229,255,0.1)]'
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
              <div className="flex flex-col items-center justify-center space-y-3.5">
                <div className="p-4 rounded-2xl bg-[#00E5FF]/20 border-2 border-[#00E5FF] text-[#00E5FF] shadow-neon-cyan animate-pulse">
                  <UploadCloud className="w-9 h-9 drop-shadow-[0_0_8px_#00E5FF]" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-white tracking-wide">
                    Drag & drop surveillance video here
                  </p>
                  <p className="text-xs text-slate-300 font-medium">
                    or <span className="text-[#00E5FF] underline font-bold">browse your files</span>
                  </p>
                </div>
                <span className="text-[11px] font-mono text-[#00FF9C] font-semibold bg-[#00FF9C]/10 px-2.5 py-1 rounded border border-[#00FF9C]/30">
                  Supported: MP4, AVI, MOV, MKV (Up to 100MB)
                </span>
              </div>
            </div>
          ) : (
            <div className="neon-glass-panel rounded-2xl p-5 border-2 border-[#00E5FF]/40 shadow-neon-cyan space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#00E5FF]/20 border-2 border-[#00E5FF] text-[#00E5FF] shadow-neon-cyan">
                    <FileVideo className="w-6 h-6 drop-shadow-[0_0_6px_#00E5FF]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-[260px]">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs font-mono text-[#00E5FF] font-semibold">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • READY
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
                  title="Remove video"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {!isProcessing ? (
                  <button
                    onClick={handleStartDetection}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#00FF9C] to-[#1687FF] text-slate-950 font-black text-xs sm:text-sm font-mono shadow-neon-cyan hover:shadow-neon-cyan-lg hover:scale-[1.02] transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START AI DETECTION</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopDetection}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-[#FF3158] to-[#FF8A00] text-white font-black text-xs sm:text-sm font-mono shadow-neon-red hover:shadow-neon-red-lg transition-all"
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
            <div className="neon-glass-panel rounded-2xl p-5 border-2 border-[#00E5FF]/40 shadow-neon-cyan space-y-3.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-white font-bold tracking-wider">PIPELINE EXECUTION</span>
                <span className="text-[#00E5FF] font-black text-sm text-glow-cyan">{progress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-[#00E5FF]/50 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#00E5FF] via-[#00FF9C] to-[#1687FF] rounded-full transition-all duration-300 shadow-neon-cyan"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-xs font-mono text-[#00FF9C] flex items-center gap-2 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00FF9C] animate-ping" />
                <span>{currentStep}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Video Preview and AI Detection Overlay (7 cols) */}
        <div className="lg:col-span-7">
          <div className="neon-glass-panel rounded-2xl p-5 border-2 border-[#00E5FF]/35 shadow-[0_0_25px_rgba(0,229,255,0.15)] h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00E5FF]" />
                SURVEILLANCE FEED MONITOR
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/50 shadow-neon-cyan">
                CCTV PROJECTION
              </span>
            </div>

            {/* Video Viewport */}
            <div className="relative flex-1 min-h-[320px] sm:min-h-[380px] bg-slate-950 rounded-xl overflow-hidden border-2 border-[#00E5FF]/30 flex items-center justify-center">
              {videoPreviewUrl ? (
                <video
                  src={videoPreviewUrl}
                  controls
                  className="w-full h-full object-contain max-h-[460px]"
                />
              ) : (
                <div className="text-center p-6 text-slate-400 space-y-3">
                  <FileVideo className="w-14 h-14 mx-auto text-[#00E5FF]/40" />
                  <p className="text-sm font-mono font-bold text-white">No video loaded for monitoring</p>
                  <p className="text-xs text-slate-400">
                    Upload a traffic footage clip above to initiate Co-DETR detection
                  </p>
                </div>
              )}

              {/* Simulated Hologram Bounding Box Overlay if processing */}
              {isProcessing && (
                <div className="absolute inset-0 pointer-events-none border-2 border-[#00E5FF] scanline-overlay">
                  <div className="absolute top-4 left-4 bg-slate-950/90 px-3 py-1.5 rounded-lg border-2 border-[#00E5FF] text-xs font-mono font-bold text-[#00E5FF] shadow-neon-cyan animate-pulse">
                    CO-DETR INFERENCE ACTIVE
                  </div>
                  {/* Bounding Box 1 */}
                  <div className="absolute top-1/3 left-1/4 w-36 h-48 border-2 border-dashed border-[#00E5FF] rounded shadow-[0_0_12px_#00E5FF]">
                    <span className="absolute -top-6 left-0 bg-[#00E5FF] text-slate-950 font-black text-[10px] px-1.5 py-0.5 font-mono rounded">
                      Motorbike [98.2%]
                    </span>
                  </div>
                  {/* Bounding Box 2 (Helmet) */}
                  <div className="absolute top-[26%] left-[28%] w-14 h-14 border-2 border-[#FF3158] rounded-full shadow-neon-red animate-ping opacity-75" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detection Results Area */}
      {result && (
        <div className="neon-glass-panel rounded-2xl p-6 border-2 border-[#00FF9C]/60 shadow-[0_0_35px_rgba(0,255,156,0.25)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b-2 border-white/10">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#00FF9C] drop-shadow-[0_0_8px_#00FF9C]" />
              <h2 className="font-tech text-xl sm:text-2xl font-black tracking-wider text-white uppercase text-glow-green">
                Detection Results & Violation Audit
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#00E5FF] bg-[#00E5FF]/15 px-3 py-1 rounded-md border border-[#00E5FF]/40">
              PROCESSED: {new Date(result.processedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* KPI Summary Cards for this video */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0A1A35]/90 border-2 border-[#00E5FF] rounded-xl p-4 shadow-neon-cyan">
              <div className="text-slate-300 text-xs font-semibold flex items-center gap-1.5 mb-1">
                <Bike className="w-4 h-4 text-[#00E5FF]" /> Motorcycles Detected
              </div>
              <div className="text-3xl font-black font-tech text-[#00E5FF] text-glow-cyan">
                {result.totalMotorcycles}
              </div>
            </div>

            <div className="bg-[#2D0914]/90 border-2 border-[#FF3158] rounded-xl p-4 shadow-neon-red">
              <div className="text-slate-300 text-xs font-semibold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-[#FF3158]" /> Violations Found
              </div>
              <div className="text-3xl font-black font-tech text-[#FF3158] text-glow-red">
                {result.totalViolations}
              </div>
            </div>

            <div className="bg-[#062419]/90 border-2 border-[#00FF9C] rounded-xl p-4 shadow-neon-green">
              <div className="text-slate-300 text-xs font-semibold flex items-center gap-1.5 mb-1">
                <Percent className="w-4 h-4 text-[#00FF9C]" /> Compliance Rate
              </div>
              <div className="text-3xl font-black font-tech text-[#00FF9C] text-glow-green">
                {result.complianceRate}%
              </div>
            </div>

            <div className="bg-[#1A0A33]/90 border-2 border-[#B44CFF] rounded-xl p-4 shadow-neon-purple">
              <div className="text-slate-300 text-xs font-semibold flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-[#B44CFF]" /> Frames Evaluated
              </div>
              <div className="text-3xl font-black font-tech text-white">
                {result.framesProcessed} <span className="text-xs font-normal text-slate-400">({result.fps} FPS)</span>
              </div>
            </div>
          </div>

          {/* Timeline violation events */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
              Video Timestamp Infraction Markers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {result.violationsBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gradient-to-br from-[#2D0914] to-[#17050A] border-2 border-[#FF3158] shadow-neon-red space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#FF3158] font-black text-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      {item.time}
                    </span>
                    <span className="font-mono text-[#00E5FF] font-black text-xs text-glow-cyan">{item.confidence}% CONF</span>
                  </div>
                  <div className="text-sm font-bold text-white">{item.violation}</div>
                  <div className="text-xs text-slate-300 font-mono flex justify-between pt-1 border-t border-white/10">
                    <span className="font-bold text-white">{item.vehicle}</span>
                    <span className="text-[#00E5FF]">{item.location}</span>
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
