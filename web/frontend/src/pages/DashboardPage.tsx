import React, { useState } from 'react';
import { Scene } from '../three/Scene';
import { StatsCards } from '../components/StatsCards';
import { LiveDetectionPanel } from '../components/LiveDetectionPanel';
import { ViolationsTable } from '../components/ViolationsTable';
import { TrafficFlowChart } from '../components/TrafficFlowChart';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from '../types/detection';
import { ArrowUpRight, Cpu, ShieldAlert, Sparkles, AlertTriangle, Clock, Camera } from 'lucide-react';

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

  // Curated Recent Infractions highlight cards
  const highlightInfractions = [
    {
      title: 'No Helmet - Driver',
      vehicle: 'Bike #03',
      plate: 'MH-04-AB-2041',
      confidence: 94.7,
      time: '10:42:18',
      location: 'North Intersection Cam 02',
      status: 'Detected',
    },
    {
      title: 'No Helmet - Passenger',
      vehicle: 'Bike #07',
      plate: 'GJ-01-QQ-7891',
      confidence: 92.3,
      time: '10:15:02',
      location: 'Main Toll Gate Cam 01',
      status: 'Detected',
    },
    {
      title: 'Triple Riding & No Helmet',
      vehicle: 'Bike #12',
      plate: 'AP-10-TR-6543',
      confidence: 88.1,
      time: '09:58:30',
      location: 'Central Junction Cam 05',
      status: 'Reviewed',
    },
  ];

  return (
    <div className="space-y-7">
      {/* Top Banner: Co-DETR Swin-L Vision Pipeline Ready & Action Controls */}
      <div className="neon-glass-card rounded-2xl px-5 py-3.5 border-2 border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#00E5FF]/20 border-2 border-[#00E5FF] text-[#00E5FF] shadow-neon-cyan flex-shrink-0">
            <Cpu className="w-5 h-5 drop-shadow-[0_0_6px_#00E5FF]" />
          </div>
          <div>
            <span className="font-bold text-white text-sm sm:text-base tracking-wide flex items-center gap-2">
              <span>Co-DETR Swin-L Vision Pipeline Active</span>
              <span className="w-2 h-2 rounded-full bg-[#00FF9C] animate-ping" />
            </span>
            <p className="text-xs text-slate-300 font-medium">
              Real-time telemetry streaming • 9-Class AI City Challenge detection active
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setHighlightViolation((prev) => !prev)}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 border-2 ${
              highlightViolation
                ? 'bg-[#FF3158]/30 text-[#FF3158] border-[#FF3158] shadow-neon-red scale-105'
                : 'bg-slate-900/80 text-slate-200 border-slate-700 hover:border-[#FF3158]/80 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-[#FF3158]" />
            <span>{highlightViolation ? 'VIOLATION SIMULATED' : 'SIMULATE VIOLATION TAG'}</span>
          </button>

          <button
            onClick={onNavigateToDetection}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#006CFF] to-[#1687FF] text-white font-mono font-black text-xs shadow-neon-cyan hover:opacity-90 transition-all flex items-center justify-center gap-1.5 border border-[#00E5FF]"
          >
            <span>ANALYZE VIDEO</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Statistics Grid (4 Vibrant Hero KPI Cards) */}
      <StatsCards stats={stats} />

      {/* Main Center Grid: 3D Visualization Hero (2 cols) + Live Detection Panel (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Large 3D Scene Viewport (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00E5FF] animate-pulse drop-shadow-[0_0_8px_#00E5FF]" />
              <h2 className="font-tech text-lg font-bold uppercase tracking-wider text-white text-glow-cyan">
                Interactive 3D Traffic Sensor View
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#00FF9C] hidden sm:inline bg-[#00FF9C]/15 px-2.5 py-1 rounded-md border border-[#00FF9C]/40">
              ● REALTIME 3D DIGITAL TWIN
            </span>
          </div>
          <div className="flex-1 w-full min-h-[460px] lg:min-h-[560px]">
            <Scene highlightViolation={highlightViolation} />
          </div>
        </div>

        {/* Live Detection & Focus Panel (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="font-tech text-lg font-bold uppercase tracking-wider text-white text-glow-cyan">
              Active Stream Telemetry
            </h2>
            <span className="text-xs font-mono text-[#00E5FF] font-bold">
              NODE REST API
            </span>
          </div>
          <div className="flex-1">
            <LiveDetectionPanel data={live} />
          </div>
        </div>
      </div>

      {/* Traffic Flow Chart (Last 1 Hour) */}
      <TrafficFlowChart />

      {/* Recent Infractions: High-Impact Visual Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#FF3158] drop-shadow-[0_0_8px_#FF3158]" />
            <h2 className="font-tech text-lg font-bold tracking-wider text-white uppercase text-glow-red">
              RECENT INFRACTIONS
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            AUTO-FLAGGED BY CO-DETR
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlightInfractions.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-5 bg-gradient-to-br from-[#290815]/95 via-[#1A050D]/90 to-[#0F0307]/95 border-2 border-[#FF3158] shadow-neon-red hover:shadow-neon-red-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
            >
              {/* Red ambient corner glow */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#FF3158]/20 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#FF3158] text-glow-red uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  {item.title}
                </span>
                <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-[#FF3158] text-white shadow-neon-red">
                  {item.confidence}% CONF
                </span>
              </div>

              <div className="text-xl font-black font-tech text-white mb-1">
                {item.vehicle} <span className="text-sm font-mono font-normal text-slate-300">({item.plate})</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 font-mono mt-3 pt-3 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#00E5FF]" />
                  {item.time}
                </span>
                <span className="flex items-center gap-1 text-[#00E5FF]">
                  <Camera className="w-3.5 h-3.5" />
                  {item.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Recent Violations Audit Log Table */}
      <div className="neon-glass-panel rounded-2xl p-6 border-2 border-[#00E5FF]/25 shadow-[0_0_25px_rgba(0,229,255,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-[#00E5FF]/20">
          <div>
            <h2 className="font-tech text-xl font-bold tracking-wider text-white uppercase text-glow-cyan">
              Full Traffic Violations Audit Log
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Live automated surveillance detections with license plates and enforcement status
            </p>
          </div>
          <button
            onClick={onNavigateToViolations}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#00E5FF] hover:text-[#00FF9C] transition-colors self-start sm:self-auto bg-[#00E5FF]/10 px-3 py-1.5 rounded-lg border border-[#00E5FF]/40 shadow-neon-cyan"
          >
            <span>VIEW ALL VIOLATIONS</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <ViolationsTable violations={violations.slice(0, 5)} compact={true} />
      </div>
    </div>
  );
};
