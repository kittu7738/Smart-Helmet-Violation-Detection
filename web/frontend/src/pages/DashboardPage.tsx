import React, { useState } from 'react';
import { VisionScanner3D } from '../components/VisionScanner3D';
import { StatsCards } from '../components/StatsCards';
import { ViolationsTable } from '../components/ViolationsTable';
import { TrafficFlowChart } from '../components/TrafficFlowChart';
import { ViolationTypesCard } from '../components/ViolationTypesCard';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from '../types/detection';
import { DetectionItem } from '../services/api';
import {
  ArrowRight,
  ScanLine,
  Video,
  AlertTriangle,
  Sparkles,
  FileText
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
  // Sample detections mapped to sample traffic image for hero 3D scanner demo
  const sampleDetections: DetectionItem[] = [
    {
      class_id: 1,
      class_name: 'bike',
      display_name: 'Motorcycle',
      confidence: 0.963,
      bbox: [45, 120, 310, 380],
      violation: false
    },
    {
      class_id: 0,
      class_name: 'driver_with_helmet',
      display_name: 'Driver — Helmet',
      confidence: 0.942,
      bbox: [80, 50, 240, 210],
      violation: false
    }
  ];

  const [scannerState, setScannerState] = useState<'IDLE' | 'READY' | 'SCANNING' | 'ANALYZING' | 'RESULT_READY'>('RESULT_READY');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <div className="space-y-10 sm:space-y-12 w-full max-w-7xl mx-auto">
      {/* 1. HERO SECTION (Spacious, Elegant, Light) */}
      <section className="text-center pt-4 pb-2 max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Co-DETR ResNet-18 Computer Vision Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
          Intelligent Helmet Compliance & Traffic Safety AI
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Automated multi-rider motorcycle detection and protective helmet violation tracking powered by Collaborative DETR with real-time GPU inference.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onNavigateToDetection}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Start Live Detection</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onNavigateToVideo && (
            <button
              onClick={onNavigateToVideo}
              className="px-6 py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm border border-gray-300 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Video className="w-4 h-4 text-gray-500" />
              <span>Analyze Video Stream</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. 3D AI VISION SCANNER (The Real Image is the Hero) */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide">
              3D AI VISION SCANNER
            </h2>
            <p className="text-xs text-gray-500">
              Interactive 3D depth viewport showcasing real Co-DETR bounding box predictions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setScannerState('SCANNING');
                setTimeout(() => setScannerState('ANALYZING'), 1000);
                setTimeout(() => setScannerState('RESULT_READY'), 2200);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1.5"
            >
              <ScanLine className="w-3.5 h-3.5 text-blue-600" />
              <span>Simulate Scan</span>
            </button>

            <button
              onClick={onNavigateToDetection}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1"
            >
              <span>Upload Custom Photo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3D Floating Image Viewport */}
        <div className="w-full h-[480px] sm:h-[540px] shadow-sm rounded-2xl overflow-hidden">
          <VisionScanner3D
            imageUrl="/sample_traffic.jpg"
            detections={sampleDetections}
            state={scannerState}
            selectedIdx={selectedIdx}
            onSelectDetection={setSelectedIdx}
          />
        </div>
      </section>

      {/* 3. KEY METRICS CARDS */}
      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide">
            SYSTEM TELEMETRY
          </h2>
        </div>
        <StatsCards stats={stats} />
      </section>

      {/* 4. TRAFFIC FLOW & VIOLATION ANALYSIS (Two Clean Columns) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <TrafficFlowChart />
        </div>
        <div className="lg:col-span-4">
          <ViolationTypesCard />
        </div>
      </section>

      {/* 5. RECENT INFRACTIONS AUDIT LOG */}
      <section className="light-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h2 className="text-base font-bold text-gray-900 uppercase">
                RECENT INFRACTIONS AUDIT LOG
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified computer-vision infractions with license numbers and review triage
            </p>
          </div>

          <button
            onClick={onNavigateToViolations}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
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
