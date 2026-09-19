import React, { useState, useRef, useEffect } from 'react';
import { VisionScanner3D, ScannerState } from '../components/VisionScanner3D';
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
  Sparkles,
  Box,
  Eye
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
  const [scannerState, setScannerState] = useState<ScannerState>('IDLE');
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [scanStepLabel, setScanStepLabel] = useState<string>('');

  // 2D Canvas viewer controls
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
    setScannerState('READY');

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
      if (!res.ok) throw new Error('Sample image not found');
      const blob = await res.blob();
      const file = new File([blob], 'sample_traffic.jpg', { type: 'image/jpeg' });
      handleFileChange(file);
    } catch {
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

  // Run Real Co-DETR GPU Inference through multi-state workflow
  const runDetection = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setSelectedDetectionIdx(null);

    // Progressive UI feedback steps
    setScannerState('SCANNING');
    setScanStepLabel('1/3: Reading image frames & tensor formatting...');

    try {
      setTimeout(() => {
        setScannerState('ANALYZING');
        setScanStepLabel('2/3: Evaluating 150 Co-DETR queries on Tesla T4...');
      }, 400);

      const resp = await api.detectImage(selectedFile, confidenceThreshold);

      setScanStepLabel('3/3: Rendering bounding boxes & compliance status...');
      setPrediction(resp);
      setScannerState('RESULT_READY');
    } catch (err: any) {
      setScannerState('ERROR');
      setErrorMsg(err.message || 'AI inference request failed.');
    } finally {
      setIsProcessing(false);
      setScanStepLabel('');
    }
  };

  // 2D Canvas Renderer for precision bounding box inspection
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (prediction && prediction.detections) {
      prediction.detections.forEach((det, idx) => {
        const [x1, y1, x2, y2] = det.bbox;
        const width = x2 - x1;
        const height = y2 - y1;
        const isSelected = selectedDetectionIdx === idx;

        const strokeColor = det.violation ? '#EF4444' : det.class_name === 'bike' ? '#2563EB' : '#10B981';
        const fillColor = det.violation ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';

        ctx.strokeStyle = isSelected ? '#F59E0B' : strokeColor;
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.25)' : fillColor;
        ctx.fillRect(x1, y1, width, height);
        ctx.strokeRect(x1, y1, width, height);

        // Modern tag pill
        const labelText = `${det.display_name} ${(det.confidence * 100).toFixed(0)}%`;
        ctx.font = '600 12px Inter, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const padding = 6;
        const pillHeight = 22;

        ctx.fillStyle = isSelected ? '#F59E0B' : strokeColor;
        ctx.fillRect(x1, Math.max(0, y1 - pillHeight), textMetrics.width + padding * 2, pillHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, x1 + padding, Math.max(15, y1 - 6));
      });
    }
  };

  useEffect(() => {
    if (viewMode === '2D') {
      renderCanvas();
    }
  }, [prediction, selectedDetectionIdx, viewMode]);

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setPrediction(null);
    setSelectedDetectionIdx(null);
    setErrorMsg(null);
    setZoomLevel(1);
    setScannerState('IDLE');
    imageRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Co-DETR Computer Vision Workspace
            </h1>
            <span className="badge-compliant px-2.5 py-0.5 rounded-full text-xs font-semibold">
              Live GPU Ready
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            Real-time multi-rider detection, vehicle localization, and protective helmet violation tracking.
          </p>
        </div>

        {/* Model Hardware Info */}
        <div className="flex items-center gap-2.5 text-xs bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-xs">
          <Cpu className="w-4 h-4 text-blue-600" />
          <div>
            <div className="text-gray-900 font-bold">{modelStatus?.gpu_name || 'Tesla T4 (Cloud GPU)'}</div>
            <div className="text-gray-500 text-[11px]">VRAM: {modelStatus?.memory_allocated_mb || '149.6'} MB • 7 Target Classes</div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload Controls & Sensitivity (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Upload Card */}
          <div className="light-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                INPUT SURVEILLANCE
              </span>
              <FileImage className="w-4 h-4 text-blue-600" />
            </div>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-gray-800">Choose Traffic Photo</div>
              <div className="text-[11px] text-gray-500 mt-1">JPEG, PNG, WEBP</div>

              <button
                type="button"
                className="mt-3 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 shadow-xs"
              >
                Browse Files
              </button>
            </div>

            <button
              type="button"
              onClick={loadSampleImage}
              className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Traffic Test Photo</span>
            </button>

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

            {/* Confidence Threshold Slider */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Confidence Filter</span>
                </span>
                <span className="font-mono font-bold text-blue-600">
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
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>10% (Recall)</span>
                <span>80% (Precision)</span>
              </div>
            </div>

            {/* Run Inference Action Button */}
            {imagePreviewUrl && (
              <div className="pt-2">
                <button
                  disabled={isProcessing}
                  onClick={runDetection}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isProcessing ? 'Processing...' : 'Run Co-DETR Scan'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Column: The REAL IMAGE inside 3D Scanner or 2D Canvas (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="light-card p-4 flex flex-col space-y-3">
            {/* Viewport Header with 3D / 2D Toggle */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 truncate max-w-[200px]">
                  {selectedFile ? selectedFile.name : 'Surveillance Viewport'}
                </span>
                {prediction && (
                  <span className="badge-blue px-2 py-0.5 rounded-md text-[11px] font-mono">
                    {prediction.image_width}×{prediction.image_height}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Selector */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                  <button
                    onClick={() => setViewMode('3D')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                      viewMode === '3D' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Box className="w-3 h-3" />
                    <span>3D Scanner</span>
                  </button>
                  <button
                    onClick={() => setViewMode('2D')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                      viewMode === '2D' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>2D Precision</span>
                  </button>
                </div>

                {imagePreviewUrl && (
                  <button
                    onClick={clearImage}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Clear Image"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress Step Banner when scanning */}
            {isProcessing && scanStepLabel && (
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium flex items-center gap-2 animate-pulse">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                <span>{scanStepLabel}</span>
              </div>
            )}

            {/* Center Visual Viewport */}
            {viewMode === '3D' ? (
              <div className="w-full h-[460px] rounded-xl overflow-hidden shadow-xs">
                <VisionScanner3D
                  imageUrl={imagePreviewUrl}
                  detections={prediction?.detections || []}
                  state={scannerState}
                  selectedIdx={selectedDetectionIdx}
                  onSelectDetection={setSelectedDetectionIdx}
                />
              </div>
            ) : (
              /* 2D High Resolution Precision Canvas View */
              <div className="relative overflow-auto rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center min-h-[460px] max-h-[540px]">
                {!imagePreviewUrl ? (
                  <div className="text-center text-gray-400 text-xs">
                    No image loaded. Upload or select sample photo to inspect.
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out'
                    }}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  />
                )}

                {/* 2D Zoom Controls */}
                {imagePreviewUrl && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-lg border border-gray-200 shadow-sm text-xs">
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                      className="p-1 hover:bg-gray-100 rounded text-gray-700"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 hover:bg-gray-100 rounded text-gray-700"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="px-1.5 py-0.5 hover:bg-gray-100 rounded text-gray-700 text-[10px] font-mono"
                    >
                      100%
                    </button>
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Structured Detection Summary & Bounding Box List (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Quick Metric Tiles */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="light-card p-3.5">
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 font-medium">
                <Bike className="w-3.5 h-3.5 text-blue-600" />
                Motorcycles
              </div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {prediction ? prediction.summary.vehicles : '—'}
              </div>
            </div>

            <div className="light-card p-3.5">
              <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Helmeted
              </div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {prediction ? prediction.summary.helmet_detected : '—'}
              </div>
            </div>

            <div className="light-card p-3.5">
              <div className="text-[11px] text-red-700 flex items-center gap-1.5 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                Violations
              </div>
              <div className="text-xl font-bold text-red-600 mt-1">
                {prediction ? prediction.summary.violations : '—'}
              </div>
            </div>

            <div className="light-card p-3.5">
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Latency
              </div>
              <div className="text-xl font-bold text-blue-700 font-mono mt-1">
                {prediction ? `${prediction.inference_time_ms}ms` : '—'}
              </div>
            </div>
          </div>

          {/* Detections List Card */}
          <div className="light-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase">
                IDENTIFIED TARGETS {prediction && `(${prediction.detections.length})`}
              </h3>
              {prediction && (
                <span className="text-[11px] font-mono text-gray-400">
                  GPU Warm
                </span>
              )}
            </div>

            {!prediction ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Upload a traffic photo to inspect real Co-DETR detections and compliance status.
              </div>
            ) : prediction.detections.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-xs">
                No objects met the current threshold of {(confidenceThreshold * 100).toFixed(0)}%.
                <br />
                Try lowering the threshold slider.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto pr-1 space-y-1">
                {prediction.detections.map((det: DetectionItem, idx: number) => {
                  const isSelected = selectedDetectionIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDetectionIdx(isSelected ? null : idx)}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-amber-50 border border-amber-300 shadow-xs'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            det.violation
                              ? 'bg-red-50 text-red-600'
                              : det.class_name === 'bike'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {det.violation ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="text-gray-900 text-xs font-semibold">{det.display_name}</div>
                          <div className="text-[10px] font-mono text-gray-400">
                            Box: [{det.bbox.map((v) => Math.round(v)).join(', ')}]
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold font-mono text-gray-900">
                          {(det.confidence * 100).toFixed(1)}%
                        </div>
                        <span
                          className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            det.violation
                              ? 'badge-violation'
                              : 'badge-compliant'
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
