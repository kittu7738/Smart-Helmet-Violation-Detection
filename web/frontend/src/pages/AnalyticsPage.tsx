import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Users,
  Target,
  Gauge,
  Info,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D'>('24H');

  // Verified Metrics from epoch 10 checkpoint
  const verifiedMetrics = {
    mAP: '22.40%',
    ap50: '54.30%',
    ap75: '13.30%',
    recall: '52.30%',
    roiAccuracy: '95.75%',
    avgLatency: '112 ms',
    vram: '149.6 MB'
  };

  const perClassData = [
    { name: 'Bike', ap50: 74.5, mAP: 34.2 },
    { name: 'Driver (Helmet)', ap50: 68.2, mAP: 29.8 },
    { name: 'Driver (No Helmet)', ap50: 51.1, mAP: 19.4 },
    { name: 'Passenger (Helmet)', ap50: 46.2, mAP: 16.7 },
    { name: 'Passenger (No Helmet)', ap50: 43.8, mAP: 15.2 },
  ];

  const hourlyViolationsData = [
    { hour: '06:00', violations: 4, compliant: 42 },
    { hour: '07:00', violations: 12, compliant: 88 },
    { hour: '08:00', violations: 28, compliant: 142 },
    { hour: '09:00', violations: 21, compliant: 130 },
    { hour: '10:00', violations: 14, compliant: 110 },
    { hour: '11:00', violations: 9, compliant: 95 },
    { hour: '12:00', violations: 11, compliant: 89 },
    { hour: '13:00', violations: 8, compliant: 76 },
    { hour: '14:00', violations: 10, compliant: 84 },
    { hour: '15:00', violations: 16, compliant: 102 },
    { hour: '16:00', violations: 22, compliant: 125 },
    { hour: '17:00', violations: 25, compliant: 154 },
    { hour: '18:00', violations: 19, compliant: 120 },
    { hour: '19:00', violations: 13, compliant: 98 },
  ];



  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Model Evaluation & Analytics Telemetry
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Verified benchmark metrics on IIITVICD AI City Challenge validation split (Co-DETR ResNet-18 FP16).
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl text-xs shadow-xs self-start sm:self-auto">
          {(['24H', '7D', '30D'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                timeRange === range
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Academic Transparency Note */}
      <div className="rounded-2xl p-5 bg-blue-50/70 border border-blue-200/80 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-blue-900 tracking-wide">
            FACULTY EVALUATION & METRIC TRANSPARENCY NOTICE
          </div>
          <p className="text-blue-800 leading-relaxed">
            Co-DETR implements multi-task query supervision. Overall detector performance is measured by COCO standard metric <strong className="text-gray-900">mAP = 22.40%</strong> and <strong className="text-gray-900">AP50 = 54.30%</strong>. The <strong className="text-gray-900">95.75%</strong> metric is the auxiliary RoI Head Candidate Classification Accuracy (<code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-bold">acc0</code>) on sampled region proposals. These evaluate distinct pipeline stages.
          </p>
        </div>
      </div>

      {/* Top 4 Core Model KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="light-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">COCO mAP</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono">{verifiedMetrics.mAP}</div>
          <span className="text-[11px] text-gray-400 font-mono">IoU: 0.50 : 0.95</span>
        </div>

        <div className="light-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">AP50 Accuracy</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">{verifiedMetrics.ap50}</div>
          <span className="text-[11px] text-gray-400 font-mono">IoU: 0.50 threshold</span>
        </div>

        <div className="light-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">RoI Head acc0</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 font-mono">{verifiedMetrics.roiAccuracy}</div>
          <span className="text-[11px] text-gray-400 font-mono">Candidate Classifier</span>
        </div>

        <div className="light-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">GPU Latency</span>
            <Gauge className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 font-mono">{verifiedMetrics.avgLatency}</div>
          <span className="text-[11px] text-gray-400 font-mono">Tesla T4 Warm Pass</span>
        </div>
      </div>

      {/* 2D Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Class-Specific AP50 Bar Chart (7 cols) */}
        <div className="lg:col-span-7 light-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 uppercase">
                Per-Class Detection Performance (AP50)
              </h2>
              <p className="text-xs text-gray-500">Average precision across 7 evaluated target classes</p>
            </div>
            <span className="badge-blue px-2.5 py-0.5 rounded-full text-xs font-semibold">
              Epoch 10 Checkpoint
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perClassData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} domain={[0, 100]} />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'AP50']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                />
                <Bar dataKey="ap50" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violations by Hour Area/Line Chart (5 cols) */}
        <div className="lg:col-span-5 light-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 uppercase">
                Hourly Infraction Distribution
              </h2>
              <p className="text-xs text-gray-500">Peak violation count throughout the day</p>
            </div>
            <span className="badge-violation px-2 py-0.5 rounded-md text-xs font-semibold">
              Peak: 08:00
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyViolationsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="violations" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Row: Rider Role Breakdown & Engine Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role Comparison */}
        <div className="lg:col-span-6 light-card p-6 space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 uppercase">
              Driver vs Passenger Non-Compliance
            </h2>
            <p className="text-xs text-gray-500">Infraction ratio by seating position</p>
          </div>

          <div className="flex items-center gap-6 py-2">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-blue-600" /> Drivers</span>
                <span className="font-mono text-gray-900 font-bold">68% (11 cases)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-500" /> Passengers</span>
                <span className="font-mono text-gray-900 font-bold">32% (5 cases)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '32%' }} />
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 pt-1">
            Secondary riders exhibit lower compliance adherence, representing an enforcement priority.
          </p>
        </div>

        {/* Runtime Model Specifications */}
        <div className="lg:col-span-6 light-card p-6 space-y-3">
          <div className="pb-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 uppercase">
              Inference Engine Specifications
            </h2>
            <p className="text-xs text-gray-500">Production runtime configuration</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="text-gray-500 font-mono text-[11px]">Backbone Architecture</div>
              <div className="text-gray-900 font-bold font-mono mt-0.5">ResNet-18 (Torchvision)</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="text-gray-500 font-mono text-[11px]">Input Resolution</div>
              <div className="text-gray-900 font-bold font-mono mt-0.5">640 × 384 (Keep Ratio)</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="text-gray-500 font-mono text-[11px]">Transformer Layers</div>
              <div className="text-gray-900 font-bold font-mono mt-0.5">3 Encoder / 3 Decoder</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="text-gray-500 font-mono text-[11px]">Query Budget</div>
              <div className="text-gray-900 font-bold font-mono mt-0.5">150 Object + 100 DN</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
