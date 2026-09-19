import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Radio,
  Settings,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const LiveCameraPage: React.FC = () => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [rtspUrl, setRtspUrl] = useState('rtsp://192.168.1.120:554/traffic-cam-north');
  const [cameraFps, setCameraFps] = useState(25);
  const [selectedResolution, setSelectedResolution] = useState('1280x720');
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
    } catch (err: any) {
      setStreamError('Could not access local webcam. Ensure camera permissions are granted.');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-mono">
              Live Camera RTSP Feed
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Coming Soon (Phase 2)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time IP camera / RTSP edge integration with on-the-fly Co-DETR bounding box rendering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isWebcamActive ? (
            <button
              onClick={stopWebcam}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Stop Camera Preview</span>
            </button>
          ) : (
            <button
              onClick={startWebcam}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current text-blue-400" />
              <span>Test with Browser Webcam</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Stream Preview (7 cols) + Configuration (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stream Preview Viewport */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl p-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium font-mono">
                  {isWebcamActive ? 'LOCAL WEBCAM SENSOR (ACTIVE)' : 'RTSP STREAM MONITOR (STANDBY)'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-500">Target:</span>
                <span className="text-blue-400">10 FPS Co-DETR</span>
              </div>
            </div>

            {/* Video or Standby Display */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[420px] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full max-h-[480px] object-cover ${isWebcamActive ? 'block' : 'hidden'}`}
              />

              {/* Simulated HUD Bounding Box Scanning Overlay when webcam is active */}
              {isWebcamActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="border border-emerald-400/40 rounded-lg w-48 h-48 relative animate-pulse">
                    <div className="absolute top-1 left-1 text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-1 rounded">
                      RIDER SCAN: ACTIVE
                    </div>
                    <div className="absolute bottom-1 right-1 text-[9px] font-mono text-emerald-400">
                      98.2%
                    </div>
                  </div>
                </div>
              )}

              {!isWebcamActive && (
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="text-white font-semibold text-base font-mono">
                    RTSP Edge Streaming Feed
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Live RTSP stream ingest via WebRTC / HLS proxy is scheduled for Phase 2 deployment. You can test live capture using your browser webcam above.
                  </p>
                  <button
                    onClick={startWebcam}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Launch Webcam Feed
                  </button>
                </div>
              )}
            </div>

            {streamError && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{streamError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Settings className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                Camera Configuration
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px]">RTSP Endpoint URI</label>
                <input
                  type="text"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px]">Input Resolution</label>
                <select
                  value={selectedResolution}
                  onChange={(e) => setSelectedResolution(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="1920x1080">1920 × 1080 (1080p HD)</option>
                  <option value="1280x720">1280 × 720 (720p HD)</option>
                  <option value="640x384">640 × 384 (Model Native)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px]">Stream Sampling Rate</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={cameraFps}
                    onChange={(e) => setCameraFps(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="font-mono text-white text-xs">{cameraFps} FPS</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Edge model downscales input to 640×384 for tensor core efficiency.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
