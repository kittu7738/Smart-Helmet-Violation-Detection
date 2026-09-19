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
    return () => { isMounted = false; };
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
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
  };

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
        const strokeColor = det.violation ? '#DC2626' : det.class_name === 'bike' ? '#2563EB' : '#16A34A';
        const fillColor = det.violation ? 'rgba(220,38,38,0.16)' : det.class_name === 'bike' ? 'rgba(37,99,235,0.12)' : 'rgba(22,163,74,0.16)';
        ctx.strokeStyle = isSelected ? '#F59E0B' : strokeColor;
        ctx.lineWidth = isSelected ? 4 : 2.5;
        ctx.fillStyle = isSelected ? 'rgba(245,158,11,0.25)' : fillColor;
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

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

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
      const imgW = imageRef.current?.naturalWidth || 1280;
      const imgH = imageRef.current?.naturalHeight || 720;
      const fallbackResp = api.getSimulatedDetection(imgW, imgH);
      setPrediction(fallbackResp);
      setNoticeMsg('GPU backend is currently offline. Loaded baseline detection result. Configure your Colab Tunnel URL in header settings to run live inference.');
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── PAGE HEADER ──────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #4F46E5 50%, #7C3AED 100%)',
        borderRadius: '20px',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(79,70,229,0.3)'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>
            Image Detection
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: '5px 0 0', fontWeight: 500 }}>
            Upload a photo — Co-DETR runs multi-rider detection &amp; helmet classification
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 16px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <Cpu size={16} color="#A5B4FC" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{modelStatus?.gpu_name || 'Tesla T4 (Cloud GPU)'}</div>
            <div style={{ fontSize: '11px', color: '#A5B4FC', fontFamily: 'monospace' }}>Co-DETR · ResNet-18 · 7 Classes</div>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 240px', gap: '16px', alignItems: 'start' }}>

        {/* ── LEFT PANEL: Upload + Controls ─────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Upload Card */}
          <div style={{
            background: '#fff',
            border: '2px solid #E0E7FF',
            borderRadius: '18px',
            padding: '18px',
            boxShadow: '0 4px 16px rgba(79,70,229,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #EEF2FF' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4F46E5' }}>Input Source</span>
              <FileImage size={15} color="#6366F1" />
            </div>

            {/* Drop zone */}
            <div
              onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? '#6366F1' : '#C7D2FE'}`,
                borderRadius: '14px',
                padding: '20px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragActive ? '#EEF2FF' : '#F5F7FF',
                transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99,102,241,0.35)'
              }}>
                <UploadCloud size={20} color="#fff" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E1B4B' }}>Select Traffic Photo</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>JPEG, PNG, WEBP</div>
              <button type="button" style={{
                marginTop: '4px', padding: '6px 14px',
                background: '#fff', border: '1.5px solid #C7D2FE',
                borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#4F46E5', cursor: 'pointer'
              }}>Browse Files</button>
            </div>

            <button type="button" onClick={loadSampleImage} style={{
              width: '100%', marginTop: '10px', padding: '9px',
              background: 'linear-gradient(90deg, #EEF2FF, #F5F3FF)',
              border: '1.5px solid #C7D2FE', borderRadius: '10px',
              fontSize: '12px', fontWeight: 700, color: '#4F46E5', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
              Load Sample Photo
            </button>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg" style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files && e.target.files[0]) handleFileChange(e.target.files[0]); }} />
          </div>

          {/* Confidence Slider Card */}
          <div style={{
            background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
            border: '2px solid #FDE68A',
            borderRadius: '18px',
            padding: '16px 18px',
            boxShadow: '0 4px 16px rgba(245,158,11,0.12)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#78350F' }}>
                <Sliders size={13} color="#D97706" />
                Confidence
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 900, color: '#D97706' }}>
                {(confidenceThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input type="range" min="0.10" max="0.80" step="0.05"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#D97706', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#92400E', fontWeight: 600, marginTop: '4px', fontFamily: 'monospace' }}>
              <span>10% Recall</span>
              <span>80% Precision</span>
            </div>
          </div>

          {/* Run Button */}
          {imagePreviewUrl && (
            <button disabled={isProcessing} onClick={runDetection} style={{
              width: '100%', padding: '13px',
              background: isProcessing
                ? 'linear-gradient(135deg, #9CA3AF, #6B7280)'
                : 'linear-gradient(135deg, #059669, #0D9488)',
              border: 'none', borderRadius: '14px',
              fontSize: '14px', fontWeight: 800, color: '#fff', cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: isProcessing ? 'none' : '0 4px 16px rgba(5,150,105,0.4)',
              transition: 'all 0.2s'
            }}>
              <Play size={16} fill="currentColor" />
              {isProcessing ? 'Running...' : 'Run Detection'}
            </button>
          )}
        </div>

        {/* ── CENTER: Canvas Viewport ────────────────────────────── */}
        <div style={{
          background: '#fff',
          border: '2px solid #E5E7EB',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)'
        }}>
          {/* Viewport header bar */}
          <div style={{
            background: 'linear-gradient(90deg, #0F172A, #1E293B)',
            padding: '12px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', fontFamily: 'monospace' }}>
              {selectedFile ? selectedFile.name : 'No image loaded'}
              {prediction && <span style={{ color: '#60A5FA', marginLeft: '8px' }}>{prediction.image_width}×{prediction.image_height}</span>}
            </span>
            {imagePreviewUrl && (
              <button onClick={clearImage} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', padding: '4px 10px',
                fontSize: '11px', fontWeight: 700, color: '#F87171', cursor: 'pointer'
              }}>
                <RotateCcw size={11} /> Reset
              </button>
            )}
          </div>

          {/* Notice */}
          {noticeMsg && (
            <div style={{
              margin: '12px 16px 0',
              padding: '10px 14px',
              background: '#FFFBEB', border: '1.5px solid #FDE68A',
              borderRadius: '10px', fontSize: '12px', color: '#78350F',
              display: 'flex', gap: '8px', alignItems: 'flex-start'
            }}>
              <Info size={14} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
              {noticeMsg}
            </div>
          )}

          {/* Canvas area */}
          <div style={{
            background: '#0F172A',
            minHeight: '460px', maxHeight: '520px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative'
          }}>
            {!imagePreviewUrl ? (
              <div style={{ textAlign: 'center', color: '#475569', padding: '40px' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '16px',
                  background: 'rgba(99,102,241,0.15)', border: '2px dashed rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <UploadCloud size={26} color="#6366F1" />
                </div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', margin: 0 }}>
                  Upload an image to start detection
                </p>
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '10px' }}>
                <canvas
                  ref={canvasRef}
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.15s', maxWidth: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: '8px', cursor: 'crosshair' }}
                />
              </div>
            )}

            {/* Floating controls */}
            {imagePreviewUrl && (
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
                <div style={{
                  display: 'flex', gap: '4px',
                  background: 'rgba(255,255,255,0.92)', borderRadius: '10px',
                  padding: '4px 8px', border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)', pointerEvents: 'auto'
                }}>
                  {[
                    { label: `Boxes ${showBoxes ? 'On' : 'Off'}`, active: showBoxes, onClick: () => setShowBoxes(!showBoxes) },
                    { label: `Labels ${showLabels ? 'On' : 'Off'}`, active: showLabels, onClick: () => setShowLabels(!showLabels) }
                  ].map((btn) => (
                    <button key={btn.label} onClick={btn.onClick} style={{
                      padding: '3px 8px', borderRadius: '6px', border: 'none',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                      background: btn.active ? '#4F46E5' : 'transparent',
                      color: btn.active ? '#fff' : '#6B7280'
                    }}>{btn.label}</button>
                  ))}
                </div>
                <div style={{
                  display: 'flex', gap: '2px', alignItems: 'center',
                  background: 'rgba(255,255,255,0.92)', borderRadius: '10px',
                  padding: '4px', border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)', pointerEvents: 'auto'
                }}>
                  {[
                    { icon: <ZoomIn size={13} />, onClick: () => setZoomLevel(z => Math.min(2.5, z + 0.25)) },
                    { icon: <ZoomOut size={13} />, onClick: () => setZoomLevel(z => Math.max(0.5, z - 0.25)) },
                    { icon: <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700 }}>1:1</span>, onClick: () => setZoomLevel(1) },
                    { icon: <Download size={13} />, onClick: downloadAnnotatedImage }
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.onClick} style={{
                      padding: '4px 6px', borderRadius: '6px', border: 'none',
                      background: 'transparent', color: '#374151', cursor: 'pointer',
                      display: 'flex', alignItems: 'center'
                    }}>{btn.icon}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Stats + Detections ───────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* 4 metric tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { icon: <Bike size={16} color="#3B82F6" />, label: 'Motorcycles', value: prediction?.summary.vehicles ?? '—', bg: '#EFF6FF', border: '#BFDBFE', valColor: '#1D4ED8' },
              { icon: <ShieldCheck size={16} color="#16A34A" />, label: 'Compliant', value: prediction?.summary.helmet_detected ?? '—', bg: '#F0FDF4', border: '#BBF7D0', valColor: '#15803D' },
              { icon: <ShieldAlert size={16} color="#DC2626" />, label: 'Violations', value: prediction?.summary.violations ?? '—', bg: '#FFF1F2', border: '#FECDD3', valColor: '#B91C1C' },
              { icon: <Clock size={16} color="#7C3AED" />, label: 'Latency', value: prediction ? `${prediction.inference_time_ms}ms` : '—', bg: '#FAF5FF', border: '#E9D5FF', valColor: '#6D28D9' }
            ].map((tile) => (
              <div key={tile.label} style={{
                background: tile.bg, border: `2px solid ${tile.border}`,
                borderRadius: '14px', padding: '12px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  {tile.icon}
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280' }}>{tile.label}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: tile.valColor, fontFamily: 'monospace', lineHeight: 1 }}>
                  {tile.value}
                </div>
              </div>
            ))}
          </div>

          {/* Detections list */}
          <div style={{
            background: '#fff',
            border: '2px solid #E5E7EB',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            flex: 1
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #1E293B, #334155)',
              padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Detected Objects {prediction && `(${prediction.detections.length})`}
              </span>
              {prediction && (
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94A3B8' }}>{prediction.device}</span>
              )}
            </div>

            <div style={{ padding: '12px' }}>
              {!prediction ? (
                <div style={{ padding: '30px 12px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px', fontWeight: 500 }}>
                  Upload a photo to inspect detected riders, helmets, and motorcycles.
                </div>
              ) : prediction.detections.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                  No objects at {(confidenceThreshold * 100).toFixed(0)}% threshold. Try lowering it.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '360px', overflowY: 'auto' }}>
                  {prediction.detections.map((det: DetectionItem, idx: number) => {
                    const isSelected = selectedDetectionIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDetectionIdx(isSelected ? null : idx)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #F59E0B' : '1.5px solid #F3F4F6',
                          background: isSelected ? '#FFFBEB' : det.violation ? '#FFF1F2' : '#F0FDF4',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: det.violation ? '#FEE2E2' : det.class_name === 'bike' ? '#DBEAFE' : '#DCFCE7'
                          }}>
                            {det.violation
                              ? <AlertTriangle size={14} color="#DC2626" />
                              : <Check size={14} color={det.class_name === 'bike' ? '#2563EB' : '#16A34A'} />
                            }
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{det.display_name}</div>
                            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#9CA3AF' }}>
                              [{det.bbox.map((v) => Math.round(v)).join(', ')}]
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: '#111827' }}>
                            {(det.confidence * 100).toFixed(1)}%
                          </div>
                          <span style={{
                            fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px',
                            background: det.violation ? '#FEE2E2' : '#DCFCE7',
                            color: det.violation ? '#B91C1C' : '#15803D',
                            textTransform: 'uppercase'
                          }}>
                            {det.violation ? 'VIOLATION' : 'OK'}
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
    </div>
  );
};
