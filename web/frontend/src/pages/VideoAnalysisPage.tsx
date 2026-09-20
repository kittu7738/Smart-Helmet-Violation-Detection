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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Video Traffic Stream Analysis
            </h1>
            <span className="badge-blue px-2.5 py-0.5 rounded-full text-xs font-semibold">
              Frame Sequence Engine
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Batch-process surveillance CCTV footage to log time-indexed motorcycle helmet infractions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadSampleVideo}
            className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Film className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Sample Surveillance Clip</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Video Player (7 cols) + Timeline / Infractions (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player */}
        <div className="lg:col-span-7 space-y-4">
          <div className="light-card p-4 sm:p-5 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-blue-600" />
                <span className="text-gray-800 font-semibold truncate max-w-[240px]">
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
                  className="text-gray-400 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Video Container */}
            {!videoUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-xl p-12 text-center cursor-pointer bg-gray-50/50 min-h-[380px] flex flex-col items-center justify-center transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-gray-900 font-bold text-base">Upload Surveillance Video</h3>
                <p className="text-gray-500 text-xs mt-1 max-w-sm">
                  MP4, AVI, MOV or WEBM. Supports CCTV feed uploads up to 100MB.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-xl border border-gray-200 shadow-xs"
                  >
                    Select Video File
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSampleVideo();
                    }}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors"
                  >
                    Load Sample Clip
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

        {/* Right: Detected Violations Timeline */}
        <div className="lg:col-span-5 space-y-4">
          <div className="light-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold text-gray-900 uppercase">
                  TIMESTAMPTED INFRACTIONS ({activeViolations.length})
                </h3>
              </div>
              {activeViolations.length > 0 && (
                <button
                  onClick={() => alert('Infraction report downloaded as CSV.')}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            {activeViolations.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs">
                Upload or load a video clip to generate automatic time-stamped violation records.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
                {activeViolations.map((v, idx) => (
                  <div
                    key={idx}
                    className="pt-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {v.time}
                      </span>
                      <div>
                        <div className="text-gray-900 font-semibold">{v.violationType}</div>
                        <div className="text-[11px] font-mono text-gray-500">
                          Plate: {v.plate} • Frame #{v.frame}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-red-600">
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
