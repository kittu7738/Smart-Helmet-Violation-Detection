import React from 'react';
import { Radio, AlertTriangle, ShieldCheck, Bike, UserCheck, UserX } from 'lucide-react';
import { LiveDetectionSummary } from '../types/detection';

interface LiveDetectionPanelProps {
  data: LiveDetectionSummary;
}

export const LiveDetectionPanel: React.FC<LiveDetectionPanelProps> = ({ data }) => {
  const current = data.currentDetection;

  return (
    <div className="glass-panel rounded-xl p-5 border border-cyan-500/20 shadow-xl flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="font-tech text-base font-semibold tracking-wider text-slate-100 uppercase">
              LIVE DETECTION
            </h3>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            ACTIVE FEED
          </span>
        </div>

        {/* Live Counters Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1"><Bike className="w-3.5 h-3.5 text-blue-400" /> Motorcycles</span>
            </div>
            <div className="text-xl font-bold font-tech text-cyan-300">
              {String(data.motorcycles).padStart(2, '0')}
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Riders</span>
            </div>
            <div className="text-xl font-bold font-tech text-slate-100">
              {String(data.riders).padStart(2, '0')}
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Helmeted</span>
            </div>
            <div className="text-xl font-bold font-tech text-emerald-400">
              {String(data.helmeted).padStart(2, '0')}
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1"><UserX className="w-3.5 h-3.5 text-amber-400" /> No Helmet</span>
            </div>
            <div className="text-xl font-bold font-tech text-amber-400">
              {String(data.noHelmet).padStart(2, '0')}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-2 bg-rose-950/20 border border-rose-500/30 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-rose-300 text-xs mb-1">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Violations Detected
              </span>
            </div>
            <div className="text-xl font-bold font-tech text-rose-400">
              {String(data.violations).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Current Active Target Inspection Box */}
        <div className="rounded-lg p-4 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              CURRENT DETECTION FOCUS
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              {current.motorcycleId}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Rider Role</span>
              <span className="text-slate-200 font-semibold">{current.riderType}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Helmet Status</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  current.helmetStatus === 'HELMET'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950/60 text-rose-300 border border-rose-500/40 animate-pulse'
                }`}
              >
                {current.helmetStatus === 'HELMET' ? 'HELMET COMPLIANT' : 'NO HELMET'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Confidence</span>
              <span className="text-cyan-300 font-semibold">{current.confidence}%</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Violation Triggered</span>
              <span
                className={`font-bold ${
                  current.violation ? 'text-rose-400 flex items-center gap-1' : 'text-emerald-400'
                }`}
              >
                {current.violation && <AlertTriangle className="w-3.5 h-3.5" />}
                {current.violation ? 'YES (CHALAN QUEUED)' : 'NO'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>SENSOR: CO-DETR CAM-02</span>
        <span>LATENCY: 34ms</span>
      </div>
    </div>
  );
};
