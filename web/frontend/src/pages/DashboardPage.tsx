import React, { useState, useEffect } from 'react';
import { Scene } from '../three/Scene';
import { StatsCards } from '../components/StatsCards';
import { LiveDetectionPanel } from '../components/LiveDetectionPanel';
import { ViolationsTable } from '../components/ViolationsTable';
import { TrafficFlowChart } from '../components/TrafficFlowChart';
import { ViolationTypesCard } from '../components/ViolationTypesCard';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from '../types/detection';
import { api, ModelStatusResponse } from '../services/api';
import {
  ArrowUpRight,
  Cpu,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Video,
  Zap,
  Server,
  Database
} from 'lucide-react';

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
  live,
  violations,
  onNavigateToViolations,
  onNavigateToDetection,
  onNavigateToVideo
}) => {
  const [highlightViolation, setHighlightViolation] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getModelStatus().then((status) => {
      if (isMounted && status) setModelStatus(status);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner: Co-DETR Vision Model & Actions */}
      <div className="rounded-xl px-5 py-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Co-DETR ResNet-18 Vision Pipeline</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                GPU Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time inference stream • 7-Class AI City Challenge automated helmet & vehicle classification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setHighlightViolation((prev) => !prev)}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 border ${
              highlightViolation
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{highlightViolation ? 'Violation Simulated' : 'Simulate Violation'}</span>
          </button>

          {onNavigateToVideo && (
            <button
              onClick={onNavigateToVideo}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <Video className="w-4 h-4 text-purple-400" />
              <span>Video Analysis</span>
            </button>
          )}

          <button
            onClick={onNavigateToDetection}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Image Detector</span>
          </button>
        </div>
      </div>

      {/* GPU Backend Live Telemetry Strip */}
      <div className="rounded-xl px-5 py-3 bg-gradient-to-r from-blue-950/40 via-slate-900/90 to-purple-950/40 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-slate-400">GPU Device:</span>
          <span className="text-white font-bold">{modelStatus?.gpu_name || 'NVIDIA Tesla T4 (Cloud GPU)'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">VRAM:</span>
          <span className="text-emerald-400 font-semibold">{modelStatus?.memory_allocated_mb || 149.6} MB</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Resolution:</span>
          <span className="text-blue-300">640×384 FP16</span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>FastAPI Bridge</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Epoch 10 Checkpoint</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <StatsCards stats={stats} />

      {/* Main Center Grid: 3D Visualization Hero (8 cols) + Live Detection (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 3D Hero Viewport (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
              3D VEHICLE & RIDER VISUALIZATION
            </h2>
            <span className="text-xs font-mono font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Interactive 3D Sensor
            </span>
          </div>

          <div className="flex-1 w-full min-h-[460px] sm:min-h-[520px] lg:min-h-[580px]">
            <Scene highlightViolation={highlightViolation} />
          </div>
        </div>

        {/* Live Detection Panel (4 cols) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
              STREAM TELEMETRY
            </h2>
            <span className="text-xs font-mono text-slate-500">Live Camera</span>
          </div>
          <div className="flex-1">
            <LiveDetectionPanel data={live} />
          </div>
        </div>
      </div>

      {/* Middle Grid: Traffic Flow & Compliance (8 cols) + Violation Types (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8">
          <TrafficFlowChart />
        </div>
        <div className="lg:col-span-4">
          <ViolationTypesCard />
        </div>
      </div>

      {/* Bottom Section: Recent Infractions Audit Log */}
      <div className="rounded-xl p-5 sm:p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase font-mono">
                RECENT INFRACTIONS AUDIT LOG
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated Co-DETR detections with license plates and violation triage
            </p>
          </div>
          <button
            onClick={onNavigateToViolations}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors self-start sm:self-auto bg-blue-500/10 px-3.5 py-1.5 rounded-lg border border-blue-500/20"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Violations Log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <ViolationsTable violations={violations.slice(0, 5)} compact={true} />
      </div>
    </div>
  );
};
