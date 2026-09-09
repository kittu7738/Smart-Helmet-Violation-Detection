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
    <div className="space-y-7 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="pb-4 border-b-2 border-[#00E5FF]/20">
        <h1 className="font-tech text-2xl sm:text-3xl font-black tracking-wider text-white uppercase text-glow-cyan">
          System Configuration & AI Endpoints
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-medium">
          Manage backend endpoints, future Python inference integration, and detection sensitivity.
        </p>
      </div>

      {/* Backend Health Status Card */}
      <div className="neon-glass-panel rounded-2xl p-6 border-2 border-[#00E5FF]/30 shadow-neon-cyan space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <Server className="w-5 h-5 text-[#00E5FF] drop-shadow-[0_0_6px_#00E5FF]" />
            <span>Node.js REST API Connectivity</span>
          </div>
          <button
            onClick={checkHealth}
            className="text-xs font-mono font-bold text-[#00E5FF] hover:text-[#00FF9C] transition-colors bg-[#00E5FF]/10 px-3 py-1 rounded-md border border-[#00E5FF]/40 shadow-neon-cyan"
          >
            Refresh Status
          </button>
        </div>

        <div className="bg-[#060D1F] p-4 rounded-xl border-2 border-[#00E5FF]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex-1">
            <div className="text-slate-300 font-semibold mb-1.5">Backend REST API Endpoint:</div>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full max-w-md px-3 py-1.5 bg-slate-950 border-2 border-[#00E5FF]/50 rounded-lg text-[#00E5FF] font-mono font-bold focus:outline-none focus:border-[#00E5FF] focus:shadow-neon-cyan"
            />
            <div className="text-slate-400 text-[11px] mt-1.5">
              Service: <span className="text-white font-bold">{health?.service || 'Detecting...'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {health?.isConnected ? (
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#00FF9C]/20 text-[#00FF9C] border-2 border-[#00FF9C] shadow-neon-green font-bold">
                <CheckCircle2 className="w-4 h-4" />
                ONLINE (CONNECTED)
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#FFD400]/20 text-[#FFD400] border-2 border-[#FFD400] shadow-neon-amber font-bold">
                <AlertCircle className="w-4 h-4" />
                OFFLINE (USING MOCK DATA)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Future Python AI Inference Service */}
      <div className="neon-glass-panel rounded-2xl p-6 border-2 border-[#1687FF]/40 shadow-neon-blue space-y-4">
        <div className="flex items-center gap-2.5 text-white font-bold text-base">
          <Cpu className="w-5 h-5 text-[#1687FF] drop-shadow-[0_0_6px_#1687FF]" />
          <span>Python Co-DETR Inference Gateway</span>
        </div>
        <p className="text-xs text-slate-300 font-medium">
          When the Python inference service (`inference/predict.py` or FastAPI server) is launched, the Node backend will route video and frame requests here.
        </p>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-200 font-mono font-bold mb-1.5">
              Python Inference API URL
            </label>
            <input
              type="text"
              value={pythonUrl}
              onChange={(e) => setPythonUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full px-3.5 py-2 bg-[#060D1F] border-2 border-[#1687FF]/50 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-[#00E5FF] focus:shadow-neon-cyan"
            />
          </div>

          <div className="p-3.5 bg-[#060D1F] rounded-xl border border-[#1687FF]/30 text-xs font-mono text-slate-300 space-y-1">
            <div className="text-[#00E5FF] font-bold">Planned AI Pipeline Topology:</div>
            <div>React Three.js Frontend → Node.js Express (:5001) → Python Co-DETR (:8000)</div>
          </div>
        </div>
      </div>

      {/* Model Detection Sensitivity Sliders */}
      <div className="neon-glass-panel rounded-2xl p-6 border-2 border-[#00FF9C]/30 shadow-neon-green space-y-5">
        <div className="flex items-center gap-2.5 text-white font-bold text-base">
          <Sliders className="w-5 h-5 text-[#00FF9C] drop-shadow-[0_0_6px_#00FF9C]" />
          <span>Detection Sensitivity Thresholds</span>
        </div>

        <div className="space-y-5 text-xs">
          <div>
            <div className="flex justify-between font-mono font-bold mb-1.5">
              <span className="text-white text-sm">Confidence Threshold</span>
              <span className="text-[#00E5FF] text-base font-black text-glow-cyan">{Math.round(confThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={confThreshold}
              onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#00E5FF] h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 font-medium">
              Detections with confidence below this threshold are discarded.
            </span>
          </div>

          <div>
            <div className="flex justify-between font-mono font-bold mb-1.5">
              <span className="text-white text-sm">NMS IoU Threshold</span>
              <span className="text-[#00FF9C] text-base font-black text-glow-green">{Math.round(iouThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.05"
              value={iouThreshold}
              onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#00FF9C] h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 font-medium">
              Non-Maximum Suppression threshold for overlapping motorcycle and rider bounding boxes.
            </span>
          </div>
        </div>
      </div>

      {/* Camera Stream Endpoints */}
      <div className="neon-glass-panel rounded-2xl p-6 border-2 border-[#B44CFF]/30 shadow-neon-purple space-y-4">
        <div className="flex items-center gap-2.5 text-white font-bold text-base">
          <Camera className="w-5 h-5 text-[#B44CFF] drop-shadow-[0_0_6px_#B44CFF]" />
          <span>Surveillance Camera Feeds</span>
        </div>

        <div className="space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between p-3.5 bg-[#060D1F] rounded-xl border border-slate-700">
            <div>
              <span className="text-white font-black text-sm">CAM-01</span>: Main Toll Gate Highway
            </div>
            <span className="text-[#00FF9C] text-xs font-bold bg-[#00FF9C]/15 px-2.5 py-1 rounded border border-[#00FF9C]/40">
              RTSP ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#060D1F] rounded-xl border border-slate-700">
            <div>
              <span className="text-white font-black text-sm">CAM-02</span>: North Intersection Flyover
            </div>
            <span className="text-[#00FF9C] text-xs font-bold bg-[#00FF9C]/15 px-2.5 py-1 rounded border border-[#00FF9C]/40">
              RTSP ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#060D1F] rounded-xl border border-slate-700">
            <div>
              <span className="text-white font-black text-sm">CAM-03</span>: South Boulevard Circle
            </div>
            <span className="text-[#00E5FF] text-xs font-bold bg-[#00E5FF]/15 px-2.5 py-1 rounded border border-[#00E5FF]/40">
              STANDBY
            </span>
          </div>
        </div>
      </div>

      {/* Save / Reset Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border-2 border-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Defaults</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#00FF9C] to-[#1687FF] text-slate-950 font-black text-xs font-mono shadow-neon-cyan hover:scale-105 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{savedSuccess ? 'CONFIG SAVED!' : 'SAVE CONFIGURATION'}</span>
        </button>
      </div>
    </div>
  );
};
