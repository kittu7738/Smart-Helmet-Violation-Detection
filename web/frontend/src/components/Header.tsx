import React, { useEffect, useState } from 'react';
import { Shield, Cpu, Wifi, Settings, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api, ModelStatusResponse } from '../services/api';

interface HeaderProps {
  backendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected = true }) => {
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(api.getBaseUrl());
  const [testingStatus, setTestingStatus] = useState<{ testing: boolean; message?: string; isError?: boolean } | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getModelStatus().then((status) => {
      if (isMounted && status) setModelStatus(status);
    });
    return () => {
      isMounted = false;
    };
  }, [backendConnected]);

  const handleTestAndSave = async () => {
    setTestingStatus({ testing: true });
    try {
      const result = await api.getHealth(apiUrlInput);
      if (result.isConnected) {
        api.setBaseUrl(apiUrlInput);
        setTestingStatus({
          testing: false,
          message: `Connected successfully! (${result.latencyMs ?? 110}ms)`,
          isError: false
        });
        setTimeout(() => {
          setIsModalOpen(false);
          window.location.reload();
        }, 800);
      } else {
        setTestingStatus({
          testing: false,
          message: 'Server unreachable at this URL. Make sure FastAPI is running.',
          isError: true
        });
      }
    } catch (err: any) {
      setTestingStatus({
        testing: false,
        message: err.message || 'Connection failed.',
        isError: true
      });
    }
  };

  const handleReset = () => {
    api.resetBaseUrl();
    setApiUrlInput(api.getBaseUrl());
    setTestingStatus({
      testing: false,
      message: 'Reset to default URL.',
      isError: false
    });
  };

  return (
    <>
      <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-40 transition-all">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Real Project Identity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white font-bold shadow-xs">
              <Shield className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  Smart Helmet Violation Detection
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 hidden sm:inline-block">
                  IIIT Vadodara
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Automated Traffic Surveillance & Rider Compliance Analysis
              </p>
            </div>
          </div>

          {/* Right: Technical Badges & Server Connection */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Model Architecture Tag */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-xs font-mono text-gray-700">
              <Cpu className="w-3.5 h-3.5 text-gray-500" />
              <span>Co-DETR (ResNet-18)</span>
              {modelStatus?.gpu_name && (
                <span className="text-[10px] text-gray-400">({modelStatus.gpu_name})</span>
              )}
            </div>

            {/* Backend Connection Indicator with settings trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                backendConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
              title="Click to configure API Endpoint"
            >
              <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <Wifi className="w-3.5 h-3.5" />
              <span className="font-semibold">{backendConnected ? 'Inference Online' : 'Backend Offline'}</span>
              <Settings className="w-3 h-3 text-gray-400 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Backend API Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Inference Server Settings</h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setTestingStatus(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Connect to your Google Colab Cloudflare Tunnel or local FastAPI instance to run real-time GPU inference.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">API Endpoint URL</label>
              <input
                type="text"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                placeholder="https://xxxx.trycloudflare.com or http://localhost:8000"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-[11px] text-gray-400 font-mono">
                Current: {api.getBaseUrl()}
              </div>
            </div>

            {testingStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testingStatus.isError
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {testingStatus.isError ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{testingStatus.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer"
              >
                Reset Default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setTestingStatus(null);
                  }}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={testingStatus?.testing}
                  onClick={handleTestAndSave}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {testingStatus?.testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save & Connect</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
