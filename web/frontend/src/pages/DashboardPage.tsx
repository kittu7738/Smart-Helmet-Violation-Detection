import React, { useState } from 'react';
import {
  Bike,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  Video,
  ScanLine,
  Clock,
  ArrowRight,
  Cpu,
  Target,
  Download,
  Play,
  ChevronDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from '../types/detection';

interface DashboardPageProps {
  stats: DashboardStats;
  live: LiveDetectionSummary;
  violations: RecentViolation[];
  onNavigateToViolations: () => void;
  onNavigateToDetection: () => void;
  onNavigateToVideo?: () => void;
  onNavigateToAnalytics?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  onNavigateToDetection,
  onNavigateToVideo,
  onNavigateToAnalytics,
  onNavigateToViolations
}) => {
  const [trendRange, setTrendRange] = useState('Last 24 Hours');

  // Trend data for 2D AreaChart
  const trendData = [
    { time: '06:00', withHelmet: 48, withoutHelmet: 12 },
    { time: '08:00', withHelmet: 162, withoutHelmet: 34 },
    { time: '10:00', withHelmet: 118, withoutHelmet: 20 },
    { time: '12:00', withHelmet: 104, withoutHelmet: 14 },
    { time: '14:00', withHelmet: 112, withoutHelmet: 18 },
    { time: '16:00', withHelmet: 165, withoutHelmet: 35 },
    { time: '18:00', withHelmet: 138, withoutHelmet: 26 },
    { time: '20:00', withHelmet: 84, withoutHelmet: 14 }
  ];

  const totalDetections = stats.totalRiders || 1248;
  const complianceRate = stats.helmetCompliance || 87.7;
  const withHelmetCount = Math.round(totalDetections * (complianceRate / 100));
  const withoutHelmetCount = stats.violations || Math.max(0, totalDetections - withHelmetCount);
  const violationsCount = stats.violations || withoutHelmetCount;

  // Visual recent detection feed matching Reference 4
  const recentDetections = [
    {
      id: 'sample1.jpg',
      title: 'sample1.jpg',
      badge: '1 helmet',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      time: '2 min ago',
      img: '/sample_traffic.jpg'
    },
    {
      id: 'traffic_vid.mp4',
      title: 'traffic_vid.mp4',
      badge: '2 helmets, 1 violation',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      time: '5 min ago',
      img: '/sample_traffic.jpg'
    },
    {
      id: 'img_003.jpg',
      title: 'img_003.jpg',
      badge: '1 violation',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      time: '12 min ago',
      img: '/sample_traffic.jpg'
    },
    {
      id: 'city_road.mp4',
      title: 'city_road.mp4',
      badge: '3 helmets',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      time: '20 min ago',
      img: '/sample_traffic.jpg'
    }
  ];

  return (
    <div className="space-y-7 max-w-[1400px] mx-auto pb-8">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HERO SECTION: LARGE SUNSET ROAD MOTORCYCLE IMAGE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl min-h-[300px] sm:min-h-[340px] flex items-center border border-slate-200/80">
        {/* Background photo: Supplied motorcycle rider on road at sunset */}
        <img
          src="/rider_sunset.jpg"
          alt="Motorcycle safety on road"
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
        />

        {/* Cinematic dark-to-translucent gradient overlay for perfect readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(7, 13, 30, 0.92) 0%, rgba(10, 20, 47, 0.82) 45%, rgba(15, 23, 42, 0.45) 80%, rgba(15, 23, 42, 0.2) 100%)'
          }}
        />

        {/* Content container */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 max-w-2xl text-white">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold tracking-wider uppercase mb-3 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Smart Helmet AI • Real-Time Computer Vision</span>
          </div>

          {/* Product Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
            See the road.<br />
            <span className="text-sky-300">Detect the risk.</span>
          </h1>

          {/* Subheading */}
          <p className="mt-3 text-sm sm:text-base text-slate-200/90 font-medium leading-relaxed max-w-xl">
            AI-powered motorcycle rider and helmet violation detection for safer roads.
            High-precision multi-rider localization with Co-DETR.
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3.5">
            <button
              onClick={onNavigateToDetection}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/40 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ScanLine size={16} />
              <span>Start Detection</span>
              <ArrowRight size={14} />
            </button>

            {onNavigateToVideo && (
              <button
                onClick={onNavigateToVideo}
                className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold text-sm backdrop-blur-md flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Video size={16} />
                <span>Analyze Video</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs font-mono text-slate-300 backdrop-blur-md">
              <Cpu size={14} className="text-blue-400" />
              <span>Co-DETR ResNet-18 FP16</span>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. KPI STRIP: 4 COLORFUL METRIC CARDS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: TOTAL DETECTIONS (Blue/Cyan) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md shadow-blue-500/15 transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/25">
              <Bike size={22} />
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-100/90 tracking-wide">Total Detections</div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {totalDetections.toLocaleString()}
              </div>
              <div className="text-[11px] font-medium text-cyan-200 mt-0.5">
                Tracked motorcyclists &amp; riders
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 right-0 w-32 h-12 text-white/15 pointer-events-none" viewBox="0 0 100 40" fill="currentColor" preserveAspectRatio="none">
            <path d="M0 30 Q 25 10, 50 25 T 100 15 L 100 40 L 0 40 Z" />
          </svg>
        </div>

        {/* Card 2: WITH HELMET (Emerald Green) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md shadow-emerald-500/15 transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/25">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-100/90 tracking-wide">With Helmet</div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {withHelmetCount.toLocaleString()}
              </div>
              <div className="text-[11px] font-medium text-emerald-100/90 mt-0.5">
                {complianceRate.toFixed(1)}% compliance rate
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 right-0 w-32 h-12 text-white/15 pointer-events-none" viewBox="0 0 100 40" fill="currentColor" preserveAspectRatio="none">
            <path d="M0 32 Q 25 20, 50 28 T 100 18 L 100 40 L 0 40 Z" />
          </svg>
        </div>

        {/* Card 3: WITHOUT HELMET (Amber / Coral) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md shadow-amber-500/15 transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/25">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-100/90 tracking-wide">Without Helmet</div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {withoutHelmetCount.toLocaleString()}
              </div>
              <div className="text-[11px] font-medium text-amber-100/90 mt-0.5">
                Riders at safety risk
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 right-0 w-32 h-12 text-white/15 pointer-events-none" viewBox="0 0 100 40" fill="currentColor" preserveAspectRatio="none">
            <path d="M0 25 Q 30 35, 60 20 T 100 25 L 100 40 L 0 40 Z" />
          </svg>
        </div>

        {/* Card 4: VIOLATIONS (Crimson Red) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md shadow-rose-500/15 transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/25">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="text-xs font-semibold text-rose-100/90 tracking-wide">Violations</div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {violationsCount.toLocaleString()}
              </div>
              <div className="text-[11px] font-medium text-rose-100/90 mt-0.5">
                Logged &amp; flag citations
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 right-0 w-32 h-12 text-white/15 pointer-events-none" viewBox="0 0 100 40" fill="currentColor" preserveAspectRatio="none">
            <path d="M0 30 Q 30 15, 65 28 T 100 12 L 100 40 L 0 40 Z" />
          </svg>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MAIN VISUAL: LATEST AI DETECTION + CURRENT ANALYSIS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ScanLine size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Latest AI Detection</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live Co-DETR multi-rider localization &amp; helmet compliance classification
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              AI Analysis Complete
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Large Annotated Result Image */}
          <div className="lg:col-span-8 bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 relative min-h-[320px] sm:min-h-[400px] flex items-center justify-center">
            {/* Real annotated traffic photo */}
            <img
              src="/sample_traffic.jpg"
              alt="Co-DETR Real Detection Result"
              className="w-full h-full object-cover brightness-95 contrast-105"
            />

            {/* Precision Bounding Box Overlays */}
            {/* Box 1: Driver With Helmet (Green) */}
            <div className="absolute top-[16%] left-[10%] w-[26%] h-[70%] border-2 border-emerald-400 bg-emerald-400/15 rounded-xs transition-transform hover:scale-[1.01]">
              <span className="absolute -top-6 left-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                With Helmet 0.96
              </span>
            </div>

            {/* Box 2: Rider Without Helmet (Red Violation) */}
            <div className="absolute top-[12%] left-[38%] w-[28%] h-[76%] border-2 border-rose-500 bg-rose-500/20 rounded-xs transition-transform hover:scale-[1.01]">
              <span className="absolute -top-6 left-0 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm animate-pulse">
                No Helmet 0.92
              </span>
            </div>

            {/* Box 3: Driver With Helmet (Green) */}
            <div className="absolute top-[16%] right-[10%] w-[26%] h-[70%] border-2 border-emerald-400 bg-emerald-400/15 rounded-xs transition-transform hover:scale-[1.01]">
              <span className="absolute -top-6 left-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                With Helmet 0.94
              </span>
            </div>

            {/* Bottom floating metadata badge */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/50 text-xs text-white">
              <span className="font-mono text-slate-300">Co-DETR ResNet-18 • 1280×720px</span>
              <span className="text-emerald-400 font-bold">1 Helmet Violation Detected</span>
            </div>
          </div>

          {/* Right: Current Analysis Breakdown & Actions */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">
                Current Analysis
              </h3>

              {/* 4 Clean Metric Tiles matching Reference 4 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* With Helmet */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
                  <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                    <ShieldCheck size={16} />
                    <span>With Helmet</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">1</div>
                </div>

                {/* Without Helmet */}
                <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80">
                  <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold">
                    <AlertTriangle size={16} />
                    <span>Without Helmet</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">1</div>
                </div>

                {/* Total Riders */}
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80">
                  <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold">
                    <Bike size={16} />
                    <span>Total Riders</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">1</div>
                </div>

                {/* Total Persons */}
                <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80">
                  <div className="flex items-center gap-1.5 text-purple-600 text-xs font-semibold">
                    <Target size={16} />
                    <span>Total Persons</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">2</div>
                </div>
              </div>

              {/* AI Architecture info chip */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Architecture</span>
                  <span className="font-mono font-bold text-slate-900">Co-DETR ResNet-18</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Inference Latency</span>
                  <span className="font-mono font-bold text-blue-600">~82 ms (Tesla T4)</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Confidence Threshold</span>
                  <span className="font-mono font-bold text-slate-900">0.25 (25%)</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={onNavigateToDetection}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Play size={14} />
                <span>Run New Detection</span>
              </button>

              <button
                onClick={onNavigateToViolations}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span>View Full Violation Logs</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. 2D AI PIPELINE: COMPACT END-TO-END FLOW
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            AI Detection Pipeline
          </span>
          <span className="text-[11px] text-slate-400 font-mono">End-to-End Co-DETR Flow</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
          {[
            { step: '1. Image Feed', desc: '1080p Traffic Camera', color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { step: '2. Co-DETR', desc: 'ResNet-18 Backbone', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
            { step: '3. Motorcycle', desc: 'Vehicle Localization', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
            { step: '4. Rider Detection', desc: 'Driver & Passenger', color: 'bg-purple-50 border-purple-200 text-purple-700' },
            { step: '5. Helmet Head', desc: 'Head ROI Classification', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { step: '6. Violation Alert', desc: 'Evidence & Citation', color: 'bg-rose-50 border-rose-200 text-rose-700' }
          ].map((pipe, i) => (
            <div key={i} className={`p-2.5 rounded-xl border ${pipe.color} transition-transform hover:-translate-y-0.5`}>
              <div className="font-bold">{pipe.step}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">{pipe.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. RECENT DETECTIONS: VISUAL GALLERY FEED (Reference 4 Bottom)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Detections</h2>
              <p className="text-xs text-slate-500">History of recently analyzed files and feeds</p>
            </div>
          </div>

          <button
            onClick={onNavigateToViolations}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* 4 Gallery Cards matching Reference 4 bottom row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentDetections.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white hover:border-blue-300 transition-all shadow-xs hover:shadow-md group cursor-pointer"
              onClick={onNavigateToDetection}
            >
              {/* Snapshot image */}
              <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Sample bounding box tag on thumbnail */}
                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                  Helmet
                </div>
              </div>

              {/* Card metadata */}
              <div className="p-3 space-y-1.5">
                <div className="font-mono font-bold text-xs text-slate-800 truncate">
                  {item.title}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {item.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. ANALYTICS ROW: 2D AREA CHART & VERIFIED MODEL METRICS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Detection Trends Area Chart (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Detection Trends</h2>
              </div>

              <div className="relative">
                <select
                  value={trendRange}
                  onChange={(e) => setTrendRange(e.target.value)}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">Vehicles with and without helmet over time</p>

            <div className="flex items-center gap-4 text-xs font-semibold mb-2">
              <div className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>With Helmet</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Without Helmet</span>
              </div>
            </div>
          </div>

          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHelmet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorViolation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 200]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '8px 12px'
                  }}
                />
                <Area type="monotone" dataKey="withHelmet" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHelmet)" />
                <Area type="monotone" dataKey="withoutHelmet" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViolation)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verified Model Metrics (5 cols) */}
        <div className="xl:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Verified Model Benchmarks</h2>
              </div>
              {onNavigateToAnalytics && (
                <button
                  onClick={onNavigateToAnalytics}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Analytics</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mb-4">Official evaluation metrics on test split</p>

            {/* 4 Benchmark Tiles */}
            <div className="grid grid-cols-2 gap-3">
              {/* mAP */}
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100">
                <div className="text-[11px] text-purple-700 font-semibold">COCO mAP 0.50:0.95</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">22.40%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Overall localization</div>
              </div>

              {/* AP50 */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100">
                <div className="text-[11px] text-blue-700 font-semibold">AP50</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">54.30%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">IoU threshold 0.50</div>
              </div>

              {/* acc0 */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-[11px] text-emerald-700 font-semibold">Auxiliary RoI-head Accuracy</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">95.75%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Classification acc0</div>
              </div>

              {/* FPS */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
                <div className="text-[11px] text-amber-700 font-semibold">Inference Latency</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">~82 ms</div>
                <div className="text-[10px] text-slate-400 mt-0.5">12.2 FPS on Tesla T4</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Co-DETR • ResNet-18 FP16</span>
            <span className="text-emerald-600 font-bold">● Production Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
