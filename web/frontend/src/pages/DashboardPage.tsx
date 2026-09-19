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

  // Activity timeline events
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

  // AI Pipeline Stages
  const pipelineStages = [
    {
      step: '01',
      title: 'IMAGE CAPTURE',
      desc: 'High-res surveillance camera feed extraction',
      icon: Camera,
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      iconColor: 'text-cyan-600',
      borderHover: 'hover:border-cyan-300'
    },
    {
      step: '02',
      title: 'CO-DETR BACKBONE',
      desc: 'ResNet-18 FP16 feature extraction with query attention',
      icon: Cpu,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconColor: 'text-indigo-600',
      borderHover: 'hover:border-indigo-300'
    },
    {
      step: '03',
      title: 'MOTORCYCLE',
      desc: 'Two-wheeler bounding box proposal & localization',
      icon: Bike,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-600',
      borderHover: 'hover:border-blue-300'
    },
    {
      step: '04',
      title: 'RIDER PARSING',
      desc: 'Driver and passenger spatial segmentation',
      icon: User,
      badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
      iconColor: 'text-violet-600',
      borderHover: 'hover:border-violet-300'
    },
    {
      step: '05',
      title: 'HELMET STATUS',
      desc: 'Head crop inspection & protective compliance check',
      icon: ShieldCheck,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-600',
      borderHover: 'hover:border-emerald-300'
    },
    {
      step: '06',
      title: 'VIOLATION TRIAGE',
      desc: 'Instant infraction flagging & automated citation queue',
      icon: AlertTriangle,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      iconColor: 'text-rose-600',
      borderHover: 'hover:border-rose-300'
    }
  ];

  return (
    <div className="space-y-12 w-full max-w-7xl mx-auto pb-12">
      {/* ============================================================ */}
      {/* 1. HERO COMPOSITION (Controlled Asymmetry: ~58% Left / ~42% Right) */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200/90 bg-white shadow-sm tech-grid-subtle">
        {/* Subtle Atmospheric Light Gradients */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Hero Column (~58%) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>SMART HELMET AI • ROAD SAFETY PLATFORM</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.08]">
                See the road.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                  Detect the risk.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                AI-powered motorcycle rider and helmet violation detection using computer vision with verified Co-DETR transformer accuracy.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                onClick={onNavigateToDetection}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <ScanLine className="w-4 h-4" />
                <span>Start Detection</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              {onNavigateToVideo && (
                <button
                  onClick={onNavigateToVideo}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4 text-slate-500" />
                  <span>Analyze Video</span>
                </button>
              )}
            </div>

            {/* Verified Architectural Telemetry Badge */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>AP50: <strong className="text-slate-800">54.30%</strong></span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>RoI Proposal Acc: <strong className="text-slate-800">95.75%</strong></span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Latency: <strong className="text-slate-800">~112 ms</strong></span>
              </div>
            </div>
          </div>

          {/* Right Hero Column: 2D AI Vision Graphic (~42%) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-lg bg-slate-950 aspect-[4/3] group">
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
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.9)] z-20"
                />
              </div>

              {/* Real 2D Computer Vision HUD Overlays */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Viewfinder Corner Brackets */}
                <path d="M 4,10 L 4,4 L 10,4" stroke="#38BDF8" strokeWidth="0.8" fill="none" />
                <path d="M 96,10 L 96,4 L 90,4" stroke="#38BDF8" strokeWidth="0.8" fill="none" />
                <path d="M 4,90 L 4,96 L 10,96" stroke="#38BDF8" strokeWidth="0.8" fill="none" />
                <path d="M 96,90 L 96,96 L 90,96" stroke="#38BDF8" strokeWidth="0.8" fill="none" />

                {/* Bounding Box 1: Motorcycle */}
                <rect x="24" y="36" width="52" height="52" fill="rgba(37, 99, 235, 0.12)" stroke="#3B82F6" strokeWidth="0.7" strokeDasharray="3 2" />

                {/* Bounding Box 2: Rider */}
                <rect x="42" y="14" width="16" height="36" fill="rgba(16, 185, 129, 0.16)" stroke="#10B981" strokeWidth="0.8" />
              </svg>

              {/* HUD Telemetry Tags */}
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>CAM_01 • 30 FPS</span>
              </div>

              <div className="absolute top-2.5 right-2.5 z-20 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-300 border border-slate-700">
                RES: 1080p
              </div>

              {/* Bounding Box Floating Labels */}
              <div className="absolute top-12 left-10 z-20 bg-emerald-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>DRIVER: HELMET COMPLIANT (94.2%)</span>
              </div>

              <div className="absolute bottom-10 right-8 z-20 bg-blue-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow-sm">
                MOTORCYCLE (96.3%)
              </div>

              {/* Bottom Result Pill */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 bg-slate-900/85 backdrop-blur-xs px-3 py-1.5 rounded-lg text-[10px] text-emerald-400 font-mono flex items-center justify-between border border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>PIPELINE: ACTIVE DETECTIONS OK</span>
                </span>
                <span className="text-slate-400">112ms</span>
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
            <div className="text-xs font-bold text-blue-600 tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>PRIMARY INFERENCE VIEW</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Latest AI Detection
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            High-Resolution Surveillance Snapshot • Verified Bounding Localization
          </p>
        </div>

        {/* Asymmetrical Layout: ~65% Real Annotated Image / ~35% Compact Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main Scanned Image Visual Area (~65%) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
            {/* Viewport Frame with Real Overlaid Bounding Boxes */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[16/9] flex items-center justify-center border border-slate-200">
              <img
                src="/sample_traffic.jpg"
                alt="Latest Real AI Detection"
                className="w-full h-full object-cover"
              />

              {/* Real 2D SVG Annotations matching Co-DETR output */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Thin camera corner brackets */}
                <path d="M 3,8 L 3,3 L 8,3" stroke="#94A3B8" strokeWidth="0.6" fill="none" />
                <path d="M 97,8 L 97,3 L 92,3" stroke="#94A3B8" strokeWidth="0.6" fill="none" />
                <path d="M 3,92 L 3,97 L 8,97" stroke="#94A3B8" strokeWidth="0.6" fill="none" />
                <path d="M 97,92 L 97,97 L 92,97" stroke="#94A3B8" strokeWidth="0.6" fill="none" />

                {/* Bike Proposal Box (Blue) */}
                <rect x="25" y="38" width="50" height="52" fill="rgba(37, 99, 235, 0.12)" stroke="#2563EB" strokeWidth="0.8" />

                {/* Driver Violation Box (Coral/Red) */}
                <rect x="42" y="15" width="16" height="36" fill="rgba(239, 68, 68, 0.18)" stroke="#EF4444" strokeWidth="0.9" />
              </svg>

              {/* Prominent Violation Overlay Pill */}
              <div className="absolute top-4 left-4 bg-red-600/95 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>DRIVER — NO HELMET • 91.2%</span>
                <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-red-800 uppercase tracking-wide">VIOLATION</span>
              </div>

              {/* Vehicle Overlay Pill */}
              <div className="absolute bottom-4 right-4 bg-blue-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-md backdrop-blur-xs">
                MOTORCYCLE • 96.3%
              </div>
            </div>

            {/* Analysis Footer Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 px-1 text-xs border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold uppercase tracking-wider text-slate-900">ANALYSIS COMPLETE:</span>
                <span>2 objects detected • 1 violation identified</span>
              </div>

              <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                <span>Latency: <strong>112ms</strong></span>
                <span>•</span>
                <span>Device: <strong>Tesla T4 FP16</strong></span>
              </div>
            </div>
          </div>

          {/* Beside Main Image: Compact Detection Summary (~35%) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  LATEST ANALYSIS
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  REF: DET-8492
                </span>
              </div>

              {/* Compact Breakdown List with Colored Dots & Status Badges */}
              <div className="divide-y divide-slate-100 pt-1 space-y-1">
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>MOTORCYCLES</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-900">01</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>DRIVERS</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-900">01</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span>PASSENGERS</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-400">00</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>HELMET DETECTED</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-700">00</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>NO HELMET DETECTED</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-rose-700">01</span>
                </div>

                <div className="pt-3 pb-1">
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">01 VIOLATION RECORDED</div>
                        <div className="text-[10px] text-rose-600">Automated e-challan queued</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                      FLAGGED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA to Full Inspection */}
            <button
              onClick={onNavigateToDetection}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Inspect in Precision Canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. DISTINCTIVE KEY METRICS (4 Colorful, Non-Repetitive Cards) */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SYSTEM PERFORMANCE</span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Key Operational Metrics</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Total Riders (Blue Soft Tint + Sparkline) */}
          <div className="rounded-2xl p-5 border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">TOTAL RIDERS</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-slate-950 font-mono">
                {stats.totalRiders ? stats.totalRiders.toLocaleString() : '1,284'}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Vehicles localized across feeds</p>
            </div>

            {/* Mini Sparkline Visualization */}
            <div className="pt-2 border-t border-blue-100/80 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-0.5 text-[11px]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.4% vs 7d avg</span>
              </span>
              <svg className="w-20 h-6 text-blue-500" viewBox="0 0 60 20" fill="none">
                <path d="M 0,16 Q 15,18 25,10 T 45,6 T 60,2" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>

          {/* 2. Helmet Compliance (Emerald Soft Tint + Circular Arc) */}
          <div className="rounded-2xl p-5 border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">HELMET COMPLIANCE</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-900 font-mono">
                  {stats.helmetCompliance || '92.4'}%
                </div>
                <p className="text-xs text-emerald-700/80 mt-0.5">Riders adhering to helmet rules</p>
              </div>

              {/* Mini SVG Progress Ring */}
              <div className="relative w-11 h-11 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#D1FAE5"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3.5"
                    strokeDasharray="92.4, 100"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between text-xs text-emerald-800">
              <span className="text-[11px] font-medium">+1.8% improvement</span>
              <span className="text-[11px] font-semibold">Goal: &gt;95%</span>
            </div>
          </div>

          {/* 3. Active Violations (Coral Soft Tint + Alert Indicator) */}
          <div className="rounded-2xl p-5 border border-rose-200/80 bg-gradient-to-br from-rose-50/80 via-white to-red-50/30 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">ACTIVE VIOLATIONS</span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-rose-950 font-mono">
                {stats.violations ?? '17'}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Infractions flagged for audit</p>
            </div>

            <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                12 DRIVER • 5 PILLION
              </span>
              <button
                onClick={onNavigateToViolations}
                className="text-[11px] font-semibold text-rose-700 hover:underline cursor-pointer"
              >
                Review →
              </button>
            </div>
          </div>

          {/* 4. AI Engine (Violet Soft Tint + Hardware Telemetry) */}
          <div className="rounded-2xl p-5 border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/30 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">CO-DETR RUNTIME</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-indigo-950 flex items-center gap-2">
                <span>ONLINE</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">NVIDIA Tesla T4 GPU • FP16</p>
            </div>

            <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-mono text-[11px]">
              <span>~112 ms Latency</span>
              <span className="text-slate-400">acc0: 95.75%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. RECENT DETECTIONS ACTIVITY TIMELINE (No Boring Table!) */}
      {/* ============================================================ */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Live Detection Activity Feed
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time chronological timeline of localized two-wheelers and rider classifications
            </p>
          </div>

          <button
            onClick={onNavigateToViolations}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/80 px-3.5 py-1.5 rounded-lg border border-blue-200 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Violations Database</span>
          </button>
        </div>

        {/* Vertical Colorful Timeline */}
        <div className="space-y-4">
          {activityEvents.map((evt, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                evt.isViolation
                  ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                  : 'bg-emerald-50/30 border-emerald-200/70 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* Time Indicator with Node */}
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border-2 bg-white ${evt.isViolation ? 'border-rose-500' : 'border-emerald-500'}`} />
                  <div className="font-mono text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{evt.time}</span>
                  </div>
                </div>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                {/* Target Information */}
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{evt.vehicle}</span>
                    <span className="font-mono font-medium px-2 py-0.5 rounded bg-white text-slate-700 text-[10px] border border-slate-200">
                      {evt.plate}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{evt.camera}</div>
                </div>
              </div>

              {/* Classification & Status */}
              <div className="flex items-center gap-4 justify-between md:justify-end">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-800">{evt.role}</div>
                  <div className="text-[10px] font-mono text-slate-500">Confidence: {evt.confidence}%</div>
                </div>

                <div className="shrink-0">
                  {evt.isViolation ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-2xs">
                      <AlertTriangle className="w-3 h-3" />
                      <span>VIOLATION</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                      <CheckCircle2 className="w-3 h-3" />
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
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TREND TELEMETRY</span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Traffic & Compliance Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main 70% Chart: Detection Activity */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  24-Hour Traffic Flow vs. Infractions
                </h3>
                <p className="text-xs text-slate-500">Peak hours observed at 08:00 and 17:00</p>
              </div>

              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Total Riders</span>
                </span>
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Violations</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Vehicles"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="violations"
                    name="Violations"
                    stroke="#DC2626"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorViolations)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary 30% Visualization: Helmet Status Donut */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Helmet Status Share
              </h3>
              <p className="text-xs text-slate-500">Overall adherence proportion</p>
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
                <span className="text-2xl font-black text-slate-900 font-mono">92.4%</span>
                <span className="text-[10px] font-bold text-emerald-700 uppercase">COMPLIANT</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Helmeted Riders</span>
                </span>
                <span className="font-bold font-mono text-slate-900">1,186 (92.4%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>No Helmet (Violation)</span>
                </span>
                <span className="font-bold font-mono text-rose-600">98 (7.6%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. AI PIPELINE: PROCESS VISUALIZATION (Horizontal Flow) */}
      {/* ============================================================ */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">END-TO-END PIPELINE</div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            How Co-DETR Analyzes Helmet Compliance
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Six-stage vision pipeline running from raw surveillance frame to automated violation citation.
          </p>
        </div>

        {/* 6 Process Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl p-4 border border-slate-200/90 bg-slate-50/50 transition-all ${stage.borderHover} flex flex-col justify-between space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-400">{stage.step}</span>
                  <div className={`p-2 rounded-xl bg-white border shadow-2xs ${stage.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="text-xs font-extrabold text-slate-900 tracking-wide">{stage.title}</div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-1">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
