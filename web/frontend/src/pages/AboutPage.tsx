import React from 'react';
import {
  Cpu,
  Server,
  Layers,
  Award,
  Zap
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-blue-950/50 via-slate-900/90 to-purple-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">
            <Award className="w-3.5 h-3.5" />
            <span>IIITVICD AI City Challenge Research Project</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white uppercase font-mono">
            Smart Helmet AI Violation Detection
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            An automated computer vision surveillance system powered by <strong>Co-DETR (Collaborative DETR)</strong> with ResNet-18, engineered for high-accuracy motorcycle rider classification and helmet compliance enforcement in smart city traffic infrastructure.
          </p>
        </div>
      </div>

      {/* 3 Core Architecture Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white font-mono uppercase">Collaborative DETR</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Combines one-to-one set prediction with multi-task auxiliary heads (ATSS + Faster R-CNN) during training to overcome sparse query supervision while maintaining zero overhead at inference.
          </p>
        </div>

        <div className="rounded-xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white font-mono uppercase">FP16 Tensor Core Speed</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Optimized for real-time edge and cloud deployment. Operates at <strong>~99–160 ms per frame</strong> (~10 FPS) on NVIDIA Tesla T4 with an ultra-compact memory footprint of <strong>149.6 MB VRAM</strong>.
          </p>
        </div>

        <div className="rounded-xl p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white font-mono uppercase">Zero-Cost Cloud Topology</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Vercel React edge frontend seamlessly communicating with Google Colab Tesla T4 GPU via Cloudflare Tunnel over FastAPI, with 100% platform portability to Hugging Face or RunPod.
          </p>
        </div>
      </div>

      {/* Model Specifications & Verified Checkpoint Details */}
      <div className="rounded-2xl p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white uppercase font-mono">
              Model Specifications & Verified Checkpoint
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
            Verified Checkpoint
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-slate-500 font-mono text-[11px]">Core Architecture</div>
            <div className="text-white font-bold text-sm font-mono mt-1">Co-DETR (MMDet 2.25)</div>
          </div>
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-slate-500 font-mono text-[11px]">Backbone</div>
            <div className="text-white font-bold text-sm font-mono mt-1">ResNet-18</div>
          </div>
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-slate-500 font-mono text-[11px]">Resolution</div>
            <div className="text-white font-bold text-sm font-mono mt-1">640 × 384</div>
          </div>
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-slate-500 font-mono text-[11px]">Object Queries</div>
            <div className="text-white font-bold text-sm font-mono mt-1">150 + 100 DN</div>
          </div>
        </div>

        {/* 7 Target Classes Table */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase font-mono">
            7 Target Detection Classes
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-200">driver_with_helmet</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-200">bike</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span className="text-slate-200">driver</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-200">passenger_with_helmet</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span className="text-slate-200">passenger</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-rose-500/30 bg-rose-500/5 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-rose-300 font-semibold">driver_without_helmet</span>
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-amber-500/30 bg-amber-500/5 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-amber-300 font-semibold">passenger_without_helmet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Architecture Flowchart */}
      <div className="rounded-2xl p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white uppercase font-mono">
            End-to-End System Pipeline
          </h2>
          <p className="text-xs text-slate-400">Zero-cost production deployment architecture</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-1">
            <div className="text-blue-400 font-bold font-mono">1. Vercel Frontend</div>
            <div className="text-slate-400">React + Vite + TypeScript interactive UI</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-1">
            <div className="text-cyan-400 font-bold font-mono">2. Cloudflare Tunnel</div>
            <div className="text-slate-400">Encrypted low-latency HTTPS bridge</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-1">
            <div className="text-purple-400 font-bold font-mono">3. FastAPI Engine</div>
            <div className="text-slate-400">High-throughput Python microservice</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
            <div className="text-emerald-400 font-bold font-mono">4. Tesla T4 GPU</div>
            <div className="text-slate-400">Co-DETR FP16 Tensor Core Inference</div>
          </div>
        </div>
      </div>
    </div>
  );
};
