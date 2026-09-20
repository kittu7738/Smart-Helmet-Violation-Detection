import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  UploadCloud,
  FileVideo,
  AlertTriangle,
  RotateCcw,
  Film,
  Download,
  Clock
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
    { time: '00:03', frame: 75, riderType: 'Driver', violationType: 'Driver Without Helmet', confidence: 91.4, plate: 'MH 12 AB 4582' },
    { time: '00:07', frame: 175, riderType: 'Passenger', violationType: 'Passenger Without Helmet', confidence: 88.2, plate: 'MH 14 DE 7819' },
    { time: '00:14', frame: 350, riderType: 'Passenger', violationType: 'Passenger Without Helmet', confidence: 85.7, plate: 'MH 12 XY 9021' },
    { time: '00:22', frame: 550, riderType: 'Driver', violationType: 'Driver Without Helmet', confidence: 94.1, plate: 'MH 04 KL 3310' },
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

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
      if (typeof document !== 'undefined' && (document as any).pictureInPictureElement) {
        (document as any).exitPictureInPicture().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Video Traffic Stream Analysis
            </h1>
            <span className="badge-blue px-2.5 py-0.5 rounded-full text-xs font-semibold">
              Frame Sequence Engine
            </span>
            <span className="text-xs font-medium text-slate-500 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200/70">
              ~2 min per 5-min clip • 30 FPS inference
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Batch-process surveillance CCTV footage to log time-indexed motorcycle helmet infractions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadSampleVideo}
            className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/90 active:bg-blue-200 text-blue-700 border border-blue-200 text-xs font-semibold shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Film className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Sample Surveillance Clip</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Video Player (7 cols) + Timeline / Infractions (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player (Input Zone) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 text-xs">
              {!selectedVideo ? (
                <>
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <FileVideo className="w-4 h-4 text-blue-600" />
                    <span>Surveillance Feed Input</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200/80">
                    Awaiting Media
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-slate-800 font-semibold truncate max-w-[280px]">
                    <FileVideo className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">{selectedVideo.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isProcessing ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Processing...
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Analyzed
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSelectedVideo(null);
                        setVideoUrl(null);
                        setActiveViolations([]);
                      }}
                      title="Reset Video"
                      className="text-slate-400 hover:text-rose-600 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Video Container */}
            {!videoUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200/90 hover:border-blue-400 rounded-2xl p-10 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 min-h-[380px] flex flex-col items-center justify-center transition-all group select-none"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3.5 shadow-2xs border border-blue-100 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-8 h-8 stroke-[2.2]" />
                </div>
                <h3 className="text-slate-900 font-bold text-base tracking-tight">Upload Surveillance Video</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-sm">
                  MP4, AVI, MOV or WEBM. Supports CCTV feed uploads up to 100MB.
                </p>
                <div className="mt-4.5 flex items-center justify-center">
                  <button
                    type="button"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <FileVideo className="w-4 h-4" />
                    <span>Select Video File</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black flex flex-col min-h-[380px] justify-center items-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  disablePictureInPicture
                  controlsList="nodownload noplaybackrate"
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
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-9 h-9 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <div className="text-gray-900 font-semibold text-sm">Extracting Keyframes for Co-DETR...</div>
                    <div className="text-gray-500 text-xs">Sampling at 10 FPS with FP16 inference</div>
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
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-sm"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <span className="text-xs font-mono font-medium text-gray-700">
                    {Math.floor(currentTime)}s / {Math.floor(duration)}s
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>10 FPS Sampling</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detected Violations Timeline (Output Zone with #FAFBFC tint) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#FAFBFC] rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4 min-h-[460px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200/60">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                  Timestamped Infractions ({activeViolations.length})
                </h3>
              </div>
              {activeViolations.length > 0 && (
                <button
                  onClick={() => alert('Infraction report downloaded as CSV.')}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            {activeViolations.length === 0 ? (
              <div className="py-5 px-1 space-y-3.5 flex-1 flex flex-col justify-center">
                {/* Informative Guidance */}
                <div className="text-center pb-1">
                  <div className="w-11 h-11 mx-auto mb-2.5 rounded-2xl bg-blue-50/80 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                    <Clock className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                    Awaiting Video Infractions
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Timestamped logs and detection scores will populate here automatically once video inference runs.
                  </p>
                </div>

                {/* Faded Skeleton / Ghosted Preview Rows */}
                <div className="space-y-2 select-none opacity-45 pointer-events-none">
                  <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-white/80 flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        🕐 00:14
                      </span>
                      <div>
                        <div className="text-slate-800 font-semibold text-xs">Rider — No Helmet</div>
                        <div className="text-[10px] font-mono text-slate-400">Plate: MH 12 AB • Frame #350</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                      [ghosted]
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-white/80 flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        🕐 00:47
                      </span>
                      <div>
                        <div className="text-slate-800 font-semibold text-xs">Passenger — No Helmet</div>
                        <div className="text-[10px] font-mono text-slate-400">Plate: MH 14 DE • Frame #1175</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                      [ghosted]
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-white/80 flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        🕐 01:22
                      </span>
                      <div>
                        <div className="text-slate-800 font-semibold text-xs">Driver — No Helmet</div>
                        <div className="text-[10px] font-mono text-slate-400">Plate: MH 04 KL • Frame #2050</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                      [ghosted]
                    </span>
                  </div>
                </div>

                {/* Subtle Preview Indicator Tag */}
                <div className="text-center pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Preview format for detected infractions
                  </span>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
                {activeViolations.map((v, idx) => (
                  <div
                    key={idx}
                    className="pt-2.5 pb-1.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {v.time}
                      </span>
                      <div>
                        <div className="text-slate-900 font-semibold">{v.violationType}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Plate: {v.plate} • Frame #{v.frame}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
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
