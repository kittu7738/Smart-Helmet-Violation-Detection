import React, { useEffect, useState } from 'react';
import { ShieldCheck, Cpu, Wifi, Activity } from 'lucide-react';
import { api, ModelStatusResponse } from '../services/api';

interface HeaderProps {
  backendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected = true }) => {
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      const status = await api.getModelStatus();
      if (isMounted && status) {
        setModelStatus(status);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 shadow-xl transition-all">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Brand & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SMART HELMET AI
              </h1>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 hidden sm:inline-block">
                IIITVICD AI City Challenge
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Motorcycle Safety & Automated Helmet Violation Detection System
            </p>
          </div>
        </div>

        {/* Right: Clean Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Architecture / Pipeline Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 shadow-inner">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-500">Core:</span>
            <span className="text-blue-300 font-semibold">Co-DETR ResNet-18</span>
            <span className="text-[10px] text-slate-500">FP16</span>
          </div>

          {/* GPU Hardware Badge */}
          {modelStatus?.gpu_name && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-purple-300">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>{modelStatus.gpu_name}</span>
            </div>
          )}

          {/* System Online Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg status-pill-online text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            <span className="font-semibold text-emerald-300">
              {backendConnected ? 'Inference Online' : 'Standby'}
            </span>
          </div>

          {/* API Connection Indicator */}
          <div
            title={backendConnected ? 'FastAPI GPU Tunnel Connected' : 'Backend Standby'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              backendConnected
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px]">
              {backendConnected ? 'GPU Tunnel' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
