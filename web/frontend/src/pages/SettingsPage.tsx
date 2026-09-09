import React, { useState, useEffect } from 'react';
import {
  Cpu,
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
      <div className="pb-4 border-b border-slate-800">
        <h1 className="font-tech text-2xl font-bold tracking-wider text-slate-100 uppercase">
          System Configuration & AI Endpoints
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage backend endpoints, future Python inference integration, and detection sensitivity.
        </p>
      </div>

      {/* Backend Health Status Card */}
      <div className="glass-panel rounded-xl p-5 border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Node.js REST API Connectivity</span>
          </div>
          <button
            onClick={checkHealth}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline"
          >
            Refresh Status
          </button>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex-1">
            <div className="text-slate-400 mb-1">Backend REST API Endpoint:</div>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full max-w-sm px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            />
            <div className="text-slate-500 text-[11px] mt-1">
              Service: {health?.service || 'Detecting...'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {health?.isConnected ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ONLINE (CONNECTED)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 text-amber-400 border border-amber-500/40">
                <AlertCircle className="w-3.5 h-3.5" />
                OFFLINE (USING MOCK DATA)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Future Python AI Inference Service */}
      <div className="glass-panel rounded-xl p-5 border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Python Co-DETR Inference Gateway</span>
        </div>
        <p className="text-xs text-slate-400">
          When the Python inference service (`inference/predict.py` or FastAPI server) is launched, the Node backend will route video and frame requests here.
        </p>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-mono mb-1">
              Python Inference API URL
            </label>
            <input
              type="text"
              value={pythonUrl}
              onChange={(e) => setPythonUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="text-cyan-400 font-semibold">Planned AI Pipeline Topology:</div>
            <div>React Three.js Frontend → Node.js Express (:5001) → Python Co-DETR (:8000)</div>
          </div>
        </div>
      </div>

      {/* Model Detection Sensitivity Sliders */}
      <div className="glass-panel rounded-xl p-5 border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Detection Sensitivity Thresholds</span>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-mono mb-1">
              <span className="text-slate-300">Confidence Threshold</span>
              <span className="text-cyan-300 font-bold">{Math.round(confThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={confThreshold}
              onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500">
              Detections with confidence below this threshold are discarded.
            </span>
          </div>

          <div>
            <div className="flex justify-between font-mono mb-1">
              <span className="text-slate-300">NMS IoU Threshold</span>
              <span className="text-cyan-300 font-bold">{Math.round(iouThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.05"
              value={iouThreshold}
              onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500">
              Non-Maximum Suppression threshold for overlapping motorcycle and rider bounding boxes.
            </span>
          </div>
        </div>
      </div>

      {/* Camera Stream Endpoints */}
      <div className="glass-panel rounded-xl p-5 border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span>Surveillance Camera Feeds</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-200 font-bold">CAM-01</span>: Main Toll Gate
            </div>
            <span className="text-emerald-400 text-[10px]">RTSP ACTIVE</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-200 font-bold">CAM-02</span>: North Intersection
            </div>
            <span className="text-emerald-400 text-[10px]">RTSP ACTIVE</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-200 font-bold">CAM-03</span>: South Boulevard
            </div>
            <span className="text-cyan-400 text-[10px]">STANDBY</span>
          </div>
        </div>
      </div>

      {/* Save / Reset Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs font-mono shadow-neon-cyan hover:opacity-90 transition-opacity"
        >
          <Save className="w-4 h-4" />
          <span>{savedSuccess ? 'CONFIG SAVED!' : 'SAVE CONFIGURATION'}</span>
        </button>
      </div>
    </div>
  );
};
