import React from 'react';
import { ShieldCheck, Radio, Wifi } from 'lucide-react';

interface HeaderProps {
  backendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected = true }) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-tech">
                Smart Helmet AI
              </h1>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline-block">
                Research Demo
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Motorcycle Safety & Automated Violation Detection
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {/* Pipeline Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-500">Pipeline:</span>
            <span className="text-sky-400 font-medium">Co-DETR Swin-L</span>
          </div>

          {/* System Online Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">System Online</span>
          </div>

          {/* Backend Status */}
          <div
            title={backendConnected ? 'Backend Connected' : 'Running in Offline / Mock Mode'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              backendConnected
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {backendConnected ? 'API Connected' : 'Mock Mode'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
