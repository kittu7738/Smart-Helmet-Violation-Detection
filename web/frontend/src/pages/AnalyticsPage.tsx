import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
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
      <div className="text-center py-20 font-mono text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block mr-2" />
        Aggregating system analytics telemetry...
      </div>
    );
  }

  // Calculate totals for driver vs passenger
  const totalRiderViolations =
    data.riderComparison.driverViolations + data.riderComparison.passengerViolations;
  const driverPct = Math.round(
    (data.riderComparison.driverViolations / totalRiderViolations) * 100
  );
  const passengerPct = 100 - driverPct;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="font-tech text-2xl font-bold tracking-wider text-slate-100 uppercase">
            Computer Vision Analytics & Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Statistical breakdown of helmet usage compliance, time-series infractions, and AI model confidence.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-mono">
          {(['24H', '7D', '30D'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded transition-colors ${
                timeRange === range
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between mb-1 text-slate-400 text-xs">
            <span className="font-mono text-[11px]">AVG COMPLIANCE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-tech text-emerald-400">92.4%</div>
          <span className="text-[10px] text-slate-500 font-mono">+1.6% from prior period</span>
        </div>

        <div className="glass-card rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between mb-1 text-slate-400 text-xs">
            <span className="font-mono text-[11px]">PEAK VIOLATION HOUR</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-tech text-rose-400">16:00 - 17:00</div>
          <span className="text-[10px] text-slate-500 font-mono">19 incidents logged</span>
        </div>

        <div className="glass-card rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between mb-1 text-slate-400 text-xs">
            <span className="font-mono text-[11px]">MEAN DETECT CONF</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-tech text-cyan-300">94.8%</div>
          <span className="text-[10px] text-slate-500 font-mono">Swin-L backbone precision</span>
        </div>

        <div className="glass-card rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between mb-1 text-slate-400 text-xs">
            <span className="font-mono text-[11px]">WEEKLY TRAFFIC</span>
            <Gauge className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-tech text-slate-100">3,176 Bikes</div>
          <span className="text-[10px] text-slate-500 font-mono">Surveillance zone coverage</span>
        </div>
      </div>

      {/* Grid: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Helmet Compliance Over Time (SVG Area Chart) */}
        <div className="glass-panel rounded-xl p-5 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-tech font-bold uppercase tracking-wider text-slate-200">
                Helmet Compliance Trend (% vs Target)
              </h2>
              <p className="text-[11px] text-slate-400">
                Monitored compliance rate against the 95.0% municipal safety goal
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="h-56 w-full flex flex-col justify-end pt-4">
            <div className="relative flex-1 w-full flex items-end justify-between gap-2 px-2 border-b border-slate-800">
              {/* Target Line at 95% */}
              <div
                className="absolute left-0 right-0 border-b-2 border-dashed border-cyan-500/40 z-10 pointer-events-none"
                style={{ bottom: '75%' }}
              >
                <span className="absolute right-1 -top-4 text-[9px] font-mono text-cyan-400 bg-slate-950/80 px-1 rounded">
                  Target: 95%
                </span>
              </div>

              {data.complianceTrend.map((item, idx) => {
                const heightPercent = Math.max(10, (item.compliance - 70) * 3.3);
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono px-1.5 py-0.5 rounded pointer-events-none transition-opacity z-20 whitespace-nowrap shadow-lg">
                      {item.compliance}%
                    </div>

                    <div
                      className="w-full max-w-[28px] bg-gradient-to-t from-cyan-950 via-cyan-600/70 to-teal-400 rounded-t transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis labels */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 px-1">
              {data.complianceTrend.map((item, idx) => (
                <span key={idx}>{item.time}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Violations By Hour of Day (Bar Chart) */}
        <div className="glass-panel rounded-xl p-5 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-tech font-bold uppercase tracking-wider text-slate-200">
                Violations Frequency (Hourly)
              </h2>
              <p className="text-[11px] text-slate-400">
                Peak non-compliance windows identified during rush-hour windows
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-rose-400" />
          </div>

          <div className="h-56 w-full flex flex-col justify-end pt-4">
            <div className="flex-1 w-full flex items-end justify-between gap-2 px-2 border-b border-slate-800">
              {data.violationsOverTime.map((item, idx) => {
                const maxVal = 22;
                const heightPercent = (item.violations / maxVal) * 100;
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-950 border border-rose-500/40 text-rose-300 text-[10px] font-mono px-1.5 py-0.5 rounded pointer-events-none transition-opacity z-20 whitespace-nowrap">
                      {item.violations} Violations
                    </div>

                    <div
                      className="w-full max-w-[28px] bg-gradient-to-t from-rose-950 via-rose-600 to-rose-400 rounded-t transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis labels */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 px-1">
              {data.violationsOverTime.map((item, idx) => (
                <span key={idx}>{item.hour}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Driver vs Passenger Violations Ratio */}
        <div className="glass-panel rounded-xl p-5 border-slate-800 space-y-4">
          <div>
            <h2 className="text-sm font-tech font-bold uppercase tracking-wider text-slate-200">
              Rider Role Infraction Ratio
            </h2>
            <p className="text-[11px] text-slate-400">
              Comparison between motorcycle drivers and pillion passenger helmet violations
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Dual horizontal bar */}
            <div className="w-full h-7 bg-slate-900 rounded-lg overflow-hidden flex border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 text-xs font-bold font-mono transition-all duration-500"
                style={{ width: `${driverPct}%` }}
              >
                {driverPct}%
              </div>
              <div
                className="bg-gradient-to-r from-cyan-600 to-cyan-400 flex items-center justify-center text-slate-950 text-xs font-bold font-mono transition-all duration-500"
                style={{ width: `${passengerPct}%` }}
              >
                {passengerPct}%
              </div>
            </div>

            {/* Legend & Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span>DRIVERS WITHOUT HELMET</span>
                </div>
                <div className="text-xl font-bold font-tech text-white">
                  {data.riderComparison.driverViolations}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{driverPct}% of total</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>PASSENGERS WITHOUT HELMET</span>
                </div>
                <div className="text-xl font-bold font-tech text-white">
                  {data.riderComparison.passengerViolations}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{passengerPct}% of total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4: Detection Confidence Distribution */}
        <div className="glass-panel rounded-xl p-5 border-slate-800 space-y-4">
          <div>
            <h2 className="text-sm font-tech font-bold uppercase tracking-wider text-slate-200">
              Co-DETR Confidence Distribution
            </h2>
            <p className="text-[11px] text-slate-400">
              Prediction certainty scores across identified motorcycle/rider bounding boxes
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {data.confidenceDistribution.map((item, idx) => {
              const maxCount = 70;
              const widthPct = Math.min(100, (item.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">{item.range} Confidence</span>
                    <span className="text-cyan-300 font-bold">{item.count} detections</span>
                  </div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 rounded-full transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
