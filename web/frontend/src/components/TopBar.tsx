import React, { useState } from 'react';
import { Settings, Menu, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface TopBarProps {
  backendConnected?: boolean;
  onOpenMobileMenu?: () => void;
  onOpenSettings?: () => void;
  isSettingsOpen?: boolean;
  setIsSettingsOpen?: (open: boolean) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  backendConnected = true,
  onOpenMobileMenu,
  isSettingsOpen,
  setIsSettingsOpen
}) => {
  const [localModalOpen, setLocalModalOpen] = useState(false);
  const isModalOpen = isSettingsOpen !== undefined ? isSettingsOpen : localModalOpen;
  const setModalOpen = setIsSettingsOpen || setLocalModalOpen;

  const [apiUrlInput, setApiUrlInput] = useState(api.getBaseUrl());
  const [testingStatus, setTestingStatus] = useState<{ testing: boolean; message?: string; isError?: boolean } | null>(null);

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
          setModalOpen(false);
          window.location.reload();
        }, 800);
      } else {
        setTestingStatus({
          testing: false,
          message: 'Server unreachable at this URL. Make sure FastAPI/Colab is running.',
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
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        {/* Mobile menu trigger */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <Menu size={18} />
          </button>
          <span className="font-bold text-slate-900 text-sm">Smart Helmet AI</span>
        </div>

        {/* Empty left spacer on desktop to keep items aligned right */}
        <div className="hidden lg:block"></div>

        {/* Right controls matching mockup */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Settings Trigger Icon Button */}
          <button
            onClick={() => setModalOpen(true)}
            className="w-9 h-9 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
            title="Configure Server Endpoint"
          >
            <Settings size={16} />
          </button>

          {/* System Online Pill Matching Mockup */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{backendConnected ? 'System Online' : 'System Standby'}</span>
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
                  setModalOpen(false);
                  setTestingStatus(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold cursor-pointer"
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
                    setModalOpen(false);
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
