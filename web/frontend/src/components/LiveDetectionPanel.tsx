import React from 'react';
import { Radio, AlertTriangle, ShieldCheck, Bike, UserCheck, UserX, Target } from 'lucide-react';
import { LiveDetectionSummary } from '../types/detection';

interface LiveDetectionPanelProps {
  data: LiveDetectionSummary;
}

export const LiveDetectionPanel: React.FC<LiveDetectionPanelProps> = ({ data }) => {
  const current = data.currentDetection;

  return (
    <div className="rounded-xl p-5 bg-slate-900/80 border border-slate-800 shadow-md flex flex-col justify-between h-full">
      <div>
        {/* Clean Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400" />
            <h3 className="font-tech text-base font-bold tracking-wide text-white uppercase">
              LIVE DETECTION
            </h3>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active Feed
          </span>
        </div>

        {/* 5 Clean Statistics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          {/* Motorcycles: Cyan */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Bike className="w-3.5 h-3.5 text-sky-400" />
              <span>Motorcycles</span>
            </div>
            <div className="text-xl font-bold font-tech text-sky-400">
              {String(data.motorcycles).padStart(2, '0')}
            </div>
          </div>

          {/* Riders: Blue */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Riders</span>
            </div>
            <div className="text-xl font-bold font-tech text-blue-400">
              {String(data.riders).padStart(2, '0')}
            </div>
          </div>

          {/* Helmeted: Green */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Helmeted</span>
            </div>
            <div className="text-xl font-bold font-tech text-emerald-400">
              {String(data.helmeted).padStart(2, '0')}
            </div>
          </div>

          {/* No Helmet: Amber */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <UserX className="w-3.5 h-3.5 text-amber-400" />
              <span>No Helmet</span>
            </div>
            <div className="text-xl font-bold font-tech text-amber-400">
              {String(data.noHelmet).padStart(2, '0')}
            </div>
          </div>

          {/* Violations: Red */}
          <div className="col-span-2 sm:col-span-2 bg-slate-950/60 border border-red-500/30 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-red-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Active Violations</span>
              </span>
              <span className="text-[10px] font-mono uppercase bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">
                Flagged
              </span>
            </div>
            <div className="text-xl font-bold font-tech text-red-400">
              {String(data.violations).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Clean Current Detection Focus Card */}
        <div className="rounded-lg p-3.5 bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-400 uppercase">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              <span>Current Target Focus</span>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
              {current.motorcycleId}
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Rider Role</span>
              <span className="text-slate-200 font-medium">
                {current.riderType}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Helmet Status</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  current.helmetStatus === 'HELMET'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {current.helmetStatus === 'HELMET' ? 'Compliant' : 'No Helmet'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Confidence</span>
              <span className="text-sky-400 font-semibold">{current.confidence}%</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Violation Flag</span>
              <span
                className={`font-semibold text-xs ${
                  current.violation ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {current.violation ? 'Infraction Logged' : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          Camera 02 (Intersection)
        </span>
        <span className="text-slate-400">34ms Latency</span>
      </div>
    </div>
  );
};
