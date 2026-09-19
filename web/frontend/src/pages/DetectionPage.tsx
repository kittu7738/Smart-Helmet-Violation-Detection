import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Bike,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  ZoomIn,
  ZoomOut,
  FileImage,
  Cpu,
  Clock,
  Sparkles
} from 'lucide-react';
import { api, ImagePredictionResponse, DetectionItem, ModelStatusResponse } from '../services/api';

export const DetectionPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prediction, setPrediction] = useState<ImagePredictionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.25);
  const [selectedDetectionIdx, setSelectedDetectionIdx] = useState<number | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Viewer controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    api.getModelStatus().then((status) => {
      if (status) setModelStatus(status);
    });
  }, []);

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    setSelectedFile(file);
    setPrediction(null);
    setSelectedDetectionIdx(null);
    setZoomLevel(1);

    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      imageRef.current = img;
      renderCanvas();
    };
  };

  const loadSampleImage = async () => {
    try {
      const res = await fetch('/sample_traffic.jpg');
      if (!res.ok) throw new Error('Sample image file not found');
      const blob = await res.blob();
      const file = new File([blob], 'sample_traffic.jpg', { type: 'image/jpeg' });
      handleFileChange(file);
    } catch (e: any) {
      setErrorMsg('Could not load sample traffic image.');
    }
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

  const runDetection = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setSelectedDetectionIdx(null);

    try {
      const resp = await api.detectImage(selectedFile, confidenceThreshold);
      setPrediction(resp);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI inference request failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Redraw canvas with image and bounding boxes
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw background image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // If predictions exist, draw bounding boxes
    if (prediction && prediction.detections) {
      prediction.detections.forEach((det, idx) => {
        const [x1, y1, x2, y2] = det.bbox;
        const width = x2 - x1;
        const height = y2 - y1;
        const isSelected = selectedDetectionIdx === idx;

        // Colors
        let strokeColor = det.violation ? '#EF4444' : det.class_name === 'bike' ? '#3B82F6' : '#10B981';
        let fillColor = det.violation ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';

        if (isSelected) {
          strokeColor = '#F59E0B';
          fillColor = 'rgba(245, 158, 11, 0.3)';
        }

        // Box border & fill
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isSelected ? 4 : 2.5;
        ctx.fillStyle = fillColor;
        ctx.fillRect(x1, y1, width, height);
        ctx.strokeRect(x1, y1, width, height);

        // Label pill
        const labelText = `${det.display_name} ${(det.confidence * 100).toFixed(0)}%`;
        ctx.font = 'bold 13px Inter, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const padding = 6;
        const pillHeight = 22;

        ctx.fillStyle = strokeColor;
        ctx.fillRect(x1, Math.max(0, y1 - pillHeight), textMetrics.width + padding * 2, pillHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, x1 + padding, Math.max(15, y1 - 6));
      });
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [prediction, selectedDetectionIdx]);

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setPrediction(null);
    setSelectedDetectionIdx(null);
    setErrorMsg(null);
    setZoomLevel(1);
    imageRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Co-DETR Image Detection</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live GPU Engine
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Upload traffic surveillance footage to identify motorcycles, riders, and helmet violations in real time.
          </p>
        </div>

        {/* Model Hardware Info */}
        <div className="flex items-center gap-3 text-xs bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-slate-200 font-medium">{modelStatus?.gpu_name || 'Tesla T4 GPU'}</div>
            <div className="text-slate-500">VRAM: {modelStatus?.memory_allocated_mb || '149.6'} MB • 7 Target Classes</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload/Viewer Area (Left) + Results & Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Canvas & Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
            {/* Viewer Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-blue-400" />
                <span className="text-slate-200 font-medium truncate max-w-[200px]">
                  {selectedFile ? selectedFile.name : 'No image loaded'}
                </span>
              </div>

              {imagePreviewUrl && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors text-[11px]"
                  >
                    Fit
                  </button>
                  <div className="h-4 w-px bg-slate-800 mx-1" />
                  <button
                    onClick={clearImage}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-lg transition-colors"
                    title="Clear"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Canvas / Drag & Drop Display Area */}
            {!imagePreviewUrl ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[380px] ${
                  dragActive
                    ? 'border-cyan-500 bg-cyan-500/5'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-white font-semibold text-lg">Upload Traffic Image</h3>
                <p className="text-slate-400 text-xs mt-1.5 max-w-sm">
                  Drag and drop your image here or browse files. Supported: JPG, JPEG, PNG, WEBP.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                  >
                    Browse Files
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSampleImage();
                    }}
                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium rounded-xl border border-blue-500/30 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Try Sample Image</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative overflow-auto rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-center min-h-[420px] max-h-[560px]">
                <canvas
                  ref={canvasRef}
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out'
                  }}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />

                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                    <div className="text-white font-medium text-sm">Running Co-DETR GPU Forward Pass...</div>
                    <div className="text-slate-400 text-xs">Evaluating 150 object queries on Tesla T4</div>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {/* Action Bar Beneath Canvas */}
            {imagePreviewUrl && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Threshold: {(confidenceThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.90"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <button
                  disabled={isProcessing}
                  onClick={runDetection}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Detection
                </button>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Structured Detection Summary & Bounding Box List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-blue-400" />
                Motorcycles
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {prediction ? prediction.summary.vehicles : '—'}
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Helmet Compliant
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {prediction ? prediction.summary.helmet_detected : '—'}
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Violations
              </div>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {prediction ? prediction.summary.violations : '—'}
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Latency
              </div>
              <div className="text-2xl font-bold text-cyan-300 mt-1">
                {prediction ? `${prediction.inference_time_ms} ms` : '—'}
              </div>
            </div>
          </div>

          {/* Detections List Card */}
          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">
                Detected Objects {prediction && `(${prediction.detections.length})`}
              </h3>
              {prediction && (
                <span className="text-[11px] text-slate-400">
                  {prediction.image_width} × {prediction.image_height} px
                </span>
              )}
            </div>

            {!prediction ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Upload an image and run detection to inspect bounding boxes and helmet compliance.
              </div>
            ) : prediction.detections.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No objects met the current confidence threshold of {(confidenceThreshold * 100).toFixed(0)}%.
                <br />
                Try lowering the threshold slider.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-[380px] overflow-y-auto mt-2 pr-1">
                {prediction.detections.map((det: DetectionItem, idx: number) => {
                  const isSelected = selectedDetectionIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDetectionIdx(isSelected ? null : idx)}
                      className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 mt-1.5 ${
                        isSelected
                          ? 'bg-amber-500/15 border border-amber-500/30'
                          : 'hover:bg-slate-800/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            det.violation
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : det.class_name === 'bike'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {det.violation ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-white text-xs font-medium">{det.display_name}</div>
                          <div className="text-[11px] text-slate-400">
                            Box: [{det.bbox.map((v) => Math.round(v)).join(', ')}]
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-white">
                          {(det.confidence * 100).toFixed(1)}%
                        </div>
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            det.violation
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {det.violation ? 'VIOLATION' : 'COMPLIANT'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
