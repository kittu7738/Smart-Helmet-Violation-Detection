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

  const startDetection = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(5);
    setCurrentStep('Initializing AI pipeline...');
    setErrorMsg(null);

    const steps = [
      { p: 20, text: 'Extracting video frames at 10.0 FPS...' },
      { p: 45, text: 'Running Co-DETR Swin-L two-wheeler backbone...' },
      { p: 70, text: 'Executing rider-helmet association head...' },
      { p: 90, text: 'Flagging non-compliance & generating violation markers...' },
      { p: 100, text: 'Audit analysis complete.' },
    ];

    let stepIndex = 0;
    progressIntervalRef.current = window.setInterval(() => {
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex].p);
        setCurrentStep(steps[stepIndex].text);
        stepIndex++;
      }
    }, 600);

    try {
      const res = await api.uploadVideo(selectedFile);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(100);
      setCurrentStep('Analysis complete.');
      setResult(res);
    } catch (err: any) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setErrorMsg(err.message || 'Error processing video with AI pipeline');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopDetection = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsProcessing(false);
    setProgress(0);
    setCurrentStep('Analysis aborted by user.');
  };

  const resetAll = () => {
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setResult(null);
    setProgress(0);
    setIsProcessing(false);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
            AI Video Detection Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload traffic surveillance footage to identify motorcycles, riders, and helmet violations.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-mono font-medium px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
            POST /api/detection/video
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
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
              className={`p-8 sm:p-10 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-blue-400 bg-white shadow-sm'
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
                <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Drag & drop surveillance video here
                  </p>
                  <p className="text-xs text-slate-500">
                    or <span className="text-blue-600 underline font-medium">browse your computer</span>
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                  MP4, AVI, MKV up to 500MB
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <FileVideo className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 truncate max-w-[220px]">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  onClick={resetAll}
                  disabled={isProcessing}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  title="Remove video"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {!isProcessing ? (
                  <button
                    onClick={startDetection}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Co-DETR Detection</span>
                  </button>
                ) : (
                  <button
                    onClick={stopDetection}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Abort Detection</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Processing Progress Bar */}
          {isProcessing && (
            <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex justify-between text-xs font-mono text-slate-700 font-medium">
                <span>Inference Progress</span>
                <span className="text-blue-600 font-bold">{progress}%</span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-xs font-mono text-slate-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>{currentStep}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Video Preview */}
        <div className="lg:col-span-7">
          <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Surveillance Feed Monitor
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                CCTV Feed
              </span>
            </div>

            {/* Video Viewport */}
            <div className="relative flex-1 min-h-[320px] sm:min-h-[380px] bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
              {videoPreviewUrl ? (
                <video
                  src={videoPreviewUrl}
                  controls
                  className="w-full h-full object-contain max-h-[460px]"
                />
              ) : (
                <div className="text-center p-6 text-slate-400 space-y-2">
                  <FileVideo className="w-12 h-12 mx-auto text-slate-500" />
                  <p className="text-sm font-semibold text-slate-200">No video loaded for monitoring</p>
                  <p className="text-xs text-slate-400">
                    Upload traffic surveillance footage clip to initiate AI analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detection Results Area */}
      {result && (
        <div className="rounded-xl p-6 bg-white border border-green-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 uppercase">
                Detection Results & Audit Summary
              </h2>
            </div>
            <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
              Processed: {new Date(result.processedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* KPI Summary Cards for this video */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mb-1">
                <Bike className="w-4 h-4 text-blue-600" /> Motorcycles Detected
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                {result.totalMotorcycles}
              </div>
            </div>

            <div className="bg-red-50/60 border border-red-200 rounded-lg p-4">
              <div className="text-red-700 text-xs font-semibold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Violations Found
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-red-600 font-mono">
                {result.totalViolations}
              </div>
            </div>

            <div className="bg-green-50/60 border border-green-200 rounded-lg p-4">
              <div className="text-green-700 text-xs font-semibold flex items-center gap-1.5 mb-1">
                <Percent className="w-4 h-4 text-green-600" /> Compliance Rate
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-700 font-mono">
                {result.complianceRate}%
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-purple-600" /> Frames Evaluated
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                {result.framesProcessed} <span className="text-xs font-normal text-slate-400">({result.fps} FPS)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
