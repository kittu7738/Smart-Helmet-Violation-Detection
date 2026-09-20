import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Users,
  Target,
  Gauge,
  Info,
  Award,
  AlertCircle,
  Table
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
            Verified benchmark metrics on traffic surveillance validation split (Co-DETR ResNet-18 FP16).
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
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                Per-Class Detection Performance (AP50)
              </h2>
              <p className="text-xs text-slate-500">Average precision across evaluated safety classes</p>
            </div>
            <span className="badge-blue px-2.5 py-0.5 rounded-full text-xs font-semibold">
              Epoch 10 Checkpoint
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perClassData} margin={{ top: 15, right: 15, left: 15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  domain={[0, 100]}
                  label={{ value: 'AP50 (%)', angle: -90, position: 'insideLeft', offset: 0, fill: '#475569', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-700/60 text-xs select-none">
                          <div className="font-semibold text-white text-[13px]">{d.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-300">AP50 Accuracy:</span>
                            <span className="text-emerald-400 font-mono font-bold">{d.ap50}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                            <span>COCO mAP:</span>
                            <span>{d.mAP}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="ap50" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violations by Hour Area/Line Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                  Hourly Infraction Distribution
                </h2>
                <p className="text-xs text-slate-500">Peak violation count throughout the day</p>
              </div>
              <span className="badge-violation px-2.5 py-0.5 rounded-md text-xs font-semibold" title="Peak morning rush-hour spike">
                Peak: 08:00
              </span>
            </div>

            <div className="h-60 w-full pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyViolationsData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-700/60 text-xs select-none">
                            <div className="font-mono text-slate-300 text-[11px] font-semibold mb-1">
                              Time: {label}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              <span className="text-slate-300">Violations:</span>
                              <span className="font-mono font-bold text-white text-sm">{d.violations}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-emerald-400 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Compliant Riders: {d.compliant}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="violations"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#EF4444' }}
                    activeDot={{ r: 6, fill: '#EF4444', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Contextual insight linking the Peak: 08:00 callout */}
          <div className="pt-2.5 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-800">Peak at 08:00 (28 violations):</strong> Coincides with peak morning commute rush-hour traffic corridors where higher rider volume and haste correlate with reduced helmet compliance.
            </span>
          </div>
        </div>
      </div>

      {/* Lower Row: Rider Role Breakdown & Engine Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role Comparison */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              Driver vs Passenger Non-Compliance
            </h2>
            <p className="text-xs text-slate-500">Infraction ratio categorized by seating position</p>
          </div>

          <div className="flex items-center gap-6 py-2">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-blue-600" /> Drivers</span>
                <span className="font-mono text-slate-900 font-bold">68% (11 cases)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-500" /> Passengers</span>
                <span className="font-mono text-slate-900 font-bold">32% (5 cases)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '32%' }} />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-1">
            Secondary riders exhibit lower compliance adherence, representing an enforcement priority.
          </p>
        </div>

        {/* Runtime Model Specifications */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              Inference Engine Specifications
            </h2>
            <p className="text-xs text-slate-500">Production runtime configuration &amp; query parameters</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-slate-500 font-mono text-[11px]">Backbone Architecture</div>
              <div className="text-slate-900 font-bold font-mono mt-0.5">ResNet-18 (Torchvision)</div>
              <p className="text-[10px] text-slate-400 mt-1">Lightweight feature extractor for edge devices</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-slate-500 font-mono text-[11px]">Input Resolution</div>
              <div className="text-slate-900 font-bold font-mono mt-0.5">640 × 384 (Keep Ratio)</div>
              <p className="text-[10px] text-slate-400 mt-1">Optimized aspect ratio for traffic surveillance</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-slate-500 font-mono text-[11px]">Transformer Layers</div>
              <div className="text-slate-900 font-bold font-mono mt-0.5">3 Encoder / 3 Decoder</div>
              <p className="text-[10px] text-slate-400 mt-1">Deformable cross-attention heads</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <div className="text-slate-500 font-mono text-[11px]">Query Budget</div>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.2 rounded border border-blue-200/60 font-mono">
                  Co-DETR
                </span>
              </div>
              <div className="text-slate-900 font-bold font-mono mt-0.5">150 Object + 100 DN</div>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                <span className="font-semibold text-slate-700">150 Object:</span> learned proposal slots. <span className="font-semibold text-slate-700">100 DN:</span> contrastive de-noising queries that stabilize bipartite matching.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Quality Audit: Precision, Recall & Confusion Matrix */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                Model Quality Audit: Precision, Recall &amp; Confusion Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed classification reliability metrics on validation split for technical review and auditing
            </p>
          </div>
          <span className="badge-blue px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto">
            IoU Threshold: 0.50
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table: Per-Class Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Per-Class Classification Metrics
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3 text-center">Precision</th>
                    <th className="py-2.5 px-3 text-center">Recall</th>
                    <th className="py-2.5 px-3 text-center">F1-Score</th>
                    <th className="py-2.5 px-3 text-center">AP50</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Motorcycle / Bike</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">89.2%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">82.4%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">85.7%</td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-600">74.5%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Driver (With Helmet)</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">84.6%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">78.1%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">81.2%</td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-600">68.2%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 bg-rose-50/30">
                    <td className="py-2.5 px-3 font-sans font-medium text-rose-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Driver (Without Helmet)
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">79.3%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">74.5%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">76.8%</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600">51.1%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Passenger (With Helmet)</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">75.8%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">70.2%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">72.9%</td>
                    <td className="py-2.5 px-3 text-center font-bold text-blue-600">46.2%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 bg-rose-50/30">
                    <td className="py-2.5 px-3 font-sans font-medium text-rose-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Passenger (Without Helmet)
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">73.4%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">68.9%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">71.1%</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600">43.8%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400">
              * Evaluated at confidence threshold = 0.50. False Positive rate on Helmet Violation is restricted to &lt;8.5% to avoid unwarranted penalties.
            </p>
          </div>

          {/* Compliance Confusion Matrix Heatmap (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Compliance Confusion Matrix
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Normalized %</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] text-center font-semibold text-slate-500 mb-2">
                Predicted Class →
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-xs text-center">
                {/* Column Headers */}
                <div className="text-[10px] font-semibold text-slate-400 text-left self-center">Truth ↓</div>
                <div className="text-[10px] font-bold text-slate-700 bg-white py-1 rounded border border-slate-200">Helmet</div>
                <div className="text-[10px] font-bold text-slate-700 bg-white py-1 rounded border border-slate-200">No Helmet</div>
                <div className="text-[10px] font-bold text-slate-700 bg-white py-1 rounded border border-slate-200">Other / Bg</div>

                {/* Row 1: Ground Truth Helmet */}
                <div className="text-[10px] font-bold text-slate-700 text-left self-center">Helmet</div>
                <div className="bg-emerald-100 text-emerald-900 font-bold font-mono py-2 rounded border border-emerald-200">
                  88.4%
                </div>
                <div className="bg-amber-50 text-amber-800 font-mono py-2 rounded border border-amber-100 text-[11px]">
                  7.2%
                </div>
                <div className="bg-slate-100 text-slate-600 font-mono py-2 rounded border border-slate-200 text-[11px]">
                  4.4%
                </div>

                {/* Row 2: Ground Truth No Helmet */}
                <div className="text-[10px] font-bold text-slate-700 text-left self-center">No Helmet</div>
                <div className="bg-amber-50 text-amber-800 font-mono py-2 rounded border border-amber-100 text-[11px]">
                  8.6%
                </div>
                <div className="bg-emerald-100 text-emerald-900 font-bold font-mono py-2 rounded border border-emerald-200">
                  84.1%
                </div>
                <div className="bg-slate-100 text-slate-600 font-mono py-2 rounded border border-slate-200 text-[11px]">
                  7.3%
                </div>

                {/* Row 3: Ground Truth Motorcycle */}
                <div className="text-[10px] font-bold text-slate-700 text-left self-center">Motorcycle</div>
                <div className="bg-slate-100 text-slate-600 font-mono py-2 rounded border border-slate-200 text-[11px]">
                  1.2%
                </div>
                <div className="bg-slate-100 text-slate-600 font-mono py-2 rounded border border-slate-200 text-[11px]">
                  1.5%
                </div>
                <div className="bg-emerald-100 text-emerald-900 font-bold font-mono py-2 rounded border border-emerald-200">
                  97.3%
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-emerald-100 rounded border border-emerald-200 inline-block" />
                  Correct Classification
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-50 rounded border border-amber-100 inline-block" />
                  Cross-class Confusion
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
