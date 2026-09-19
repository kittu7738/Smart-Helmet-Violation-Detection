import React from 'react';
import { Radio, AlertTriangle, ShieldCheck, Bike, UserCheck, UserX, Target } from 'lucide-react';
import { LiveDetectionSummary } from '../types/detection';

interface LiveDetectionPanelProps {
  data: LiveDetectionSummary;
}

export const LiveDetectionPanel: React.FC<LiveDetectionPanelProps> = ({ data }) => {
  const current = data.currentDetection;

  return (
    <div className="rounded-xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-lg flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold tracking-wider text-white uppercase font-mono">
              STREAM TELEMETRY
            </h3>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full status-pill-online text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Feed
          </span>
        </div>

        {/* Statistics Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          {/* Motorcycles */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Bike className="w-3.5 h-3.5 text-sky-400" />
              <span>Bikes</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {String(data.motorcycles).padStart(2, '0')}
            </div>
          </div>

          {/* Riders */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Riders</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {String(data.riders).padStart(2, '0')}
            </div>
          </div>

          {/* Helmeted */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs mb-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Helmeted</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {String(data.helmeted).padStart(2, '0')}
            </div>
          </div>

          {/* No Helmet */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-1 font-medium">
              <UserX className="w-3.5 h-3.5 text-amber-400" />
              <span>No Helmet</span>
            </div>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {String(data.noHelmet).padStart(2, '0')}
            </div>
          </div>

          {/* Violations */}
          <div className="col-span-2 bg-rose-950/20 border border-rose-500/30 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Violations</span>
              </span>
              <span className="text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                Flagged
              </span>
            </div>
            <div className="text-xl font-bold text-rose-400 font-mono">
              {String(data.violations).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Current Target Focus Card */}
        <div className="rounded-lg p-3.5 bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase font-mono">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span>TARGET LOCK</span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {current.motorcycleId}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Rider Role</span>
              <span className="text-white font-medium">{current.riderType}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Helmet Status</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] font-mono ${
                  current.helmetStatus === 'HELMET'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {current.helmetStatus === 'HELMET' ? 'Helmet Compliant' : 'Violation Detected'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Confidence</span>
              <span className="text-blue-400 font-bold font-mono">{current.confidence}%</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Triage Action</span>
              <span
                className={`font-semibold ${
                  current.violation ? 'text-rose-400 font-bold' : 'text-emerald-400'
                }`}
              >
                {current.violation ? 'Plate Recorded' : 'Verified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          Camera 01 • Main Junction
        </span>
        <span className="font-mono text-slate-500 text-[11px]">~100ms latency</span>
      </div>
    </div>
  );
};
