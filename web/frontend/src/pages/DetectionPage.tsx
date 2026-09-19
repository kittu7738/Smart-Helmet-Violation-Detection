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
  Clock,
  Download,
  Check,
  Info,
  Cpu
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
    api.getModelStatus().then((status) => { if (isMounted && status) setModelStatus(status); });
    return () => { isMounted = false; };
  }, []);

  const handleFileChange = (file: File) => {
    setSelectedFile(file); setPrediction(null); setSelectedDetectionIdx(null); setNoticeMsg(null);
    const url = URL.createObjectURL(file); setImagePreviewUrl(url);
    const img = new Image(); img.src = url;
    img.onload = () => { imageRef.current = img; setTimeout(() => renderCanvas(), 50); };
  };

  const loadSampleImage = async () => {
    try {
      const res = await fetch('/sample_traffic.jpg');
      if (!res.ok) throw new Error('not found');
      const blob = await res.blob();
      handleFileChange(new File([blob], 'sample_traffic.jpg', { type: 'image/jpeg' }));
    } catch { setNoticeMsg('Could not load sample image.'); }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current; const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0);
    if (showBoxes && prediction?.detections) {
      prediction.detections.forEach((det, idx) => {
        const [x1, y1, x2, y2] = det.bbox; const w = x2 - x1; const h = y2 - y1;
        const isSel = selectedDetectionIdx === idx;
        const stroke = det.violation ? '#DC2626' : det.class_name === 'bike' ? '#2563EB' : '#16A34A';
        const fill = det.violation ? 'rgba(220,38,38,0.16)' : det.class_name === 'bike' ? 'rgba(37,99,235,0.12)' : 'rgba(22,163,74,0.16)';
        ctx.strokeStyle = isSel ? '#F59E0B' : stroke; ctx.lineWidth = isSel ? 4 : 2.5;
        ctx.fillStyle = isSel ? 'rgba(245,158,11,0.25)' : fill;
        ctx.fillRect(x1, y1, w, h); ctx.strokeRect(x1, y1, w, h);
        if (showLabels) {
          const label = `${det.display_name} ${(det.confidence * 100).toFixed(0)}%`;
          ctx.font = '600 13px Inter, sans-serif';
          const tw = ctx.measureText(label).width; const p = 6; const ph = 24;
          ctx.fillStyle = isSel ? '#F59E0B' : stroke;
          ctx.fillRect(x1, Math.max(0, y1 - ph), tw + p * 2, ph);
          ctx.fillStyle = '#fff'; ctx.fillText(label, x1 + p, Math.max(16, y1 - 7));
        }
      });
    }
  }, [prediction, selectedDetectionIdx, showBoxes, showLabels]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  const runDetection = async () => {
    if (!selectedFile) return;
    setIsProcessing(true); setNoticeMsg(null); setSelectedDetectionIdx(null);
    try {
      setPrediction(await api.detectImage(selectedFile, confidenceThreshold));
    } catch {
      const w = imageRef.current?.naturalWidth || 1280; const h = imageRef.current?.naturalHeight || 720;
      setPrediction(api.getSimulatedDetection(w, h));
      setNoticeMsg('GPU backend offline — showing simulated results. Add Colab Tunnel URL in settings for live inference.');
    } finally { setIsProcessing(false); setTimeout(() => renderCanvas(), 50); }
  };

  const clearImage = () => {
    setSelectedFile(null); setImagePreviewUrl(null); setPrediction(null);
    setSelectedDetectionIdx(null); setNoticeMsg(null); setZoomLevel(1);
    imageRef.current = null; if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadAnnotated = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const a = document.createElement('a');
    a.download = `annotated-${selectedFile?.name || 'traffic'}.png`;
    a.href = canvas.toDataURL('image/png'); a.click();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>

      {/* ── TITLE ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>Image Detection</h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0', fontWeight: 500 }}>Upload a photo · Co-DETR detects riders &amp; helmet violations</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '8px 14px' }}>
          <Cpu size={14} color="#6366F1" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>{modelStatus?.gpu_name || 'Tesla T4'} · Co-DETR</span>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────
          Left: Canvas (big) | Right: upload + stats + results
      ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '18px', alignItems: 'start' }}>

        {/* ── LEFT: Canvas + controls ─────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* notice */}
          {noticeMsg && (
            <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '10px', fontSize: '12px', color: '#78350F', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Info size={14} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
              {noticeMsg}
            </div>
          )}

          {/* canvas card */}
          <div style={{ borderRadius: '20px', overflow: 'hidden', border: '2.5px solid #312E81', boxShadow: '0 8px 32px rgba(49,46,129,0.18)' }}>
            {/* colored top stripe - changes on result */}
            <div style={{
              height: '5px',
              background: prediction
                ? (prediction.summary.violations > 0 ? 'linear-gradient(90deg,#DC2626,#F97316,#FBBF24)' : 'linear-gradient(90deg,#16A34A,#0D9488,#0EA5E9)')
                : 'linear-gradient(90deg,#4F46E5,#7C3AED,#EC4899)'
            }} />

            {/* canvas toolbar */}
            <div style={{ background: '#1E1B4B', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#A5B4FC', fontWeight: 600 }}>
                {selectedFile
                  ? <>{selectedFile.name}{prediction && <span style={{ color: '#818CF8', marginLeft: '10px' }}>{prediction.image_width}×{prediction.image_height}</span>}</>
                  : 'detection viewport'
                }
              </span>
              {imagePreviewUrl && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {/* toggle boxes */}
                  <button onClick={() => setShowBoxes(v => !v)} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, background: showBoxes ? '#4F46E5' : 'rgba(255,255,255,0.1)', color: showBoxes ? '#fff' : '#94A3B8' }}>Boxes</button>
                  <button onClick={() => setShowLabels(v => !v)} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, background: showLabels ? '#4F46E5' : 'rgba(255,255,255,0.1)', color: showLabels ? '#fff' : '#94A3B8' }}>Labels</button>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.12)', margin: '0 4px' }} />
                  <button onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.25))} style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZoomIn size={12} /></button>
                  <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZoomOut size={12} /></button>
                  <button onClick={() => setZoomLevel(1)} style={{ padding: '0 6px', height: '26px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', cursor: 'pointer' }}>1:1</button>
                  <button onClick={downloadAnnotated} style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.08)', color: '#60A5FA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Download size={12} /></button>
                  <button onClick={clearImage} style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.2)', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RotateCcw size={12} /></button>
                </div>
              )}
            </div>

            {/* image area */}
            <div style={{ background: '#0F172A', minHeight: '460px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '16px' }}>
              {!imagePreviewUrl ? (
                <div
                  onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragActive ? '#818CF8' : 'rgba(99,102,241,0.35)'}`,
                    borderRadius: '16px', padding: '48px 32px', cursor: 'pointer',
                    background: dragActive ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.05)',
                    textAlign: 'center', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                  }}
                >
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(99,102,241,0.2)', border: '2px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadCloud size={26} color="#818CF8" />
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#C7D2FE', margin: 0 }}>Drop a photo here</p>
                    <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0' }}>or click to browse · JPEG, PNG, WEBP</p>
                  </div>
                </div>
              ) : (
                <canvas ref={canvasRef} style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center', transition: 'transform 0.15s', maxWidth: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: '8px', cursor: 'crosshair', display: 'block' }} />
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) handleFileChange(e.target.files[0]); }} />
        </div>

        {/* ── RIGHT SIDEBAR ───────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Upload button card — DARK INDIGO */}
          <div style={{ background: 'linear-gradient(135deg,#312E81,#4F46E5)', borderRadius: '18px', padding: '20px', boxShadow: '0 8px 28px rgba(79,70,229,0.35)' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A5B4FC', margin: '0 0 12px' }}>Upload Photo</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', padding: '11px', border: '2px dashed rgba(255,255,255,0.35)', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', color: '#E0E7FF', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <UploadCloud size={16} /> Select Traffic Photo
            </button>
            <button
              type="button" onClick={loadSampleImage}
              style={{ width: '100%', marginTop: '8px', padding: '9px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#C7D2FE', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Load Sample Photo
            </button>
          </div>

          {/* Confidence card — AMBER */}
          <div style={{ background: 'linear-gradient(135deg,#78350F,#D97706)', borderRadius: '18px', padding: '18px 20px', boxShadow: '0 8px 24px rgba(217,119,6,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#FDE68A' }}>
                <Sliders size={13} color="#FDE68A" /> Confidence
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 900, color: '#fff' }}>{(confidenceThreshold * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min="0.10" max="0.80" step="0.05" value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#FDE68A', cursor: 'pointer' }} />

          </div>

          {/* Run button — EMERALD */}
          {imagePreviewUrl && (
            <button disabled={isProcessing} onClick={runDetection} style={{
              padding: '13px', border: 'none', borderRadius: '14px', cursor: isProcessing ? 'not-allowed' : 'pointer',
              background: isProcessing ? 'linear-gradient(135deg,#6B7280,#9CA3AF)' : 'linear-gradient(135deg,#059669,#0D9488)',
              color: '#fff', fontSize: '15px', fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: isProcessing ? 'none' : '0 6px 20px rgba(5,150,105,0.4)', transition: 'all 0.2s'
            }}>
              <Play size={16} fill="currentColor" />
              {isProcessing ? 'Detecting...' : 'Run Detection'}
            </button>
          )}

          {/* Clear — thin red */}
          {imagePreviewUrl && (
            <button onClick={clearImage} style={{ padding: '8px', border: '1.5px solid #FECDD3', borderRadius: '10px', background: '#FFF1F2', color: '#E11D48', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <RotateCcw size={13} /> Clear
            </button>
          )}

          {/* 4 stat tiles — each a vivid solid color */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { icon: <Bike size={15} color="#fff" />, label: 'Bikes', value: prediction?.summary.vehicles ?? '—', bg: 'linear-gradient(135deg,#1E3A8A,#2563EB)', shadow: 'rgba(37,99,235,0.3)' },
              { icon: <ShieldCheck size={15} color="#fff" />, label: 'Safe', value: prediction?.summary.helmet_detected ?? '—', bg: 'linear-gradient(135deg,#14532D,#16A34A)', shadow: 'rgba(22,163,74,0.3)' },
              { icon: <ShieldAlert size={15} color="#fff" />, label: 'Violations', value: prediction?.summary.violations ?? '—', bg: 'linear-gradient(135deg,#7F1D1D,#DC2626)', shadow: 'rgba(220,38,38,0.3)' },
              { icon: <Clock size={15} color="#fff" />, label: 'ms', value: prediction ? String(prediction.inference_time_ms) : '—', bg: 'linear-gradient(135deg,#2E1065,#7C3AED)', shadow: 'rgba(124,58,237,0.3)' }
            ].map((t) => (
              <div key={t.label} style={{ background: t.bg, borderRadius: '14px', padding: '14px 12px', boxShadow: `0 4px 16px ${t.shadow}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  {t.icon}
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>{t.label}</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>{t.value}</div>
              </div>
            ))}
          </div>

          {/* Detection list */}
          <div style={{ background: '#fff', border: '2px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ background: '#1E293B', padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Detections {prediction && `· ${prediction.detections.length}`}
              </span>
              {prediction && <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>{prediction.device}</span>}
            </div>
            <div style={{ padding: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {!prediction ? (
                <div style={{ padding: '20px 8px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
                  Upload &amp; run to see detections
                </div>
              ) : prediction.detections.length === 0 ? (
                <div style={{ padding: '16px 8px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                  No detections at {(confidenceThreshold * 100).toFixed(0)}% — try lowering threshold
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {prediction.detections.map((det: DetectionItem, idx: number) => {
                    const isSel = selectedDetectionIdx === idx;
                    return (
                      <div key={idx} onClick={() => setSelectedDetectionIdx(isSel ? null : idx)} style={{
                        padding: '9px 11px', borderRadius: '10px', cursor: 'pointer',
                        border: isSel ? '2px solid #F59E0B' : `1.5px solid ${det.violation ? '#FECDD3' : '#BBF7D0'}`,
                        background: isSel ? '#FFFBEB' : det.violation ? '#FFF1F2' : '#F0FDF4',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', transition: 'all 0.12s'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: det.violation ? '#FEE2E2' : det.class_name === 'bike' ? '#DBEAFE' : '#DCFCE7' }}>
                            {det.violation ? <AlertTriangle size={13} color="#DC2626" /> : <Check size={13} color={det.class_name === 'bike' ? '#2563EB' : '#16A34A'} />}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{det.display_name}</div>
                            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#9CA3AF' }}>{det.bbox.map(v => Math.round(v)).join(', ')}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: '#111827' }}>{(det.confidence * 100).toFixed(1)}%</div>
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 5px', borderRadius: '4px', background: det.violation ? '#FEE2E2' : '#DCFCE7', color: det.violation ? '#B91C1C' : '#15803D', textTransform: 'uppercase' }}>
                            {det.violation ? 'Violation' : 'OK'}
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
