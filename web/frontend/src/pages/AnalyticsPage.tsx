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
      <div className="text-center py-24 font-mono text-sm text-[#00E5FF] font-bold">
        <span className="w-3 h-3 rounded-full bg-[#00E5FF] animate-ping inline-block mr-2" />
        Aggregating system analytics telemetry...
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
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-[#00E5FF]/20">
        <div>
          <h1 className="font-tech text-2xl sm:text-3xl font-black tracking-wider text-white uppercase text-glow-cyan">
            Computer Vision Analytics & Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Statistical breakdown of helmet usage compliance, time-series infractions, and AI model confidence.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5 bg-[#060D1F] border-2 border-[#00E5FF]/40 p-1.5 rounded-xl text-xs font-mono font-bold shadow-neon-cyan">
          {(['24H', '7D', '30D'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-gradient-to-r from-[#00E5FF] to-[#006CFF] text-white shadow-neon-cyan font-black scale-105'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="neon-glass-card rounded-2xl p-5 border-2 border-[#00FF9C] shadow-neon-green">
          <div className="flex items-center justify-between mb-1.5 text-slate-300 text-xs">
            <span className="font-mono font-bold uppercase">AVG COMPLIANCE</span>
            <ShieldCheck className="w-5 h-5 text-[#00FF9C] drop-shadow-[0_0_6px_#00FF9C]" />
          </div>
          <div className="text-3xl font-black font-tech text-[#00FF9C] text-glow-green">92.4%</div>
          <span className="text-[11px] text-slate-300 font-mono font-semibold">+1.6% from prior period</span>
        </div>

        <div className="neon-glass-card rounded-2xl p-5 border-2 border-[#FF3158] shadow-neon-red">
          <div className="flex items-center justify-between mb-1.5 text-slate-300 text-xs">
            <span className="font-mono font-bold uppercase">PEAK VIOLATION HOUR</span>
            <AlertTriangle className="w-5 h-5 text-[#FF3158] drop-shadow-[0_0_6px_#FF3158]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-tech text-[#FF3158] text-glow-red">16:00 - 17:00</div>
          <span className="text-[11px] text-slate-300 font-mono font-semibold">19 incidents logged</span>
        </div>

        <div className="neon-glass-card rounded-2xl p-5 border-2 border-[#00E5FF] shadow-neon-cyan">
          <div className="flex items-center justify-between mb-1.5 text-slate-300 text-xs">
            <span className="font-mono font-bold uppercase">MEAN DETECT CONF</span>
            <Target className="w-5 h-5 text-[#00E5FF] drop-shadow-[0_0_6px_#00E5FF]" />
          </div>
          <div className="text-3xl font-black font-tech text-[#00E5FF] text-glow-cyan">94.8%</div>
          <span className="text-[11px] text-slate-300 font-mono font-semibold">Swin-L backbone precision</span>
        </div>

        <div className="neon-glass-card rounded-2xl p-5 border-2 border-[#B44CFF] shadow-neon-purple">
          <div className="flex items-center justify-between mb-1.5 text-slate-300 text-xs">
            <span className="font-mono font-bold uppercase">WEEKLY TRAFFIC</span>
            <Gauge className="w-5 h-5 text-[#B44CFF] drop-shadow-[0_0_6px_#B44CFF]" />
          </div>
          <div className="text-3xl font-black font-tech text-white">3,176 <span className="text-sm font-normal text-slate-400">Bikes</span></div>
          <span className="text-[11px] text-slate-300 font-mono font-semibold">Surveillance zone coverage</span>
        </div>
      </div>

      {/* Grid: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Helmet Compliance Trend (% vs Target) */}
        <div className="neon-glass-panel rounded-2xl p-6 border-2 border-[#00E5FF]/40 shadow-neon-cyan space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-tech font-bold uppercase tracking-wider text-white text-glow-cyan">
                Helmet Compliance Trend (% vs Target)
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Monitored compliance rate against the 95.0% municipal safety goal
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#00E5FF] drop-shadow-[0_0_6px_#00E5FF]" />
          </div>

          <div className="h-60 w-full flex flex-col justify-end pt-4">
            <div className="relative flex-1 w-full flex items-end justify-between gap-2.5 px-2 border-b-2 border-[#00E5FF]/40">
              {/* Target Line at 95% */}
              <div
                className="absolute left-0 right-0 border-b-2 border-dashed border-[#00FF9C] z-10 pointer-events-none"
                style={{ bottom: '75%' }}
              >
                <span className="absolute right-1 -top-4 text-[10px] font-mono font-bold text-[#00FF9C] bg-slate-950 px-2 py-0.5 rounded border border-[#00FF9C]/60 shadow-neon-green">
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
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-950 border-2 border-[#00E5FF] text-[#00E5FF] text-xs font-mono font-black px-2 py-0.5 rounded-md pointer-events-none transition-opacity z-20 whitespace-nowrap shadow-neon-cyan">
                      {item.compliance}%
                    </div>

                    <div
                      className="w-full max-w-[32px] bg-gradient-to-t from-[#006CFF] via-[#00E5FF]/80 to-[#00FF9C] rounded-t-md transition-all duration-300 shadow-[0_0_12px_rgba(0,229,255,0.4)] group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-xs font-mono font-bold text-slate-300 pt-3 px-1">
              {data.complianceTrend.map((item, idx) => (
                <span key={idx}>{item.time}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Violations Frequency (Hourly) */}
        <div className="neon-glass-panel rounded-2xl p-6 border-2 border-[#FF3158]/40 shadow-neon-red space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-tech font-bold uppercase tracking-wider text-white text-glow-red">
                Violations Frequency (Hourly)
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Peak non-compliance windows identified during rush-hour windows
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-[#FF3158] drop-shadow-[0_0_6px_#FF3158]" />
          </div>

          <div className="h-60 w-full flex flex-col justify-end pt-4">
            <div className="flex-1 w-full flex items-end justify-between gap-2.5 px-2 border-b-2 border-[#FF3158]/40">
              {data.violationsOverTime.map((item, idx) => {
                const maxVal = 22;
                const heightPercent = (item.violations / maxVal) * 100;
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-950 border-2 border-[#FF3158] text-[#FF3158] text-xs font-mono font-black px-2 py-0.5 rounded-md pointer-events-none transition-opacity z-20 whitespace-nowrap shadow-neon-red">
                      {item.violations} Violations
                    </div>

                    <div
                      className="w-full max-w-[32px] bg-gradient-to-t from-[#451020] via-[#FF3158] to-[#FF8A00] rounded-t-md transition-all duration-300 shadow-[0_0_12px_rgba(255,49,88,0.5)] group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-xs font-mono font-bold text-slate-300 pt-3 px-1">
              {data.violationsOverTime.map((item, idx) => (
                <span key={idx}>{item.hour}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Rider Role Infraction Ratio */}
        <div className="neon-glass-panel rounded-2xl p-6 border-2 border-[#B44CFF]/40 shadow-neon-purple space-y-4">
          <div>
            <h2 className="text-base font-tech font-bold uppercase tracking-wider text-white text-glow-purple">
              Rider Role Infraction Ratio
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Comparison between motorcycle drivers and pillion passenger helmet violations
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Dual horizontal bar */}
            <div className="w-full h-8 bg-slate-950 rounded-xl overflow-hidden flex border-2 border-[#B44CFF]/50 p-0.5">
              <div
                className="bg-gradient-to-r from-[#FF8A00] to-[#FFD400] flex items-center justify-center text-slate-950 text-xs font-black font-mono shadow-neon-amber transition-all duration-500 rounded-l-lg"
                style={{ width: `${driverPct}%` }}
              >
                {driverPct}% DRIVER
              </div>
              <div
                className="bg-gradient-to-r from-[#00E5FF] to-[#1687FF] flex items-center justify-center text-slate-950 text-xs font-black font-mono shadow-neon-cyan transition-all duration-500 rounded-r-lg"
                style={{ width: `${passengerPct}%` }}
              >
                {passengerPct}% PASSENGER
              </div>
            </div>

            {/* Legend & Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-[#241B06]/90 p-4 rounded-xl border-2 border-[#FFD400] shadow-neon-amber">
                <div className="flex items-center gap-2 text-xs text-[#FFD400] font-black uppercase mb-1">
                  <User className="w-4 h-4" />
                  <span>DRIVERS NO HELMET</span>
                </div>
                <div className="text-2xl font-black font-tech text-white">
                  {data.riderComparison.driverViolations}
                </div>
                <span className="text-[11px] text-slate-300 font-mono font-semibold">{driverPct}% of total violations</span>
              </div>

              <div className="bg-[#07132B]/90 p-4 rounded-xl border-2 border-[#00E5FF] shadow-neon-cyan">
                <div className="flex items-center gap-2 text-xs text-[#00E5FF] font-black uppercase mb-1">
                  <Users className="w-4 h-4" />
                  <span>PASSENGERS NO HELMET</span>
                </div>
                <div className="text-2xl font-black font-tech text-white">
                  {data.riderComparison.passengerViolations}
                </div>
                <span className="text-[11px] text-slate-300 font-mono font-semibold">{passengerPct}% of total violations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4: Detection Confidence Distribution */}
        <div className="neon-glass-panel rounded-2xl p-6 border-2 border-[#00FF9C]/40 shadow-neon-green space-y-4">
          <div>
            <h2 className="text-base font-tech font-bold uppercase tracking-wider text-white text-glow-green">
              Co-DETR Confidence Distribution
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Prediction certainty scores across identified motorcycle/rider bounding boxes
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {data.confidenceDistribution.map((item, idx) => {
              const maxCount = 70;
              const widthPct = Math.min(100, (item.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-slate-300">{item.range} Confidence</span>
                    <span className="text-[#00FF9C] text-glow-green">{item.count} detections</span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-[#00FF9C]/40 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#1687FF] via-[#00E5FF] to-[#00FF9C] rounded-full transition-all duration-300 shadow-neon-green"
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
