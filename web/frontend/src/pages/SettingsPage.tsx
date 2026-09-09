import React, { useState, useEffect } from 'react';
import {
  Server,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Camera
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:5001');
  const [pythonUrl, setPythonUrl] = useState('http://localhost:8000');
  const [confThreshold, setConfThreshold] = useState(0.45);
  const [iouThreshold, setIouThreshold] = useState(0.6);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const res = await api.getHealth();
    setHealth(res);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setConfThreshold(0.45);
    setIouThreshold(0.6);
    setPythonUrl('http://localhost:8000');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
          System Configuration & AI Endpoints
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage backend endpoints, future Python inference integration, and detection sensitivity.
        </p>
      </div>

      {/* Backend Health Status Card */}
      <div className="rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
            <Server className="w-5 h-5 text-blue-600" />
            <span>Node.js REST API Connectivity</span>
          </div>
          {health?.isConnected ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
              <AlertCircle className="w-4 h-4" /> Offline (Mock Mode)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">Service Status</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {health?.data?.status || 'OFFLINE'}
            </div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">Engine Core</div>
            <div className="text-sm font-bold text-blue-600 mt-0.5">
              {health?.data?.engine || 'Co-DETR Swin-L'}
            </div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500">Network Latency</div>
            <div className="text-sm font-bold text-green-600 mt-0.5">
              {health?.data?.latencyMs || 0} ms
            </div>
          </div>
        </div>
      </div>

      {/* Model Sensitivity Parameters */}
      <div className="rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
          <Sliders className="w-5 h-5 text-blue-600" />
          <span>Co-DETR Detection Parameters</span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>Confidence Threshold</span>
              <span className="font-mono font-bold text-blue-600">{confThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={confThreshold}
              onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Minimum probability required to classify a detected rider as wearing or not wearing a helmet.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>NMS IoU Threshold</span>
              <span className="font-mono font-bold text-blue-600">{iouThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="0.8"
              step="0.05"
              value={iouThreshold}
              onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Non-Maximum Suppression threshold to merge overlapping bounding box predictions.
            </p>
          </div>
        </div>
      </div>

      {/* API Endpoint Config */}
      <div className="rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Network Gateway Endpoints
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Node.js Backend REST API
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Python Co-DETR Inference Gateway
            </label>
            <input
              type="text"
              value={pythonUrl}
              onChange={(e) => setPythonUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Configuration saved successfully.</span>
          </div>
        )}
      </div>

      {/* Camera RTSP Feeds Card */}
      <div className="rounded-xl p-6 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
          <Camera className="w-5 h-5 text-blue-600" />
          <span>Configured Surveillance Cameras</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span>CAM-01 (Main Gate Highway)</span>
            <span className="text-green-600 font-semibold">1080p @ 30 FPS • RTSP Online</span>
          </div>
          <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span>CAM-02 (North Intersection)</span>
            <span className="text-green-600 font-semibold">1080p @ 30 FPS • RTSP Online</span>
          </div>
          <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span>CAM-05 (University Junction)</span>
            <span className="text-green-600 font-semibold">720p @ 30 FPS • RTSP Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
