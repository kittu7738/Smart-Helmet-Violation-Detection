import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Play,
  RotateCcw,
  AlertTriangle,
  Bike,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  ZoomIn,
  ZoomOut,
  FileImage,
  Cpu,
  Clock,
  Download,
  Check,
  Info
} from 'lucide-react';
import { api, ImagePredictionResponse, DetectionItem, ModelStatusResponse } from '../services/api';

export const DetectionPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prediction, setPrediction] = useState<ImagePredictionResponse | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.25);
  const [selectedDetectionIdx, setSelectedDetectionIdx] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getModelStatus().then((status) => {
      if (isMounted && status) setModelStatus(status);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setPrediction(null);
    setSelectedDetectionIdx(null);
    setNoticeMsg(null);

    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      imageRef.current = img;
      setTimeout(() => renderCanvas(), 50);
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
      setNoticeMsg('Could not load sample traffic image.');
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

  // 2D Canvas Renderer for precision bounding box inspection
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (showBoxes && prediction && prediction.detections) {
      prediction.detections.forEach((det, idx) => {
        const [x1, y1, x2, y2] = det.bbox;
        const width = x2 - x1;
        const height = y2 - y1;
        const isSelected = selectedDetectionIdx === idx;

        const strokeColor = det.violation
          ? '#DC2626'
          : det.class_name === 'bike'
          ? '#2563EB'
          : '#16A34A';
        const fillColor = det.violation
          ? 'rgba(220, 38, 38, 0.16)'
          : det.class_name === 'bike'
          ? 'rgba(37, 99, 235, 0.12)'
          : 'rgba(22, 163, 74, 0.16)';

        ctx.strokeStyle = isSelected ? '#F59E0B' : strokeColor;
        ctx.lineWidth = isSelected ? 4 : 2.5;
        ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.25)' : fillColor;
        ctx.fillRect(x1, y1, width, height);
        ctx.strokeRect(x1, y1, width, height);

        if (showLabels) {
          const labelText = `${det.display_name} ${(det.confidence * 100).toFixed(0)}%`;
          ctx.font = '600 13px Inter, sans-serif';
          const textMetrics = ctx.measureText(labelText);
          const padding = 6;
          const pillHeight = 24;

          ctx.fillStyle = isSelected ? '#F59E0B' : strokeColor;
          ctx.fillRect(x1, Math.max(0, y1 - pillHeight), textMetrics.width + padding * 2, pillHeight);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(labelText, x1 + padding, Math.max(16, y1 - 7));
        }
      });
    }
  }, [prediction, selectedDetectionIdx, showBoxes, showLabels]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Run Real Co-DETR GPU Inference with reliable offline fallback
  const runDetection = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setNoticeMsg(null);
    setSelectedDetectionIdx(null);

    try {
      const resp = await api.detectImage(selectedFile, confidenceThreshold);
      setPrediction(resp);
      setNoticeMsg(null);
    } catch {
      // Graceful fallback to benchmark simulation if Colab tunnel is offline
      const imgW = imageRef.current?.naturalWidth || 1280;
      const imgH = imageRef.current?.naturalHeight || 720;
      const fallbackResp = api.getSimulatedDetection(imgW, imgH);
      setPrediction(fallbackResp);
      setNoticeMsg(
        'GPU backend is currently offline. Loaded baseline detection result for inspection. Configure your Colab Tunnel URL in the header to run live inference.'
      );
    } finally {
      setIsProcessing(false);
      setTimeout(() => renderCanvas(), 50);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setPrediction(null);
    setSelectedDetectionIdx(null);
    setNoticeMsg(null);
    setZoomLevel(1);
    imageRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadAnnotatedImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `annotated-${selectedFile?.name || 'traffic'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Image Detection Workspace
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Test traffic photos with Co-DETR for multi-rider localization and helmet violation classification.
          </p>
        </div>

        {/* Model Hardware Info */}
        <div className="flex items-center gap-2.5 text-xs bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-xs">
          <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <div className="text-gray-900 font-semibold">{modelStatus?.gpu_name || 'Tesla T4 (Cloud GPU)'}</div>
            <div className="text-gray-500 text-[11px]">Co-DETR ResNet-18 • 7 Target Classes</div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Source & Controls (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Input Source
              </span>
              <FileImage className="w-4 h-4 text-gray-500" />
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/60'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-gray-800">Select Traffic Photo</div>
              <div className="text-[11px] text-gray-400 mt-0.5">JPEG, PNG, WEBP</div>

              <button
                type="button"
                className="mt-3 px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-md border border-gray-200 shadow-xs"
              >
                Browse Files
              </button>
            </div>

            <button
              type="button"
              onClick={loadSampleImage}
              className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Load Sample Traffic Photo</span>
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
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sliders className="w-3.5 h-3.5 text-gray-500" />
                  <span>Confidence Threshold</span>
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
                <span>10% (High Recall)</span>
                <span>80% (High Precision)</span>
              </div>
            </div>

            {/* Run Inference Action Button */}
            {imagePreviewUrl && (
              <div className="pt-2">
                <button
                  disabled={isProcessing}
                  onClick={runDetection}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isProcessing ? 'Running Inference...' : 'Run Co-DETR Detection'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Precision Inspection Canvas (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col space-y-3 shadow-xs">
            {/* Viewport Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 truncate max-w-[220px]">
                  {selectedFile ? selectedFile.name : 'Image Viewport'}
                </span>
                {prediction && (
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-mono border border-gray-200">
                    {prediction.image_width}×{prediction.image_height}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {imagePreviewUrl && (
                  <button
                    onClick={clearImage}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs"
                    title="Clear Image"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notice / Fallback Banner */}
            {noticeMsg && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{noticeMsg}</span>
              </div>
            )}

            {/* Viewport Content (Pure 2D High-Resolution Precision Canvas) */}
            <div className="relative overflow-hidden rounded-lg bg-gray-900 flex items-center justify-center min-h-[440px] max-h-[520px]">
              {!imagePreviewUrl ? (
                <div className="text-center text-gray-400 text-xs p-8">
                  No image loaded. Upload a traffic photo to start detection.
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                  <canvas
                    ref={canvasRef}
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out'
                    }}
                    className="max-w-full max-h-[480px] object-contain rounded shadow-md cursor-crosshair"
                  />
                </div>
              )}

              {/* Canvas Overlay Controls */}
              {imagePreviewUrl && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  {/* Layer Toggles */}
                  <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border border-gray-200 shadow-sm text-xs pointer-events-auto">
                    <button
                      onClick={() => setShowBoxes(!showBoxes)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        showBoxes ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Boxes {showBoxes ? 'On' : 'Off'}
                    </button>
                    <button
                      onClick={() => setShowLabels(!showLabels)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        showLabels ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Labels {showLabels ? 'On' : 'Off'}
                    </button>
                  </div>

                  {/* Zoom & Export */}
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-lg border border-gray-200 shadow-sm text-xs pointer-events-auto">
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
                    <div className="w-px h-3 bg-gray-200 mx-0.5" />
                    <button
                      onClick={downloadAnnotatedImage}
                      className="p-1 hover:bg-gray-100 rounded text-blue-600"
                      title="Download Annotated Image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Structured Detection Summary & Bounding Box List (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Quick Metric Tiles */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 font-medium">
                <Bike className="w-3.5 h-3.5 text-blue-600" />
                Motorcycles
              </div>
              <div className="text-lg font-bold text-gray-900 mt-1">
                {prediction ? prediction.summary.vehicles : '—'}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Compliant
              </div>
              <div className="text-lg font-bold text-emerald-700 mt-1">
                {prediction ? prediction.summary.helmet_detected : '—'}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-red-700 flex items-center gap-1.5 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                Violations
              </div>
              <div className="text-lg font-bold text-red-600 mt-1">
                {prediction ? prediction.summary.violations : '—'}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-gray-600" />
                Latency
              </div>
              <div className="text-lg font-bold text-gray-900 font-mono mt-1">
                {prediction ? `${prediction.inference_time_ms}ms` : '—'}
              </div>
            </div>
          </div>

          {/* Detections List Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase">
                Detected Objects {prediction && `(${prediction.detections.length})`}
              </h3>
              {prediction && (
                <span className="text-[11px] font-mono text-gray-400">
                  {prediction.device}
                </span>
              )}
            </div>

            {!prediction ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Upload a traffic photo to inspect detected riders, helmets, and motorcycles.
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
                      className={`p-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-amber-50 border border-amber-300 shadow-xs'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
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
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="text-gray-900 text-xs font-semibold">{det.display_name}</div>
                          <div className="text-[10px] font-mono text-gray-400">
                            [{det.bbox.map((v) => Math.round(v)).join(', ')}]
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
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
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
