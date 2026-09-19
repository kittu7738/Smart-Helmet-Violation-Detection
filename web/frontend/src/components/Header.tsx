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
    api.getModelStatus().then((status) => {
      if (isMounted && status) setModelStatus(status);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs transition-all">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Brand & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900">
                SMART HELMET AI
              </h1>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-block">
                Computer Vision Platform
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Automated Motorcycle Helmet Violation Detection
            </p>
          </div>
        </div>

        {/* Right: Clean Status Indicators */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Architecture Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono text-gray-600">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-gray-400">Model:</span>
            <span className="text-gray-800 font-semibold">Co-DETR ResNet-18</span>
            <span className="text-[10px] text-gray-400">FP16</span>
          </div>

          {/* GPU Hardware Badge */}
          {modelStatus?.gpu_name && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-xs font-mono text-purple-700">
              <Activity className="w-3.5 h-3.5 text-purple-600" />
              <span>{modelStatus.gpu_name}</span>
            </div>
          )}

          {/* System Online Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg badge-compliant text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-800">
              {backendConnected ? 'Inference Online' : 'Standby'}
            </span>
          </div>

          {/* API Connection Indicator */}
          <div
            title={backendConnected ? 'GPU Tunnel Connected' : 'API Standby'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              backendConnected
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px]">
              {backendConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
