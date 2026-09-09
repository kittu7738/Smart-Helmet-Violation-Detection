import React from 'react';
import { Radio, AlertTriangle, ShieldCheck, Bike, UserCheck, UserX, Target } from 'lucide-react';
import { LiveDetectionSummary } from '../types/detection';

interface LiveDetectionPanelProps {
  data: LiveDetectionSummary;
}

export const LiveDetectionPanel: React.FC<LiveDetectionPanelProps> = ({ data }) => {
  const current = data.currentDetection;

  return (
    <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold tracking-tight text-slate-900 uppercase">
              LIVE DETECTION
            </h3>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 text-xs font-medium text-green-700 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
            Live Stream
          </span>
        </div>

        {/* 5 Clean Statistics Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          {/* Motorcycles: Cyan */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
              <Bike className="w-3.5 h-3.5 text-sky-600" />
              <span>Motorcycles</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {String(data.motorcycles).padStart(2, '0')}
            </div>
          </div>

          {/* Riders: Blue */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Riders</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {String(data.riders).padStart(2, '0')}
            </div>
          </div>

          {/* Helmeted: Green */}
          <div className="bg-green-50/50 border border-green-200 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-green-700 text-xs mb-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <span>Helmeted</span>
            </div>
            <div className="text-2xl font-bold text-green-700 font-mono">
              {String(data.helmeted).padStart(2, '0')}
            </div>
          </div>

          {/* No Helmet: Amber */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-amber-700 text-xs mb-1 font-medium">
              <UserX className="w-3.5 h-3.5 text-amber-600" />
              <span>No Helmet</span>
            </div>
            <div className="text-2xl font-bold text-amber-700 font-mono">
              {String(data.noHelmet).padStart(2, '0')}
            </div>
          </div>

          {/* Violations: Red */}
          <div className="col-span-2 sm:col-span-2 bg-red-50/60 border border-red-200 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-red-700 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>Violations</span>
              </span>
              <span className="text-[10px] font-mono font-bold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                Flagged
              </span>
            </div>
            <div className="text-2xl font-bold text-red-600 font-mono">
              {String(data.violations).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Current Target Focus Card */}
        <div className="rounded-lg p-4 bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>CURRENT TARGET</span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              {current.motorcycleId}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500">Rider Role</span>
              <span className="text-slate-900 font-semibold">{current.riderType}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500">Helmet Status</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  current.helmetStatus === 'HELMET'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}
              >
                {current.helmetStatus === 'HELMET' ? 'Helmet Compliant' : 'No Helmet'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500">Confidence</span>
              <span className="text-blue-600 font-bold font-mono">{current.confidence}%</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Violation</span>
              <span
                className={`font-semibold ${
                  current.violation ? 'text-red-600 font-bold' : 'text-green-600'
                }`}
              >
                {current.violation ? 'Detected' : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          Camera 02 • North Intersection
        </span>
        <span className="font-mono text-slate-400">34ms</span>
      </div>
    </div>
  );
};
