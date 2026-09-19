import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  UploadCloud,
  FileVideo,
  AlertTriangle,
  RotateCcw,
  Film,
  Download
} from 'lucide-react';

interface FrameViolation {
  time: string;
  frame: number;
  riderType: string;
  violationType: string;
  confidence: number;
  plate: string;
}

export const VideoAnalysisPage: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeViolations, setActiveViolations] = useState<FrameViolation[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleViolations: FrameViolation[] = [
    { time: '00:03', frame: 75, riderType: 'Driver', violationType: 'No Helmet — Driver', confidence: 91.4, plate: 'MH 12 AB 4582' },
    { time: '00:07', frame: 175, riderType: 'Passenger', violationType: 'No Helmet — Passenger', confidence: 88.2, plate: 'MH 14 DE 7819' },
    { time: '00:14', frame: 350, riderType: 'Passenger', violationType: 'No Helmet — Passenger', confidence: 85.7, plate: 'MH 12 XY 9021' },
    { time: '00:22', frame: 550, riderType: 'Driver', violationType: 'No Helmet — Driver', confidence: 94.1, plate: 'MH 04 KL 3310' },
  ];

  const handleFileChange = (file: File) => {
    setSelectedVideo(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setActiveViolations(sampleViolations);
    }, 1200);
  };

  const loadSampleVideo = () => {
    // Generate simulated video test
    setSelectedVideo({ name: 'junction_north_traffic_cam_01.mp4', size: 14500000 } as File);
    setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setActiveViolations(sampleViolations);
    }, 1000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-mono">
              Video Traffic Stream Analysis
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Frame Sequence Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Batch-process surveillance CCTV footage to log time-indexed motorcycle helmet non-compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadSampleVideo}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <span>Load Sample Surveillance Clip</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Video Player (7 cols) + Timeline / Infractions (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl p-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium truncate max-w-[220px]">
                  {selectedVideo ? selectedVideo.name : 'No video selected'}
                </span>
              </div>
              {videoUrl && (
                <button
                  onClick={() => {
                    setSelectedVideo(null);
                    setVideoUrl(null);
                    setActiveViolations([]);
                  }}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Video Container */}
            {!videoUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-12 text-center cursor-pointer bg-slate-950/40 min-h-[380px] flex flex-col items-center justify-center transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-white font-semibold text-lg">Upload Traffic Surveillance Video</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-sm">
                  MP4, AVI, MOV or WEBM. Supports CCTV feed uploads up to 100MB.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                  >
                    Select Video File
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSampleVideo();
                    }}
                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium rounded-xl border border-blue-500/30 transition-colors"
                  >
                    Load Sample Clip
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col min-h-[380px] justify-center items-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full max-h-[460px] object-contain"
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                  }}
                  onEnded={() => setIsPlaying(false)}
                />

                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <div className="text-white font-medium text-sm">Extracting Keyframes for Co-DETR...</div>
                    <div className="text-slate-400 text-xs">Sampling at 10 FPS with FP16 inference</div>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/avi,video/quicktime,video/webm"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {/* Video Controls */}
            {videoUrl && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <span className="text-xs font-mono text-slate-300">
                    {Math.floor(currentTime)}s / {Math.floor(duration)}s
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>10 FPS Target</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detected Violations Timeline */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  Timestamped Infractions ({activeViolations.length})
                </h3>
              </div>
              {activeViolations.length > 0 && (
                <button
                  onClick={() => alert('Infraction report downloaded as CSV.')}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            {activeViolations.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                Upload or load a video clip to generate automatic time-stamped violation records.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {activeViolations.map((v, idx) => (
                  <div
                    key={idx}
                    className="pt-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                        {v.time}
                      </span>
                      <div>
                        <div className="text-white font-medium">{v.violationType}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          Plate: {v.plate} • Frame #{v.frame}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-rose-400">
                        {v.confidence}% Conf
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
