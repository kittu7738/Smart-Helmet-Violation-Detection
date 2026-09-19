import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ScanLine,
  Video,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  Camera,
  Cpu,
  Bike,
  User,
  CheckCircle2,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from '../types/detection';

interface DashboardPageProps {
  stats: DashboardStats;
  live: LiveDetectionSummary;
  violations: RecentViolation[];
  onNavigateToViolations: () => void;
  onNavigateToDetection: () => void;
  onNavigateToVideo?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  onNavigateToViolations,
  onNavigateToDetection,
  onNavigateToVideo
}) => {
  // Real 24h traffic activity data
  const trafficActivityData = [
    { time: '06:00', total: 46, violations: 4 },
    { time: '08:00', total: 170, violations: 28 },
    { time: '10:00', total: 124, violations: 14 },
    { time: '12:00', total: 100, violations: 11 },
    { time: '14:00', total: 94, violations: 10 },
    { time: '16:00', total: 147, violations: 22 },
    { time: '18:00', total: 139, violations: 19 },
    { time: '20:00', total: 82, violations: 8 }
  ];

  // Helmet compliance distribution for donut chart
  const complianceDistribution = [
    { name: 'Helmet Compliant', value: 92.4, count: 1186, color: '#10B981' },
    { name: 'Violation (No Helmet)', value: 7.6, count: 98, color: '#EF4444' }
  ];

  // Activity timeline events with rich color coding
  const activityEvents = [
    {
      time: '08:42',
      vehicle: 'Motorcycle #01',
      plate: 'MH-04-EK-9214',
      camera: 'Cam 01 • Main Toll Plaza',
      role: 'Driver — Helmet',
      confidence: 94.2,
      isViolation: false
    },
    {
      time: '08:47',
      vehicle: 'Motorcycle #03',
      plate: 'DL-08-KL-9122',
      camera: 'Cam 02 • North Intersection',
      role: 'Driver — No Helmet',
      confidence: 87.1,
      isViolation: true
    },
    {
      time: '08:53',
      vehicle: 'Motorcycle #07',
      plate: 'GJ-01-AX-3819',
      camera: 'Cam 01 • Main Toll Plaza',
      role: 'Passenger — No Helmet',
      confidence: 91.4,
      isViolation: true
    },
    {
      time: '09:12',
      vehicle: 'Motorcycle #11',
      plate: 'KA-03-EM-4580',
      camera: 'Cam 03 • Expressway Flyover',
      role: 'Driver — Helmet',
      confidence: 96.8,
      isViolation: false
    },
    {
      time: '09:28',
      vehicle: 'Motorcycle #14',
      plate: 'MH-12-PQ-7721',
      camera: 'Cam 02 • North Intersection',
      role: 'Driver — No Helmet',
      confidence: 89.5,
      isViolation: true
    }
  ];

  // AI Pipeline Stages with bright, distinct color identities
  const pipelineStages = [
    {
      step: '01',
      title: 'IMAGE CAPTURE',
      desc: 'High-res CCTV surveillance video frame extraction',
      icon: Camera,
      cardBg: 'bg-gradient-to-br from-cyan-100 via-cyan-50 to-white',
      borderColor: 'border-cyan-300 hover:border-cyan-500',
      iconBg: 'bg-cyan-600 text-white shadow-cyan-500/30',
      textColor: 'text-cyan-950',
      badgeBg: 'bg-cyan-200 text-cyan-900'
    },
    {
      step: '02',
      title: 'CO-DETR BACKBONE',
      desc: 'ResNet-18 FP16 feature extraction with query attention',
      icon: Cpu,
      cardBg: 'bg-gradient-to-br from-indigo-100 via-indigo-50 to-white',
      borderColor: 'border-indigo-300 hover:border-indigo-500',
      iconBg: 'bg-indigo-600 text-white shadow-indigo-500/30',
      textColor: 'text-indigo-950',
      badgeBg: 'bg-indigo-200 text-indigo-900'
    },
    {
      step: '03',
      title: 'MOTORCYCLE',
      desc: 'Vehicle bounding box proposal & spatial localization',
      icon: Bike,
      cardBg: 'bg-gradient-to-br from-blue-100 via-blue-50 to-white',
      borderColor: 'border-blue-300 hover:border-blue-500',
      iconBg: 'bg-blue-600 text-white shadow-blue-500/30',
      textColor: 'text-blue-950',
      badgeBg: 'bg-blue-200 text-blue-900'
    },
    {
      step: '04',
      title: 'RIDER PARSING',
      desc: 'Driver and passenger spatial role segmentation',
      icon: User,
      cardBg: 'bg-gradient-to-br from-purple-100 via-violet-50 to-white',
      borderColor: 'border-purple-300 hover:border-purple-500',
      iconBg: 'bg-purple-600 text-white shadow-purple-500/30',
      textColor: 'text-purple-950',
      badgeBg: 'bg-purple-200 text-purple-900'
    },
    {
      step: '05',
      title: 'HELMET STATUS',
      desc: 'Head ROI crop inspection & protective compliance verification',
      icon: ShieldCheck,
      cardBg: 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-white',
      borderColor: 'border-emerald-300 hover:border-emerald-500',
      iconBg: 'bg-emerald-600 text-white shadow-emerald-500/30',
      textColor: 'text-emerald-950',
      badgeBg: 'bg-emerald-200 text-emerald-900'
    },
    {
      step: '06',
      title: 'VIOLATION TRIAGE',
      desc: 'Instant infraction flagging & automated citation queue',
      icon: AlertTriangle,
      cardBg: 'bg-gradient-to-br from-rose-100 via-rose-50 to-white',
      borderColor: 'border-rose-300 hover:border-rose-500',
      iconBg: 'bg-rose-600 text-white shadow-rose-500/30',
      textColor: 'text-rose-950',
      badgeBg: 'bg-rose-200 text-rose-900'
    }
  ];

  return (
    <div className="space-y-12 w-full max-w-7xl mx-auto pb-16">
      {/* ============================================================ */}
      {/* 1. HERO COMPOSITION (Rich Colorful Indigo & Sky Surface) */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-12 border-2 border-indigo-200/90 bg-gradient-to-br from-blue-50/95 via-indigo-50/70 to-purple-50/85 shadow-xl shadow-indigo-100/50 tech-grid-subtle">
        {/* Colorful Floating Glow Accents */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Column (~58%) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold tracking-wider uppercase shadow-md shadow-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>SMART HELMET AI • ROAD SAFETY PLATFORM</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.08]">
                See the road.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Detect the risk.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-700 max-w-xl leading-relaxed font-medium">
                AI-powered motorcycle rider and helmet violation detection using computer vision with verified Co-DETR transformer accuracy.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onNavigateToDetection}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <ScanLine className="w-4 h-4" />
                <span>Start Detection</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              {onNavigateToVideo && (
                <button
                  onClick={onNavigateToVideo}
                  className="px-6 py-3.5 rounded-xl bg-white/95 hover:bg-white text-indigo-950 font-bold text-sm border-2 border-indigo-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer hover:border-indigo-300"
                >
                  <Video className="w-4 h-4 text-indigo-600" />
                  <span>Analyze Video</span>
                </button>
              )}
            </div>

            {/* Verified Architectural Telemetry Badge (Color-Coded Pills) */}
            <div className="pt-4 flex flex-wrap items-center gap-3 text-xs font-mono border-t border-indigo-200/60">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>AP50: 54.30%</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 border border-blue-300 text-blue-900 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>RoI Proposal Acc: 95.75%</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 border border-purple-300 text-purple-900 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                <span>Latency: ~112 ms</span>
              </div>
            </div>
          </div>

          {/* Right Hero Column: 2D AI Vision Graphic (~42%) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-400/50 shadow-2xl shadow-indigo-500/20 bg-slate-950 aspect-[4/3] group">
              {/* Central Motorcycle Surveillance Image */}
              <img
                src="/sample_traffic.jpg"
                alt="Motorcycle AI Vision"
                className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
              />

              {/* Animated Laser Scanning Line */}
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  animate={{ top: ['4%', '92%', '4%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_16px_#22d3ee] z-20"
                />
              </div>

              {/* Real 2D Computer Vision HUD Overlays */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Viewfinder Corner Brackets */}
                <path d="M 4,10 L 4,4 L 10,4" stroke="#38BDF8" strokeWidth="1.2" fill="none" />
                <path d="M 96,10 L 96,4 L 90,4" stroke="#38BDF8" strokeWidth="1.2" fill="none" />
                <path d="M 4,90 L 4,96 L 10,96" stroke="#38BDF8" strokeWidth="1.2" fill="none" />
                <path d="M 96,90 L 96,96 L 90,96" stroke="#38BDF8" strokeWidth="1.2" fill="none" />

                {/* Bounding Box 1: Motorcycle (Blue) */}
                <rect x="24" y="36" width="52" height="52" fill="rgba(37, 99, 235, 0.18)" stroke="#3B82F6" strokeWidth="1" strokeDasharray="3 2" />

                {/* Bounding Box 2: Rider (Emerald) */}
                <rect x="42" y="14" width="16" height="36" fill="rgba(16, 185, 129, 0.22)" stroke="#10B981" strokeWidth="1.2" />
              </svg>

              {/* HUD Telemetry Tags */}
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-mono text-cyan-300 border border-cyan-400/40">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>CAM_01 • 30 FPS</span>
              </div>

              <div className="absolute top-2.5 right-2.5 z-20 bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-mono text-cyan-200 border border-slate-700">
                RES: 1080p
              </div>

              {/* Bounding Box Floating Labels */}
              <div className="absolute top-12 left-10 z-20 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>DRIVER: HELMET COMPLIANT (94.2%)</span>
              </div>

              <div className="absolute bottom-10 right-8 z-20 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md">
                MOTORCYCLE (96.3%)
              </div>

              {/* Bottom Result Pill */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 bg-slate-900/90 backdrop-blur-xs px-3.5 py-2 rounded-xl text-[10px] text-emerald-400 font-mono flex items-center justify-between border border-emerald-500/40">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>PIPELINE: ACTIVE DETECTIONS OK</span>
                </span>
                <span className="text-cyan-300 font-bold">112ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. MAIN AI RESULT: "LATEST AI DETECTION" (The Centerpiece!) */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
          <div>
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>PRIMARY INFERENCE VIEW</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-0.5">
              Latest AI Detection
            </h2>
          </div>
          <div className="text-xs text-indigo-900 font-mono font-semibold bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
            Camera: Toll Plaza North • Live Surveillance Frame
          </div>
        </div>

        {/* Asymmetrical Layout: ~65% Real Annotated Image / ~35% Compact Summary */}
        <div className="rounded-3xl p-6 sm:p-8 border-2 border-blue-300/90 bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/80 shadow-xl shadow-blue-100/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Main Scanned Image Visual Area (~65%) */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
              {/* Gradient Border Wrapping Real Annotated Photo */}
              <div className="p-1.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/20">
                <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[16/9] flex items-center justify-center">
                  <img
                    src="/sample_traffic.jpg"
                    alt="Latest Real AI Detection"
                    className="w-full h-full object-cover"
                  />

                  {/* Real 2D SVG Annotations matching Co-DETR output */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Thin camera corner brackets */}
                    <path d="M 3,8 L 3,3 L 8,3" stroke="#93C5FD" strokeWidth="1" fill="none" />
                    <path d="M 97,8 L 97,3 L 92,3" stroke="#93C5FD" strokeWidth="1" fill="none" />
                    <path d="M 3,92 L 3,97 L 8,97" stroke="#93C5FD" strokeWidth="1" fill="none" />
                    <path d="M 97,92 L 97,97 L 92,97" stroke="#93C5FD" strokeWidth="1" fill="none" />

                    {/* Bike Proposal Box (Blue) */}
                    <rect x="25" y="38" width="50" height="52" fill="rgba(37, 99, 235, 0.16)" stroke="#2563EB" strokeWidth="1.2" />

                    {/* Driver Violation Box (Coral/Red) */}
                    <rect x="42" y="15" width="16" height="36" fill="rgba(239, 68, 68, 0.22)" stroke="#EF4444" strokeWidth="1.4" />
                  </svg>

                  {/* Prominent Violation Overlay Pill */}
                  <div className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 backdrop-blur-xs border border-rose-400">
                    <AlertTriangle className="w-4 h-4 text-white animate-bounce" />
                    <span>DRIVER — NO HELMET • 91.2%</span>
                    <span className="ml-1 px-2 py-0.5 rounded text-[10px] bg-rose-900 font-extrabold uppercase tracking-wider">VIOLATION</span>
                  </div>

                  {/* Vehicle Overlay Pill */}
                  <div className="absolute bottom-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg border border-blue-400">
                    MOTORCYCLE • 96.3%
                  </div>
                </div>
              </div>

              {/* Analysis Footer Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 px-2 text-xs border-t border-indigo-100">
                <div className="flex items-center gap-2 text-slate-800">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-extrabold uppercase tracking-wider text-slate-900">ANALYSIS COMPLETE:</span>
                  <span className="font-semibold text-slate-700">2 objects detected • 1 violation identified</span>
                </div>

                <div className="flex items-center gap-3 text-indigo-900 font-mono text-[11px] font-bold">
                  <span className="bg-indigo-100 px-2 py-0.5 rounded">Latency: 112ms</span>
                  <span>•</span>
                  <span className="bg-blue-100 px-2 py-0.5 rounded">Tesla T4 FP16</span>
                </div>
              </div>
            </div>

            {/* Beside Main Image: Compact Detection Summary (~35%) */}
            <div className="lg:col-span-4 rounded-2xl p-5 border-2 border-indigo-200/90 bg-gradient-to-b from-white via-indigo-50/50 to-blue-50/70 shadow-lg flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                  <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                    LATEST ANALYSIS
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-blue-600 text-white shadow-xs">
                    DET-8492
                  </span>
                </div>

                {/* Compact Breakdown List with Distinct Colorful Backgrounds */}
                <div className="pt-3 space-y-2">
                  <div className="p-2.5 rounded-xl bg-blue-100/70 border border-blue-300/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>MOTORCYCLES</span>
                    </div>
                    <span className="text-xs font-black font-mono text-blue-950 bg-white px-2 py-0.5 rounded border border-blue-200">01</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-100/70 border border-indigo-300/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <span>DRIVERS</span>
                    </div>
                    <span className="text-xs font-black font-mono text-indigo-950 bg-white px-2 py-0.5 rounded border border-indigo-200">01</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span>PASSENGERS</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-500">00</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <span>HELMET DETECTED</span>
                    </div>
                    <span className="text-xs font-black font-mono text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200">00</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-100 border-2 border-rose-300 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-rose-950">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                      <span>NO HELMET DETECTED</span>
                    </div>
                    <span className="text-xs font-black font-mono text-white bg-rose-600 px-2 py-0.5 rounded shadow-2xs">01</span>
                  </div>

                  <div className="pt-2">
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-500/25 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-white shrink-0" />
                        <div>
                          <div className="text-xs font-extrabold uppercase tracking-wide">01 VIOLATION RECORDED</div>
                          <div className="text-[11px] text-rose-100">Automated e-challan queued</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-1 rounded bg-white text-rose-700 shadow">
                        FLAGGED
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA to Full Inspection */}
              <button
                onClick={onNavigateToDetection}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <span>Inspect in Precision Canvas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. DISTINCTIVE KEY METRICS (4 Vibrant Colorful Cards) */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="px-1">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">SYSTEM PERFORMANCE</span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">Key Operational Metrics</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Total Riders (Vibrant Blue Card) */}
          <div className="rounded-2xl p-5 border-2 border-blue-400/80 bg-gradient-to-br from-blue-100 via-blue-50 to-white shadow-lg shadow-blue-200/50 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider">TOTAL RIDERS</span>
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
                <Bike className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-blue-950 font-mono">
                {stats.totalRiders ? stats.totalRiders.toLocaleString() : '1,284'}
              </div>
              <p className="text-xs text-blue-800/80 font-medium mt-0.5">Vehicles localized across feeds</p>
            </div>

            {/* Mini Sparkline Visualization */}
            <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between text-xs">
              <span className="bg-blue-200 text-blue-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.4% vs 7d avg</span>
              </span>
              <svg className="w-20 h-6 text-blue-600" viewBox="0 0 60 20" fill="none">
                <path d="M 0,16 Q 15,18 25,10 T 45,6 T 60,2" stroke="currentColor" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>

          {/* 2. Helmet Compliance (Vibrant Emerald Card) */}
          <div className="rounded-2xl p-5 border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-100 via-emerald-50 to-white shadow-lg shadow-emerald-200/50 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">HELMET COMPLIANCE</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono">
                  {stats.helmetCompliance || '92.4'}%
                </div>
                <p className="text-xs text-emerald-800/80 font-medium mt-0.5">Riders adhering to helmet rules</p>
              </div>

              {/* Mini SVG Progress Ring */}
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#A7F3D0"
                    strokeWidth="4"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="4"
                    strokeDasharray="92.4, 100"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
              <span className="bg-emerald-200 text-emerald-950 font-bold px-2 py-0.5 rounded-full text-[11px]">+1.8% improvement</span>
              <span className="text-[11px] font-bold text-emerald-800">Goal: &gt;95%</span>
            </div>
          </div>

          {/* 3. Active Violations (Vibrant Rose Card) */}
          <div className="rounded-2xl p-5 border-2 border-rose-400/80 bg-gradient-to-br from-rose-100 via-rose-50 to-white shadow-lg shadow-rose-200/50 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-950 uppercase tracking-wider">ACTIVE VIOLATIONS</span>
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-rose-950 font-mono">
                {stats.violations ?? '17'}
              </div>
              <p className="text-xs text-rose-800/80 font-medium mt-0.5">Infractions flagged for audit</p>
            </div>

            <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between text-xs">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-600 text-white shadow-xs">
                12 DRIVER • 5 PILLION
              </span>
              <button
                onClick={onNavigateToViolations}
                className="text-[11px] font-bold text-rose-800 hover:underline cursor-pointer"
              >
                Review →
              </button>
            </div>
          </div>

          {/* 4. AI Engine (Vibrant Violet Card) */}
          <div className="rounded-2xl p-5 border-2 border-violet-400/80 bg-gradient-to-br from-purple-100 via-violet-50 to-white shadow-lg shadow-purple-200/50 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-violet-950 uppercase tracking-wider">CO-DETR RUNTIME</span>
              <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/30">
                <Cpu className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-violet-950 flex items-center gap-2">
                <span>ONLINE</span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-violet-800/80 font-medium mt-0.5">NVIDIA Tesla T4 GPU • FP16</p>
            </div>

            <div className="pt-2 border-t border-violet-200/80 flex items-center justify-between text-xs text-violet-950 font-mono text-[11px] font-bold">
              <span className="bg-violet-200 px-2 py-0.5 rounded">~112 ms</span>
              <span>acc0: 95.75%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. RECENT DETECTIONS ACTIVITY TIMELINE (Rich Colorful Feed) */}
      {/* ============================================================ */}
      <section className="bg-gradient-to-br from-white via-indigo-50/40 to-blue-50/60 rounded-3xl border-2 border-indigo-200/80 p-6 sm:p-8 shadow-xl shadow-indigo-100/40 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight">
                Live Detection Activity Feed
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Chronological timeline of localized two-wheelers and helmet classifications
            </p>
          </div>

          <button
            onClick={onNavigateToViolations}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100 px-4 py-2 rounded-xl border border-indigo-300 transition-colors self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Violations Database</span>
          </button>
        </div>

        {/* Vertical Colorful Timeline with saturated colors */}
        <div className="space-y-4">
          {activityEvents.map((evt, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                evt.isViolation
                  ? 'bg-gradient-to-r from-rose-100/90 via-red-50/90 to-amber-50/60 border-rose-300 shadow-sm hover:border-rose-400'
                  : 'bg-gradient-to-r from-emerald-100/90 via-teal-50/90 to-blue-50/60 border-emerald-300 shadow-sm hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* Time Indicator with Node */}
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 bg-white ${evt.isViolation ? 'border-rose-600 ring-4 ring-rose-200' : 'border-emerald-600 ring-4 ring-emerald-200'}`} />
                  <div className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{evt.time}</span>
                  </div>
                </div>

                <div className="h-4 w-px bg-slate-300 hidden sm:block" />

                {/* Target Information */}
                <div>
                  <div className="text-xs font-extrabold text-slate-950 flex items-center gap-2">
                    <span>{evt.vehicle}</span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-white text-indigo-950 text-[10px] border border-indigo-200 shadow-2xs">
                      {evt.plate}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium mt-0.5">{evt.camera}</div>
                </div>
              </div>

              {/* Classification & Status */}
              <div className="flex items-center gap-4 justify-between md:justify-end">
                <div className="text-right">
                  <div className="text-xs font-extrabold text-slate-950">{evt.role}</div>
                  <div className="text-[10px] font-mono font-semibold text-slate-600">Confidence: {evt.confidence}%</div>
                </div>

                <div className="shrink-0">
                  {evt.isViolation ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/20">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>VIOLATION</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>COMPLIANT</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. ANALYTICS SECTION (70% Activity Chart / 30% Status Donut) */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="px-1">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">TREND TELEMETRY</span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">Traffic & Compliance Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main 70% Chart: Detection Activity */}
          <div className="lg:col-span-8 rounded-3xl p-6 border-2 border-blue-300/90 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/60 shadow-xl shadow-blue-100/40 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-wide">
                  24-Hour Traffic Flow vs. Infractions
                </h3>
                <p className="text-xs text-slate-600 font-medium">Surveillance throughput at hourly monitoring intervals</p>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Total Riders</span>
                </span>
                <span className="flex items-center gap-1.5 text-rose-900 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  <span>Violations</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} fontWeight="bold" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '2px solid #CBD5E1',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Vehicles"
                    stroke="#1D4ED8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="violations"
                    name="Violations"
                    stroke="#B91C1C"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorViolations)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary 30% Visualization: Helmet Status Donut */}
          <div className="lg:col-span-4 rounded-3xl p-6 border-2 border-purple-300/90 bg-gradient-to-br from-purple-50/90 via-white to-emerald-50/60 shadow-xl shadow-purple-100/40 flex flex-col justify-between space-y-4">
            <div className="pb-3 border-b border-purple-100">
              <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-wide">
                Helmet Status Share
              </h3>
              <p className="text-xs text-slate-600 font-medium">Overall safety adherence proportion</p>
            </div>

            <div className="relative h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complianceDistribution}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {complianceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Stat */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-950 font-mono">92.4%</span>
                <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded">COMPLIANT</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-purple-100 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-100/60 border border-emerald-300">
                <span className="flex items-center gap-1.5 text-emerald-950 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>Helmeted Riders</span>
                </span>
                <span className="font-extrabold font-mono text-emerald-950">1,186 (92.4%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-100/60 border border-rose-300">
                <span className="flex items-center gap-1.5 text-rose-950 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  <span>No Helmet (Violation)</span>
                </span>
                <span className="font-extrabold font-mono text-rose-950">98 (7.6%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. AI PIPELINE: PROCESS VISUALIZATION (Vibrant 6 Stages) */}
      {/* ============================================================ */}
      <section className="rounded-3xl border-2 border-indigo-300/90 bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-purple-50/80 p-6 sm:p-8 shadow-xl shadow-indigo-100/40 space-y-6">
        <div>
          <div className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider">END-TO-END PIPELINE</div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight mt-0.5">
            How Co-DETR Analyzes Helmet Compliance
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Six-stage vision pipeline running from raw surveillance frame to automated violation citation.
          </p>
        </div>

        {/* 6 Distinctly Colored Process Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl p-4 border-2 transition-all ${stage.cardBg} ${stage.borderColor} flex flex-col justify-between space-y-3 shadow-md hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded ${stage.badgeBg}`}>{stage.step}</span>
                  <div className={`p-2 rounded-xl shadow-md ${stage.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className={`text-xs font-black tracking-wide ${stage.textColor}`}>{stage.title}</div>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug mt-1">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
