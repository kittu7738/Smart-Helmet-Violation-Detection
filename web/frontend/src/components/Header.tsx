import React from 'react';
import { ShieldCheck, Radio, Wifi } from 'lucide-react';

interface HeaderProps {
  backendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected = true }) => {
  return (
    <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm transition-all">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Brand & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white shadow-sm flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                SMART HELMET AI
              </h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-block">
                Research Project
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Motorcycle Safety & Automated Violation Detection
            </p>
          </div>
        </div>

        {/* Right: Clean Status Indicators */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Pipeline Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-400">Pipeline:</span>
            <span className="text-slate-700 font-semibold">Co-DETR Swin-L</span>
          </div>

          {/* System Online Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-xs font-medium text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
            <span>System Online</span>
          </div>

          {/* API Connection */}
          <div
            title={backendConnected ? 'Backend Connected' : 'Mock Mode Active'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              backendConnected
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
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
