import React from 'react';
import { ShieldCheck, Activity, Wifi, Radio } from 'lucide-react';

interface HeaderProps {
  backendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected = true }) => {
  return (
    <header className="w-full border-b border-cyan-500/20 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 shadow-neon-cyan">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 font-tech">
                SMART HELMET AI
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hidden md:inline-block">
                v1.0-VISION
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal tracking-wide hidden sm:block">
              AI-Powered Motorcycle Safety & Violation Detection
            </p>
          </div>
        </div>

        {/* Live System Status Indicator */}
        <div className="flex items-center gap-3">
          {/* AI Pipeline Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">PIPELINE:</span>
            <span className="text-cyan-300 font-semibold">CO-DETR SWIN-L</span>
          </div>

          {/* System Online Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-sm shadow-cyan-500/10">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold tracking-wider">SYSTEM ONLINE</span>
          </div>

          {/* Backend Connection status */}
          <div
            title={backendConnected ? 'Backend Connected' : 'Running in Offline / Mock Mode'}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
          >
            {backendConnected ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <Activity className="w-4 h-4 text-amber-400" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
