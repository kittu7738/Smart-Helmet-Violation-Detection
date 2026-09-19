import React from 'react';
import {
  Cpu,
  Server,
  Award,
  Zap
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Hero Header */}
      <section className="text-center pt-4 pb-2 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>IIITVICD AI City Challenge Research Project</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
          Smart Helmet AI Violation Detection
        </h1>

        <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
          An automated computer vision surveillance system powered by <strong>Co-DETR (Collaborative DETR)</strong> with ResNet-18, engineered for high-accuracy motorcycle rider classification and helmet compliance enforcement in smart city traffic infrastructure.
        </p>
      </section>

      {/* 3 Core Architecture Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="light-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Collaborative DETR</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Combines one-to-one set prediction with multi-task auxiliary heads (ATSS + Faster R-CNN) during training to overcome sparse query supervision while maintaining zero overhead at inference.
          </p>
        </div>

        <div className="light-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900">FP16 Tensor Core Speed</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Optimized for real-time edge and cloud deployment. Operates at <strong>~99–160 ms per frame</strong> (~10 FPS) on NVIDIA Tesla T4 with an ultra-compact memory footprint of <strong>149.6 MB VRAM</strong>.
          </p>
        </div>

        <div className="light-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Zero-Cost Cloud Topology</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Vercel React edge frontend seamlessly communicating with Google Colab Tesla T4 GPU via Cloudflare Tunnel over FastAPI, with 100% platform portability to Hugging Face or RunPod.
          </p>
        </div>
      </div>

      {/* Model Specifications & 7 Classes */}
      <div className="light-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 uppercase">
              Model Specifications & Verified Checkpoint
            </h2>
            <p className="text-xs text-gray-500">Architecture details from epoch 10 evaluation</p>
          </div>
          <span className="badge-compliant px-3 py-1 rounded-full text-xs font-semibold">
            Verified Checkpoint
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="text-gray-500 font-medium text-[11px]">Framework</div>
            <div className="text-gray-900 font-bold text-sm mt-1">Co-DETR (MMDet 2.25)</div>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="text-gray-500 font-medium text-[11px]">Backbone</div>
            <div className="text-gray-900 font-bold text-sm mt-1">ResNet-18</div>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="text-gray-500 font-medium text-[11px]">Resolution</div>
            <div className="text-gray-900 font-bold text-sm mt-1">640 × 384</div>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="text-gray-500 font-medium text-[11px]">Object Queries</div>
            <div className="text-gray-900 font-bold text-sm mt-1">150 + 100 DN</div>
          </div>
        </div>

        {/* 7 Target Classes */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            7 Target Detection Classes
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-900 font-medium">driver_with_helmet</span>
            </div>
            <div className="p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-blue-900 font-medium">bike</span>
            </div>
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
              <span className="text-gray-800 font-medium">driver</span>
            </div>
            <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-900 font-medium">passenger_with_helmet</span>
            </div>
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-gray-800 font-medium">passenger</span>
            </div>
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-red-900 font-bold">driver_without_helmet</span>
            </div>
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-amber-900 font-bold">passenger_without_helmet</span>
            </div>
          </div>
        </div>
      </div>

      {/* End-to-End System Pipeline */}
      <div className="light-card p-6 sm:p-8 space-y-4">
        <div className="pb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 uppercase">
            End-to-End Deployment Architecture
          </h2>
          <p className="text-xs text-gray-500">Zero-cost production topology for Deadline 1</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-center text-xs">
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1">
            <div className="text-blue-700 font-bold">1. Vercel Frontend</div>
            <div className="text-gray-600">React + Vite + TypeScript SaaS UI</div>
          </div>
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-1">
            <div className="text-indigo-700 font-bold">2. Cloudflare Tunnel</div>
            <div className="text-gray-600">Secure low-latency HTTPS gateway</div>
          </div>
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1">
            <div className="text-purple-700 font-bold">3. FastAPI Python Engine</div>
            <div className="text-gray-600">High-throughput inference microservice</div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
            <div className="text-emerald-700 font-bold">4. Tesla T4 GPU</div>
            <div className="text-gray-600">Co-DETR FP16 Tensor Core Acceleration</div>
          </div>
        </div>
      </div>
    </div>
  );
};
