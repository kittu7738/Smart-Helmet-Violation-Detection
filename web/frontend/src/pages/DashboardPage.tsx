import React, { useState } from 'react';
import { Scene } from '../three/Scene';
import { StatsCards } from '../components/StatsCards';
import { LiveDetectionPanel } from '../components/LiveDetectionPanel';
import { ViolationsTable } from '../components/ViolationsTable';
import { TrafficFlowChart } from '../components/TrafficFlowChart';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from '../types/detection';
import {
  ArrowUpRight,
  Cpu,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Clock,
  Camera,
  FileText,
  Video
} from 'lucide-react';

interface DashboardPageProps {
  stats: DashboardStats;
  live: LiveDetectionSummary;
  violations: RecentViolation[];
  onNavigateToViolations: () => void;
  onNavigateToDetection: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  live,
  violations,
  onNavigateToViolations,
  onNavigateToDetection
}) => {
  const [highlightViolation, setHighlightViolation] = useState(false);

  // 3 Primary Curated Recent Infractions with rich CCTV snapshot thumbnails
  const highlightInfractions = [
    {
      title: 'NO HELMET — DRIVER',
      vehicle: 'Bike #03',
      plate: 'MH-04-AB-2041',
      confidence: 94.7,
      time: '10:42:18 AM',
      location: 'North Intersection Cam 02',
      status: 'CRITICAL',
      speed: '48 km/h',
      lane: 'Lane 1 (Northbound)',
      boxColor: '#FF3158',
    },
    {
      title: 'NO HELMET — PASSENGER',
      vehicle: 'Bike #07',
      plate: 'GJ-01-QQ-7891',
      confidence: 92.3,
      time: '10:15:02 AM',
      location: 'Main Toll Gate Cam 01',
      status: 'LOGGED',
      speed: '52 km/h',
      lane: 'Lane 3 (Express)',
      boxColor: '#FF3158',
    },
    {
      title: 'TRIPLE RIDING',
      vehicle: 'Bike #12',
      plate: 'AP-10-TR-6543',
      confidence: 88.1,
      time: '09:58:30 AM',
      location: 'Central Junction Cam 05',
      status: 'REVIEWED',
      speed: '34 km/h',
      lane: 'Lane 2 (Eastbound)',
      boxColor: '#FFD400',
    },
  ];

  return (
    <div className="space-y-7 w-full">
      {/* Top Banner: Co-DETR Swin-L Vision Pipeline Ready & Action Controls */}
      <div className="neon-glass-card rounded-2xl px-5 sm:px-6 py-4 border-2 border-[#00E5FF]/40 shadow-[0_0_25px_rgba(0,229,255,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#00E5FF]/20 border-2 border-[#00E5FF] text-[#00E5FF] shadow-neon-cyan flex-shrink-0">
            <Cpu className="w-6 h-6 drop-shadow-[0_0_6px_#00E5FF]" />
          </div>
          <div>
            <span className="font-tech text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2.5">
              <span>Co-DETR Swin-L Vision Pipeline Active</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF9C] shadow-neon-green animate-ping" />
            </span>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Real-time telemetry streaming • 9-Class AI City Challenge dual-head detection active
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setHighlightViolation((prev) => !prev)}
            className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl font-mono font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border-2 ${
              highlightViolation
                ? 'bg-[#FF3158]/30 text-[#FF3158] border-[#FF3158] shadow-neon-red scale-105'
                : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-[#FF3158] hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-[#FF3158]" />
            <span>{highlightViolation ? 'VIOLATION SIMULATED' : 'SIMULATE VIOLATION TAG'}</span>
          </button>

          <button
            onClick={onNavigateToDetection}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#006CFF] to-[#1687FF] text-white font-mono font-black text-xs sm:text-sm shadow-neon-cyan hover:opacity-95 transition-all flex items-center justify-center gap-2 border border-[#00E5FF]"
          >
            <Video className="w-4 h-4" />
            <span>ANALYZE VIDEO</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Statistics Grid (4 Vibrant Hero KPI Cards) */}
      <StatsCards stats={stats} />

      {/* Main Center Grid: 3D Visualization Hero (8 cols) + Live Stream Telemetry (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Large 3D Hero Viewport (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#00E5FF] animate-pulse drop-shadow-[0_0_8px_#00E5FF]" />
              <h2 className="font-tech text-lg sm:text-xl font-black uppercase tracking-wider text-white text-glow-cyan">
                INTERACTIVE 3D MOTORCYCLE SENSOR VIEW
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#00FF9C] hidden sm:inline bg-[#00FF9C]/15 px-3 py-1 rounded-lg border border-[#00FF9C]/40 shadow-neon-green">
              ● REALTIME DIGITAL TWIN HERO
            </span>
          </div>

          <div className="flex-1 w-full min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] xl:min-h-[700px]">
            <Scene highlightViolation={highlightViolation} />
          </div>
        </div>

        {/* Live Detection & Current Focus Panel (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-tech text-lg sm:text-xl font-black uppercase tracking-wider text-white text-glow-cyan">
              ACTIVE STREAM TELEMETRY
            </h2>
            <span className="text-xs font-mono text-[#00E5FF] font-bold bg-[#00E5FF]/10 px-2.5 py-1 rounded border border-[#00E5FF]/30">
              REST GATEWAY
            </span>
          </div>
          <div className="flex-1">
            <LiveDetectionPanel data={live} />
          </div>
        </div>
      </div>

      {/* Real-time Traffic Flow Bar Chart (1-Hour Buffer) */}
      <TrafficFlowChart />

      {/* Recent Infractions: 3 Large Rich Visual Cards with CCTV Frames */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF3158] drop-shadow-[0_0_8px_#FF3158]" />
            <h2 className="font-tech text-lg sm:text-xl font-black tracking-wider text-white uppercase text-glow-red">
              RECENT INFRACTIONS
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-300 font-bold bg-[#FF3158]/15 px-3 py-1 rounded-lg border border-[#FF3158]/40">
            AUTO-FLAGGED BY CO-DETR
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {highlightInfractions.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#20050E]/95 via-[#140309]/95 to-[#0A0205]/95 border-2 border-[#FF3158] shadow-neon-red hover:shadow-neon-red-lg transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden group flex flex-col justify-between"
            >
              {/* Corner ambient glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF3158]/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

              <div>
                {/* Header: Title and Confidence */}
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-black text-[#FF3158] text-glow-red uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    {item.title}
                  </span>
                  <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded bg-[#FF3158] text-white shadow-neon-red">
                    {item.confidence}% CONF
                  </span>
                </div>

                {/* Simulated CCTV Surveillance Frame Crop */}
                <div className="relative w-full h-36 rounded-xl bg-[#060B19] border border-[#FF3158]/50 overflow-hidden mb-4 flex items-center justify-center group-hover:border-[#FF3158] transition-colors">
                  {/* Subtle CCTV scanline effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.6)_51%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

                  {/* CCTV Watermarks */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[10px] font-mono text-[#00FF9C]">
                    <span className="w-2 h-2 rounded-full bg-[#FF3158] animate-ping" />
                    <span className="text-white font-bold">REC ● {item.location.split(' ')[0]}</span>
                  </div>
                  <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-400">
                    {item.time}
                  </div>

                  {/* Center AI Target Graphic */}
                  <div className="relative border-2 border-dashed border-[#FF3158] w-28 h-24 rounded flex flex-col items-center justify-center p-1 bg-[#FF3158]/10 shadow-[0_0_15px_rgba(255,49,88,0.3)]">
                    <span className="text-[9px] font-mono font-black text-[#FF3158] bg-[#060B19] px-1 py-0.5 rounded border border-[#FF3158]">
                      VIOLATION
                    </span>
                    <span className="text-[11px] font-tech text-white font-bold mt-1">
                      {item.vehicle}
                    </span>
                    <span className="text-[9px] font-mono text-slate-300">
                      {item.speed}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400">
                    {item.lane}
                  </div>
                </div>

                {/* Vehicle ID & Plate */}
                <div className="text-xl sm:text-2xl font-black font-tech text-white mb-1">
                  {item.vehicle}{' '}
                  <span className="text-sm sm:text-base font-mono font-normal text-slate-300">
                    ({item.plate})
                  </span>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono mt-4 pt-3 border-t border-white/10">
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-[#00E5FF]" />
                  {item.time}
                </span>
                <span className="flex items-center gap-1 text-[#00E5FF] font-semibold">
                  <Camera className="w-3.5 h-3.5" />
                  {item.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Recent Violations Audit Log Table */}
      <div className="neon-glass-panel rounded-2xl p-6 sm:p-7 border-2 border-[#00E5FF]/30 shadow-[0_0_30px_rgba(0,229,255,0.15)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#00E5FF]/20">
          <div>
            <h2 className="font-tech text-xl sm:text-2xl font-black tracking-wider text-white uppercase text-glow-cyan">
              Full Traffic Violations Audit Log
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Live automated surveillance detections with license plates and enforcement status
            </p>
          </div>
          <button
            onClick={onNavigateToViolations}
            className="flex items-center gap-2 text-xs font-mono font-bold text-[#00E5FF] hover:text-[#00FF9C] transition-colors self-start sm:self-auto bg-[#00E5FF]/15 px-4 py-2 rounded-xl border-2 border-[#00E5FF]/50 shadow-neon-cyan"
          >
            <FileText className="w-4 h-4" />
            <span>VIEW ALL VIOLATIONS</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <ViolationsTable violations={violations.slice(0, 5)} compact={true} />
      </div>
    </div>
  );
};
