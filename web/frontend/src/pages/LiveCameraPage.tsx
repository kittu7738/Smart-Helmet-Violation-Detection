import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Radio,
  Settings,
  Pause,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

export const LiveCameraPage: React.FC = () => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [rtspUrl, setRtspUrl] = useState('rtsp://192.168.1.120:554/traffic-cam-north');
  const [cameraFps, setCameraFps] = useState(25);
  const [selectedResolution, setSelectedResolution] = useState('1280x720');
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  const startWebcam = async () => {
    try {
      setStreamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsWebcamActive(true);
      }
    } catch {
      setStreamError('Could not access local webcam. Ensure camera permissions are granted.');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      videoRef.current.pause();
    }
    setIsWebcamActive(false);
    if (typeof document !== 'undefined' && (document as any).pictureInPictureElement) {
      (document as any).exitPictureInPicture().catch(() => {});
    }
  };

  const copyRtspUrl = () => {
    navigator.clipboard.writeText(rtspUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Live Camera Surveillance Stream
            </h1>
            <span className="badge-warning px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Phase 2 Pipeline
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time IP camera / RTSP stream ingest with edge Co-DETR bounding box rendering.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isWebcamActive ? (
            <button
              onClick={stopWebcam}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100/90 active:bg-red-200 text-red-700 border border-red-200 text-xs font-semibold shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Stop Camera Preview</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Camera Feed Standby
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Stream Preview (7 cols) + Side Panel (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stream Preview Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-900 font-semibold">
                  {isWebcamActive ? 'LOCAL WEBCAM SENSOR (ACTIVE PREVIEW)' : 'RTSP STREAM MONITOR (STANDBY)'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Target:</span>
                <span className="text-blue-600 font-semibold">10 FPS Co-DETR</span>
              </div>
            </div>

            {/* Video or Standby Display */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 min-h-[420px] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                disablePictureInPicture
                controlsList="nodownload noplaybackrate"
                className={`w-full max-h-[480px] object-cover ${isWebcamActive ? 'block' : 'hidden'}`}
              />

              {/* Simulated HUD Scanning Overlay when webcam is active */}
              {isWebcamActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="border border-emerald-400/60 rounded-xl w-56 h-56 relative animate-pulse shadow-xs">
                    <div className="absolute top-2 left-2 text-[10px] font-mono font-semibold bg-emerald-600 text-white px-1.5 py-0.5 rounded shadow-xs">
                      RIDER SCAN: ACTIVE
                    </div>
                    <div className="absolute bottom-2 right-2 text-[10px] font-mono font-bold text-emerald-300 bg-slate-900/80 px-1 rounded">
                      Co-DETR 96.4%
                    </div>
                  </div>
                </div>
              )}

              {!isWebcamActive && (
                <div className="text-center p-8 space-y-3 bg-white w-full h-full flex flex-col items-center justify-center min-h-[420px]">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs border border-blue-100">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="text-slate-900 font-bold text-base tracking-tight">
                    RTSP Edge Streaming Feed
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Live RTSP stream ingest via WebRTC / HLS proxy is scheduled for Phase 2 deployment. You can test live capture using your browser webcam below.
                  </p>
                  <button
                    onClick={startWebcam}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Launch Webcam Feed</span>
                  </button>
                </div>
              )}
            </div>

            {streamError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{streamError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Camera Status, AI Status, Settings (Output / Config Zone with #FAFBFC tint) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#FAFBFC] rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80">
              <Settings className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Camera Configuration
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-semibold text-[11px]">
                    RTSP Endpoint URI
                  </label>
                  <button
                    onClick={copyRtspUrl}
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                    title="Copy URI"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={rtspUrl}
                  title={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  placeholder="rtsp://host:port/path"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px] sm:text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Hover or focus to view full endpoint string.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5 font-semibold text-[11px]">
                  Target Resolution
                </label>
                <select
                  value={selectedResolution}
                  onChange={(e) => setSelectedResolution(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="1920x1080">1920 × 1080 (1080p HD)</option>
                  <option value="1280x720">1280 × 720 (720p HD)</option>
                  <option value="640x384">640 × 384 (Co-DETR Native)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-semibold text-[11px]">
                    Sampling FPS
                  </label>
                  <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80 font-bold text-xs">
                    {cameraFps} FPS
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-semibold text-slate-400 shrink-0">
                      5
                    </span>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="1"
                      value={cameraFps}
                      onChange={(e) => setCameraFps(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                    />
                    <span className="font-mono text-[11px] font-semibold text-slate-400 shrink-0">
                      60
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
                    <span>5 FPS (Low compute)</span>
                    <span>60 FPS (Fluid)</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Camera Status</span>
                  <span className={`font-semibold flex items-center gap-1.5 ${isWebcamActive ? 'text-emerald-700' : 'text-slate-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isWebcamActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {isWebcamActive ? 'Online (Active)' : 'Standby'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">AI Engine</span>
                  <span className="font-semibold text-emerald-700">Tesla T4 Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
