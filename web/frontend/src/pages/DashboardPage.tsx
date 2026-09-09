import React, { useState } from 'react';
import { Scene } from '../three/Scene';
import { StatsCards } from '../components/StatsCards';
import { LiveDetectionPanel } from '../components/LiveDetectionPanel';
import { ViolationsTable } from '../components/ViolationsTable';
import { TrafficFlowChart } from '../components/TrafficFlowChart';
import { ViolationTypesCard } from '../components/ViolationTypesCard';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from '../types/detection';
import {
  ArrowUpRight,
  Cpu,
  ShieldAlert,
  AlertTriangle,
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

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner: Co-DETR Vision Model & Actions */}
      <div className="rounded-xl px-5 py-3.5 bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Co-DETR Swin-L Vision Pipeline</span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real-time inference stream • 9-Class AI City Challenge automated helmet & vehicle classification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setHighlightViolation((prev) => !prev)}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 border ${
              highlightViolation
                ? 'bg-red-50 text-red-700 border-red-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>{highlightViolation ? 'Violation Simulated' : 'Simulate Violation'}</span>
          </button>

          <button
            onClick={onNavigateToDetection}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Video className="w-4 h-4" />
            <span>Upload & Analyze Video</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Clean White Cards Across Top) */}
      <StatsCards stats={stats} />

      {/* Main Center Grid: 3D Visualization Hero (8 cols) + Live Detection (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 3D Hero Viewport (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-900">
              3D VEHICLE & RIDER VISUALIZATION
            </h2>
            <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
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
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-900">
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
      <div className="rounded-xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase">
                RECENT INFRACTIONS AUDIT LOG
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated computer-vision detections with license plates and review triage
            </p>
          </div>
          <button
            onClick={onNavigateToViolations}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors self-start sm:self-auto bg-blue-50 px-3.5 py-1.5 rounded-lg border border-blue-200"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Full Database</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <ViolationsTable violations={violations.slice(0, 5)} compact={true} />
      </div>
    </div>
  );
};
