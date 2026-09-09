import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  User,
  Users,
  Target,
  Gauge
} from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsData } from '../types/detection';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D'>('24H');

  useEffect(() => {
    api.getAnalytics().then(setData).catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="text-center py-24 text-sm text-blue-600 font-medium">
        Loading analytics telemetry...
      </div>
    );
  }

  const totalRiderViolations =
    data.riderComparison.driverViolations + data.riderComparison.passengerViolations;
  const driverPct = Math.round(
    (data.riderComparison.driverViolations / totalRiderViolations) * 100
  );
  const passengerPct = 100 - driverPct;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
            Computer Vision Analytics & Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Statistical breakdown of helmet usage compliance, time-series infractions, and AI model confidence.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg text-xs shadow-sm">
          {(['24H', '7D', '30D'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Mean Compliance</span>
            <ShieldCheck className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-green-600 font-mono">92.4%</div>
          <span className="text-[11px] text-slate-400 font-medium">+2.1% past 30 days</span>
        </div>

        <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Peak Infraction Hour</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-red-600 font-mono">08:00 - 09:00</div>
          <span className="text-[11px] text-slate-400 font-medium">Morning rush peak</span>
        </div>

        <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Mean Confidence</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 font-mono">95.4%</div>
          <span className="text-[11px] text-slate-400 font-medium">Validation dataset mAP</span>
        </div>

        <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Processed Vehicles</span>
            <Gauge className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">1,482</div>
          <span className="text-[11px] text-slate-400 font-medium">Vehicles tracked today</span>
        </div>
      </div>

      {/* Grid: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Compliance Over Time */}
        <div className="rounded-xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase">
                Compliance Rate Trend
              </h2>
              <p className="text-xs text-slate-500">Hourly adherence vs 95% target threshold</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
              92.4% Avg
            </span>
          </div>

          <div className="h-56 w-full pt-4">
            <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
              <line x1="0" y1="20" x2="400" y2="20" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="60" x2="400" y2="60" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="400" y2="100" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="400" y2="140" stroke="#E2E8F0" strokeWidth="1" />

              <line x1="0" y1="36" x2="400" y2="36" stroke="#16A34A" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
              <text x="340" y="32" fill="#16A34A" fontSize="9" fontWeight="bold">95% Target</text>

              {/* Area fill */}
              <polygon
                points="0,140 0,60 50,45 100,70 150,38 200,48 250,30 300,52 350,25 400,32 400,140"
                fill="#2563EB"
                fillOpacity="0.08"
              />

              {/* Polyline */}
              <polyline
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,60 50,45 100,70 150,38 200,48 250,30 300,52 350,25 400,32"
              />

              {/* Points */}
              {[[0,60],[50,45],[100,70],[150,38],[200,48],[250,30],[300,52],[350,25],[400,32]].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="3.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
              ))}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
            <span>06:00</span>
            <span>09:00</span>
            <span>12:00</span>
            <span>15:00</span>
            <span>18:00</span>
            <span>21:00</span>
          </div>
        </div>

        {/* Chart 2: Hourly Violations Distribution */}
        <div className="rounded-xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase">
                Hourly Violations Volume
              </h2>
              <p className="text-xs text-slate-500">Peak violation count distribution across the day</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
              Peak: 08:00
            </span>
          </div>

          <div className="h-56 w-full flex items-end justify-between gap-2 pt-4 pb-2 border-b border-slate-200">
            {data.violationsOverTime.map((item, idx) => {
              const maxHour = Math.max(...data.violationsOverTime.map((h) => h.violations));
              const heightPct = Math.max((item.violations / maxHour) * 100, 8);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.violations}
                  </span>
                  <div
                    className="w-full max-w-[20px] bg-red-500 hover:bg-red-600 rounded-t-sm transition-colors"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] font-mono text-slate-400 mt-1">
                    {item.hour.split(':')[0]}h
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Morning Commute (07:00-09:00) represents 44% of total daily infractions</span>
          </div>
        </div>
      </div>

      {/* Lower Row: Rider Role Comparison & Confidence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Comparison */}
        <div className="rounded-xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 uppercase">
            Rider Role Violation Ratio
          </h2>
          <p className="text-xs text-slate-500">Comparison of driver infractions vs pillion passenger infractions</p>

          <div className="flex items-center gap-6 py-4">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-blue-600" /> Drivers</span>
                <span>{driverPct}% ({data.riderComparison.driverViolations})</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${driverPct}%` }} />
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-500" /> Passengers</span>
                <span>{passengerPct}% ({data.riderComparison.passengerViolations})</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${passengerPct}%` }} />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
            Pillion passengers account for {passengerPct}% of infractions, indicating lower helmet adherence among secondary riders.
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="rounded-xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 uppercase">
            Model Confidence Distribution
          </h2>
          <p className="text-xs text-slate-500">Co-DETR Swin-L detection classification confidence breakdown</p>

          <div className="space-y-3 py-1">
            {data.confidenceDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-700">
                  <span>{item.range}</span>
                  <span className="font-semibold">{item.count} detections</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${(item.count / 300) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-500 pt-1">
            91% of predictions exceed 0.80 confidence threshold.
          </div>
        </div>
      </div>
    </div>
  );
};
