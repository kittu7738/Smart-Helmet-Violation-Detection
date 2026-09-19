import React from 'react';
import { StatsCards } from '../components/StatsCards';
import { ViolationsTable } from '../components/ViolationsTable';
import { TrafficFlowChart } from '../components/TrafficFlowChart';
import { ViolationTypesCard } from '../components/ViolationTypesCard';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from '../types/detection';
import {
  ArrowRight,
  ScanLine,
  Video,
  AlertTriangle,
  FileText,
  Shield
} from 'lucide-react';

interface DashboardPageProps {
  stats: DashboardStats;
  live: LiveDetectionSummary;
  violations: RecentViolation[];
  onNavigateToViolations: () => void;
  onNavigateToDetection: () => void;
  onNavigateToVideo?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  violations,
  onNavigateToViolations,
  onNavigateToDetection,
  onNavigateToVideo
}) => {
  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* 1. PROJECT HERO (Clean, Authentic, Academic/Engineering) */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>IIIT Vadodara • Smart Traffic Safety Project</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
              Automated Motorcycle Helmet Violation Detection
            </h1>

            <p className="text-sm text-gray-600 leading-relaxed">
              Deep learning traffic surveillance system using Collaborative DETR (Co-DETR) with ResNet-18 backbone. Real-time localization and multi-rider compliance classification across 7 target classes.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onNavigateToDetection}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <ScanLine className="w-4 h-4" />
                <span>Open Image Detection Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onNavigateToVideo && (
                <button
                  onClick={onNavigateToVideo}
                  className="px-5 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs border border-gray-200 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4 text-gray-500" />
                  <span>Analyze Video Clip</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Benchmark Snapshot */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3 min-w-[280px]">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
              <span>Model Architecture</span>
              <span className="text-blue-600 font-mono">Co-DETR</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Backbone</span>
                <span className="font-semibold text-gray-800">ResNet-18 (FP16)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Validation AP50</span>
                <span className="font-semibold text-emerald-700 font-mono">54.30%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Candidate RoI Accuracy</span>
                <span className="font-semibold text-blue-700 font-mono">95.75%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Avg GPU Latency</span>
                <span className="font-semibold text-gray-800 font-mono">112 ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SYSTEM TELEMETRY CARDS */}
      <section className="space-y-2">
        <StatsCards stats={stats} />
      </section>

      {/* 3. MODEL IN ACTION PREVIEW & SYSTEM METRICS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Annotated Surveillance Sample */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Surveillance Detection Preview
              </h2>
              <p className="text-[11px] text-gray-500">
                Verified multi-target bounding box prediction sample
              </p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
              Co-DETR ResNet-18
            </span>
          </div>

          <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video flex items-center justify-center">
            <img
              src="/sample_traffic.jpg"
              alt="Surveillance sample"
              className="w-full h-full object-cover"
            />
            {/* Real SVG overlay with sample annotations */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Bike box */}
              <rect x="25" y="38" width="50" height="52" fill="rgba(37, 99, 235, 0.12)" stroke="#2563EB" strokeWidth="0.8" />
              {/* Driver box */}
              <rect x="42" y="15" width="16" height="36" fill="rgba(220, 38, 38, 0.16)" stroke="#DC2626" strokeWidth="0.8" />
            </svg>

            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
              VIOLATION: Driver (No Helmet) 91%
            </div>
            <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow">
              Motorcycle 95%
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-red-500 inline-block" />
                <span>Helmet Violation</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                <span>Compliant</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
                <span>Motorcycle</span>
              </span>
            </div>
            <button
              onClick={onNavigateToDetection}
              className="text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Test your own photo →
            </button>
          </div>
        </div>

        {/* Right: Violation Distribution */}
        <div className="lg:col-span-5">
          <ViolationTypesCard />
        </div>
      </section>

      {/* 4. TRAFFIC FLOW CHART */}
      <section>
        <TrafficFlowChart />
      </section>

      {/* 5. RECENT INFRACTIONS AUDIT LOG */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Recent Infractions Audit Log
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Logged motorcycle violations with license plates and officer review status
            </p>
          </div>

          <button
            onClick={onNavigateToViolations}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3.5 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Violations Database</span>
          </button>
        </div>

        <ViolationsTable violations={violations.slice(0, 5)} compact={true} />
      </section>
    </div>
  );
};
