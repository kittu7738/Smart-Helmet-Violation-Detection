import React from 'react';
import { ShieldCheck, Wifi, Radio, Zap } from 'lucide-react';

interface HeaderProps {
  backendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected = true }) => {
  return (
    <header className="w-full border-b border-[#00E5FF]/30 bg-[#060B19]/90 backdrop-blur-2xl sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,229,255,0.15)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#00E5FF]/30 via-[#1687FF]/25 to-[#00FF9C]/20 border-2 border-[#00E5FF] shadow-neon-cyan flex-shrink-0">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#00E5FF] drop-shadow-[0_0_8px_#00E5FF]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#00FF9C] rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#00FF9C] rounded-full shadow-[0_0_8px_#00FF9C]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#00FF9C] to-[#1687FF] font-tech text-glow-cyan">
                SMART HELMET AI
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-[#00E5FF]/15 border border-[#00E5FF]/60 text-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.3)] hidden sm:inline-block">
                V1.0-VISION
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium tracking-wide hidden sm:block">
              AI-Powered Motorcycle Safety & Violation Detection
            </p>
          </div>
        </div>

        {/* Live System Status Indicator */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
          {/* AI Pipeline Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0A1226] border border-[#00E5FF]/40 text-xs font-mono shadow-[0_0_12px_rgba(0,229,255,0.15)]">
            <Radio className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse drop-shadow-[0_0_6px_#00E5FF]" />
            <span className="text-slate-400 font-medium">PIPELINE:</span>
            <span className="text-[#00E5FF] font-bold tracking-wide text-glow-cyan">CO-DETR SWIN-L</span>
          </div>

          {/* System Online Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00FF9C]/15 border-2 border-[#00FF9C] text-xs font-mono text-[#00FF9C] shadow-neon-green whitespace-nowrap">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF9C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF9C] shadow-[0_0_8px_#00FF9C]"></span>
            </span>
            <span className="font-bold tracking-wider text-glow-green">
              <span className="hidden sm:inline">SYSTEM </span>ONLINE
            </span>
          </div>

          {/* Backend Connection status */}
          <div
            title={backendConnected ? 'Backend Connected' : 'Running in Offline / Mock Mode'}
            className={`flex items-center justify-center p-2 rounded-lg border text-xs shadow-md transition-all ${
              backendConnected
                ? 'bg-[#00E5FF]/15 border-[#00E5FF]/60 text-[#00E5FF] shadow-neon-cyan'
                : 'bg-[#FFD400]/15 border-[#FFD400]/60 text-[#FFD400] shadow-neon-amber'
            }`}
          >
            {backendConnected ? (
              <Wifi className="w-4 h-4 drop-shadow-[0_0_6px_#00E5FF]" />
            ) : (
              <Zap className="w-4 h-4 animate-bounce drop-shadow-[0_0_6px_#FFD400]" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
