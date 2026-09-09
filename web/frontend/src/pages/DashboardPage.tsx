import React, { useState } from 'react';
import { Scene } from '../three/Scene';
import { StatsCards } from '../components/StatsCards';
import { LiveDetectionPanel } from '../components/LiveDetectionPanel';
import { ViolationsTable } from '../components/ViolationsTable';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from '../types/detection';
import { ArrowUpRight, Cpu, ShieldAlert, Sparkles } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Top Notification Banner / Live AI Pipeline Status */}
      <div className="glass-card rounded-xl px-4 py-3 border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-200">
              Co-DETR Swin-L Vision Pipeline Ready
            </span>
            <span className="text-slate-400 ml-1.5 hidden md:inline">
              Mock telemetry stream connected • Video frame analysis active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setHighlightViolation((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all flex items-center gap-1.5 ${
              highlightViolation
                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/50 shadow-neon-red'
                : 'bg-slate-900/60 text-slate-300 border border-slate-700 hover:border-cyan-500/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Simulate Violation Tag</span>
          </button>

          <button
            onClick={onNavigateToDetection}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all font-mono flex items-center gap-1"
          >
            <span>Analyze Video</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <StatsCards stats={stats} />

      {/* Main Center Grid: 3D Visualization + Live Detection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large 3D Scene Viewport */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="font-tech text-base font-semibold uppercase tracking-wider text-slate-200">
                Interactive 3D Traffic Sensor View
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              LIVE DIGITAL TWIN
            </span>
          </div>
          <div className="flex-1 w-full min-h-[400px]">
            <Scene highlightViolation={highlightViolation} />
          </div>
        </div>

        {/* Live Detection Panel */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-tech text-base font-semibold uppercase tracking-wider text-slate-200">
              Active Stream Analytics
            </h2>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PORT 5001
            </span>
          </div>
          <div className="flex-1">
            <LiveDetectionPanel data={live} />
          </div>
        </div>
      </div>

      {/* Recent Violations & Quick Summary Feed */}
      <div className="glass-panel rounded-xl p-5 border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-tech text-lg font-semibold tracking-wider text-slate-100 uppercase">
              Recent Traffic Violations
            </h2>
            <p className="text-xs text-slate-400">
              Live automated detection logs from city surveillance nodes
            </p>
          </div>
          <button
            onClick={onNavigateToViolations}
            className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            <span>View All Records</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <ViolationsTable violations={violations.slice(0, 5)} compact={true} />
      </div>
    </div>
  );
};
