import React from 'react';
import { Radio, AlertTriangle, ShieldCheck, Bike, UserCheck, UserX, Target } from 'lucide-react';
import { LiveDetectionSummary } from '../types/detection';

interface LiveDetectionPanelProps {
  data: LiveDetectionSummary;
}

export const LiveDetectionPanel: React.FC<LiveDetectionPanelProps> = ({ data }) => {
  const current = data.currentDetection;

  return (
    <div className="neon-glass-panel rounded-2xl p-5 sm:p-6 border-2 border-[#00E5FF]/35 shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col justify-between h-full relative overflow-hidden">
      {/* Background flare */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#00E5FF]/10 blur-2xl pointer-events-none" />

      <div>
        {/* Header with Bright Glowing Live Beacon */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#00E5FF]/20">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-[#00E5FF] animate-pulse drop-shadow-[0_0_8px_#00E5FF]" />
            <h3 className="font-tech text-lg font-bold tracking-wider text-white uppercase text-glow-cyan">
              LIVE DETECTION
            </h3>
          </div>
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF9C]/20 border border-[#00FF9C] text-xs font-mono text-[#00FF9C] shadow-neon-green font-bold">
            <span className="w-2 h-2 rounded-full bg-[#00FF9C] animate-ping" />
            LIVE FEED
          </span>
        </div>

        {/* 5 Distinct Neon Color-Coded Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {/* 1. Motorcycles: Cyan */}
          <div className="bg-[#07132B]/80 border-2 border-[#00E5FF]/60 rounded-xl p-3 shadow-[0_0_15px_rgba(0,229,255,0.25)] hover:border-[#00E5FF] transition-all">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium mb-1">
              <span className="flex items-center gap-1.5"><Bike className="w-4 h-4 text-[#00E5FF]" /> Motorcycles</span>
            </div>
            <div className="text-2xl font-black font-tech text-[#00E5FF] text-glow-cyan">
              {String(data.motorcycles).padStart(2, '0')}
            </div>
          </div>

          {/* 2. Riders: Bright Blue */}
          <div className="bg-[#07132B]/80 border-2 border-[#1687FF]/60 rounded-xl p-3 shadow-[0_0_15px_rgba(22,135,255,0.25)] hover:border-[#1687FF] transition-all">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium mb-1">
              <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-[#1687FF]" /> Riders</span>
            </div>
            <div className="text-2xl font-black font-tech text-[#1687FF] drop-shadow-[0_0_8px_#1687FF]">
              {String(data.riders).padStart(2, '0')}
            </div>
          </div>

          {/* 3. Helmeted: Neon Green */}
          <div className="bg-[#071F15]/80 border-2 border-[#00FF9C]/60 rounded-xl p-3 shadow-[0_0_15px_rgba(0,255,156,0.25)] hover:border-[#00FF9C] transition-all">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium mb-1">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#00FF9C]" /> Helmeted</span>
            </div>
            <div className="text-2xl font-black font-tech text-[#00FF9C] text-glow-green">
              {String(data.helmeted).padStart(2, '0')}
            </div>
          </div>

          {/* 4. No Helmet: Neon Amber */}
          <div className="bg-[#241B06]/80 border-2 border-[#FFD400]/60 rounded-xl p-3 shadow-[0_0_15px_rgba(255,212,0,0.25)] hover:border-[#FFD400] transition-all">
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium mb-1">
              <span className="flex items-center gap-1.5"><UserX className="w-4 h-4 text-[#FFD400]" /> No Helmet</span>
            </div>
            <div className="text-2xl font-black font-tech text-[#FFD400] drop-shadow-[0_0_8px_#FFD400]">
              {String(data.noHelmet).padStart(2, '0')}
            </div>
          </div>

          {/* 5. Violations: Bright Red */}
          <div className="col-span-2 sm:col-span-2 bg-[#2E0713]/90 border-2 border-[#FF3158] rounded-xl p-3 shadow-neon-red hover:shadow-neon-red-lg transition-all">
            <div className="flex items-center justify-between text-[#FF3158] text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#FF3158] animate-pulse" /> Active Violations
              </span>
              <span className="text-[10px] font-mono uppercase bg-[#FF3158]/20 px-1.5 py-0.5 rounded border border-[#FF3158]/50">
                CRITICAL
              </span>
            </div>
            <div className="text-2xl font-black font-tech text-[#FF3158] text-glow-red">
              {String(data.violations).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* High-Impact Current Detection Focus Card */}
        <div className="rounded-xl p-4 bg-gradient-to-b from-[#1C0913]/95 to-[#0F050B]/95 border-2 border-[#FF3158] shadow-neon-red relative overflow-hidden">
          {/* Animated red glow sweep */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF3158]/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              <Target className="w-4 h-4 text-[#FF3158]" />
              <span>CURRENT DETECTION FOCUS</span>
            </div>
            <span className="text-xs font-mono font-black px-2.5 py-1 rounded-md bg-[#FF3158]/25 border border-[#FF3158] text-[#FF3158] shadow-[0_0_10px_#FF3158]">
              {current.motorcycleId}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Rider Role</span>
              <span className="text-white font-bold bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                {current.riderType}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Helmet Status</span>
              <span
                className={`font-black px-2.5 py-0.5 rounded text-xs border ${
                  current.helmetStatus === 'HELMET'
                    ? 'bg-[#00FF9C]/20 text-[#00FF9C] border-[#00FF9C] shadow-neon-green'
                    : 'bg-[#FF3158]/25 text-[#FF3158] border-[#FF3158] shadow-neon-red animate-pulse'
                }`}
              >
                {current.helmetStatus === 'HELMET' ? 'HELMET COMPLIANT' : 'NO HELMET'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Confidence</span>
              <span className="text-[#00E5FF] font-black text-sm text-glow-cyan">{current.confidence}%</span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400">Violation Triggered</span>
              <span
                className={`font-black flex items-center gap-1.5 text-xs ${
                  current.violation
                    ? 'text-[#FF3158] text-glow-red animate-pulse'
                    : 'text-[#00FF9C] text-glow-green'
                }`}
              >
                {current.violation && <AlertTriangle className="w-4 h-4 text-[#FF3158]" />}
                {current.violation ? 'YES (CHALAN QUEUED)' : 'NO'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#00E5FF]/20 text-xs text-slate-400 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1 text-[#00E5FF] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
          CAM-02 NORTH JUNCTION
        </span>
        <span className="text-[#00FF9C] font-bold">34ms LATENCY</span>
      </div>
    </div>
  );
};
