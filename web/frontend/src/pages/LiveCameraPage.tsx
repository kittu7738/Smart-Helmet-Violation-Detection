import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Radio,
  Settings,
  Play,
  Pause,
  AlertCircle
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
    } catch {
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Live Camera Surveillance Stream
            </h1>
            <span className="badge-warning px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Phase 2 Pipeline
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time IP camera / RTSP stream ingest with edge Co-DETR bounding box rendering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isWebcamActive ? (
            <button
              onClick={stopWebcam}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Stop Camera Preview</span>
            </button>
          ) : (
            <button
              onClick={startWebcam}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test with Browser Webcam</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Stream Preview (8 cols) + Side Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stream Preview Viewport */}
        <div className="lg:col-span-8 space-y-4">
          <div className="light-card p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                <span className="text-gray-900 font-semibold">
                  {isWebcamActive ? 'LOCAL WEBCAM SENSOR (ACTIVE PREVIEW)' : 'RTSP STREAM MONITOR (STANDBY)'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-gray-400">Target:</span>
                <span className="text-blue-600 font-semibold">10 FPS Co-DETR</span>
              </div>
            </div>

            {/* Video or Standby Display */}
            <div className="relative rounded-xl overflow-hidden bg-gray-900 min-h-[420px] flex items-center justify-center">
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
                    <div className="absolute bottom-2 right-2 text-[10px] font-mono font-bold text-emerald-300 bg-gray-900/80 px-1 rounded">
                      Co-DETR 96.4%
                    </div>
                  </div>
                </div>
              )}

              {!isWebcamActive && (
                <div className="text-center p-8 space-y-3 bg-white w-full h-full flex flex-col items-center justify-center min-h-[420px]">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="text-gray-900 font-bold text-base">
                    RTSP Edge Streaming Feed
                  </h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    Live RTSP stream ingest via WebRTC / HLS proxy is scheduled for Phase 2 deployment. You can test live capture using your browser webcam above.
                  </p>
                  <button
                    onClick={startWebcam}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Launch Webcam Feed
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

        {/* Side Panel: Camera Status, AI Status, Settings */}
        <div className="lg:col-span-4 space-y-4">
          <div className="light-card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Settings className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-gray-900 uppercase">
                CAMERA CONFIGURATION
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 mb-1 font-semibold text-[11px]">RTSP Endpoint URI</label>
                <input
                  type="text"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1 font-semibold text-[11px]">Target Resolution</label>
                <select
                  value={selectedResolution}
                  onChange={(e) => setSelectedResolution(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="1920x1080">1920 × 1080 (1080p HD)</option>
                  <option value="1280x720">1280 × 720 (720p HD)</option>
                  <option value="640x384">640 × 384 (Co-DETR Native)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-1 font-semibold text-[11px]">Sampling FPS</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={cameraFps}
                    onChange={(e) => setCameraFps(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="font-mono text-gray-900 font-bold text-xs">{cameraFps} FPS</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Camera Status</span>
                  <span className="font-semibold text-gray-900">{isWebcamActive ? 'Online' : 'Standby'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">AI Engine</span>
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
