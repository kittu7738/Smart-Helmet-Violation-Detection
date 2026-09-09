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

  // 3 Primary Curated Recent Infractions
  const highlightInfractions = [
    {
      title: 'NO HELMET — DRIVER',
      vehicle: 'Bike #03',
      plate: 'MH-04-AB-2041',
      confidence: 94.7,
      time: '10:42:18 AM',
      location: 'North Intersection Cam 02',
      status: 'Flagged',
      speed: '48 km/h',
    },
    {
      title: 'NO HELMET — PASSENGER',
      vehicle: 'Bike #07',
      plate: 'GJ-01-QQ-7891',
      confidence: 92.3,
      time: '10:15:02 AM',
      location: 'Main Toll Gate Cam 01',
      status: 'Logged',
      speed: '52 km/h',
    },
    {
      title: 'TRIPLE RIDING',
      vehicle: 'Bike #12',
      plate: 'AP-10-TR-6543',
      confidence: 88.1,
      time: '09:58:30 AM',
      location: 'Central Junction Cam 05',
      status: 'Reviewed',
      speed: '34 km/h',
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner: Co-DETR Vision Model & Actions */}
      <div className="rounded-xl px-5 py-3.5 bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex-shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="font-tech text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Co-DETR Vision Model Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400">
              Real-time telemetry streaming • 9-Class AI City Challenge detection pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setHighlightViolation((prev) => !prev)}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg font-mono text-xs font-medium transition-colors flex items-center justify-center gap-2 border ${
              highlightViolation
                ? 'bg-red-500/20 text-red-400 border-red-500/40 font-semibold'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>{highlightViolation ? 'Violation Simulated' : 'Simulate Violation'}</span>
          </button>

          <button
            onClick={onNavigateToDetection}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Video className="w-4 h-4" />
            <span>Analyze Video</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Statistics Grid: 4 Clean KPI Cards */}
      <StatsCards stats={stats} />

      {/* Main Center Grid: 3D Visualization Hero (8 cols) + Live Detection (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 3D Hero Viewport */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-tech text-base sm:text-lg font-bold uppercase tracking-wide text-white">
              3D Vehicle & Rider Visualization
            </h2>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Interactive View
            </span>
          </div>

          <div className="flex-1 w-full min-h-[480px] sm:min-h-[540px] lg:min-h-[600px]">
            <Scene highlightViolation={highlightViolation} />
          </div>
        </div>

        {/* Live Detection Panel */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-tech text-base sm:text-lg font-bold uppercase tracking-wide text-white">
              Stream Telemetry
            </h2>
            <span className="text-xs font-mono text-slate-400">Live Feed</span>
          </div>
          <div className="flex-1">
            <LiveDetectionPanel data={live} />
          </div>
        </div>
      </div>

      {/* Traffic Flow Chart */}
      <TrafficFlowChart />

      {/* Recent Infractions: 3 Clean Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="font-tech text-base sm:text-lg font-bold tracking-wide text-white uppercase">
              Recent Infractions
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Auto-detected by AI
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlightInfractions.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl p-4 sm:p-5 bg-slate-900/80 border border-slate-800 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-mono font-semibold text-red-400 uppercase">
                    {item.title}
                  </span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    {item.confidence}% Conf.
                  </span>
                </div>

                <div className="text-lg font-bold font-tech text-white mb-1">
                  {item.vehicle}{' '}
                  <span className="text-xs font-mono font-normal text-slate-400">
                    ({item.plate})
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-mono mt-2 flex items-center justify-between">
                  <span>Speed: {item.speed}</span>
                  <span className="text-amber-400/90">{item.status}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-3 pt-2.5 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {item.time}
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <Camera className="w-3.5 h-3.5" />
                  {item.location.split(' ')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Recent Violations Audit Log Table */}
      <div className="rounded-xl p-5 sm:p-6 bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-tech text-lg sm:text-xl font-bold tracking-wide text-white uppercase">
              Recent Violations Log
            </h2>
            <p className="text-xs text-slate-400">
              Automated detections logged with license plates and enforcement review status
            </p>
          </div>
          <button
            onClick={onNavigateToViolations}
            className="flex items-center gap-1.5 text-xs font-mono font-medium text-sky-400 hover:text-sky-300 transition-colors self-start sm:self-auto bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View All Violations</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <ViolationsTable violations={violations.slice(0, 5)} compact={true} />
      </div>
    </div>
  );
};
