import React from 'react';
import { Activity, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';

export const TrafficFlowChart: React.FC = () => {
  // 12 5-minute intervals across the last 1 hour with full realistic data
  const intervals = [
    { time: '10:00', total: 38, compliant: 35, violations: 3 },
    { time: '10:05', total: 44, compliant: 41, violations: 3 },
    { time: '10:10', total: 42, compliant: 38, violations: 4 },
    { time: '10:15', total: 58, compliant: 52, violations: 6 },
    { time: '10:20', total: 51, compliant: 47, violations: 4 },
    { time: '10:25', total: 64, compliant: 57, violations: 7 },
    { time: '10:30', total: 72, compliant: 66, violations: 6 },
    { time: '10:35', total: 68, compliant: 61, violations: 7 },
    { time: '10:40', total: 55, compliant: 50, violations: 5 },
    { time: '10:45', total: 76, compliant: 71, violations: 5 },
    { time: '10:50', total: 63, compliant: 59, violations: 4 },
    { time: '10:55', total: 48, compliant: 45, violations: 3 },
  ];

  const maxVal = 80;

  return (
    <div className="neon-glass-panel rounded-2xl p-6 sm:p-7 border-2 border-[#00E5FF]/35 shadow-[0_0_30px_rgba(0,229,255,0.18)] relative overflow-hidden">
      {/* Background cyan glow flare */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-[#00E5FF]/10 blur-3xl pointer-events-none" />

      {/* Header, Quick KPI Summary & Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#00E5FF]/25">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#00E5FF]/20 border-2 border-[#00E5FF] text-[#00E5FF] shadow-neon-cyan flex-shrink-0">
            <Activity className="w-6 h-6 drop-shadow-[0_0_8px_#00E5FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-tech text-lg sm:text-xl font-black tracking-wider text-white uppercase text-glow-cyan">
                REAL-TIME TRAFFIC FLOW & COMPLIANCE
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00FF9C]/20 border border-[#00FF9C] text-[#00FF9C] shadow-neon-green">
                1-HR BUFFER
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
              5-minute telemetry intervals • Automated helmet classification & violation triage
            </p>
          </div>
        </div>

        {/* Real-time Summary Pills & Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono font-bold">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 bg-[#0A1A35]/80 px-3 py-1.5 rounded-lg border border-[#00E5FF]/40 text-[#00E5FF]">
            <TrendingUp className="w-4 h-4" />
            <span>PEAK: 76 BIKES/5-MIN</span>
          </div>

          <div className="flex items-center gap-2 bg-[#062419]/80 px-3 py-1.5 rounded-lg border border-[#00FF9C]/40 text-[#00FF9C]">
            <ShieldCheck className="w-4 h-4" />
            <span>92.2% COMPLIANT</span>
          </div>

          <div className="flex items-center gap-2 bg-[#2D0914]/80 px-3 py-1.5 rounded-lg border border-[#FF3158]/40 text-[#FF3158]">
            <AlertTriangle className="w-4 h-4" />
            <span>57 VIOLATIONS</span>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
              <span className="text-slate-200">Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#00FF9C] shadow-[0_0_8px_#00FF9C]" />
              <span className="text-slate-200">Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#FF3158] shadow-[0_0_8px_#FF3158]" />
              <span className="text-slate-200">Violation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart with Y-Axis and High Visibility Bars */}
      <div className="w-full flex gap-3">
        {/* Y-Axis Labels */}
        <div className="h-64 sm:h-72 flex flex-col justify-between items-end text-[11px] font-mono text-slate-400 pb-8 pr-1 flex-shrink-0 select-none">
          <span>80</span>
          <span>60</span>
          <span>40</span>
          <span>20</span>
          <span>0</span>
        </div>

        {/* Grid Bars Area */}
        <div className="h-64 sm:h-72 flex-1 flex flex-col justify-end">
          <div className="relative flex-1 w-full flex items-end justify-between gap-1.5 sm:gap-3 px-2 border-b-2 border-[#00E5FF]/40">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-25">
              <div className="w-full border-b border-dashed border-[#00E5FF]" />
              <div className="w-full border-b border-dashed border-[#00E5FF]" />
              <div className="w-full border-b border-dashed border-[#00E5FF]" />
              <div className="w-full border-b border-dashed border-[#00E5FF]" />
            </div>

            {intervals.map((item, idx) => {
              const totalHeight = (item.total / maxVal) * 100;
              const compliantHeight = (item.compliant / maxVal) * 100;
              const violationHeight = (item.violations / maxVal) * 100;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-16 bg-[#060B19]/95 border-2 border-[#00E5FF] text-white text-xs font-mono px-3 py-1.5 rounded-xl pointer-events-none transition-all z-30 whitespace-nowrap shadow-neon-cyan flex flex-col items-center">
                    <span className="font-bold text-[#00E5FF] text-xs">{item.time}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[#00E5FF]">{item.total} total</span>
                      <span className="text-[#00FF9C]">{item.compliant} safe</span>
                      <span className="text-[#FF3158] font-bold">{item.violations} viol.</span>
                    </div>
                  </div>

                  {/* Triple Bar Group with Neon Glow */}
                  <div className="w-full max-w-[42px] flex items-end justify-center gap-1 sm:gap-1.5 h-full pb-0.5">
                    {/* Total Traffic Bar */}
                    <div
                      className="w-1/3 bg-gradient-to-t from-[#0052CC] via-[#0099FF] to-[#00E5FF] rounded-t-sm shadow-[0_0_10px_rgba(0,229,255,0.5)] group-hover:brightness-125 transition-all relative"
                      style={{ height: `${totalHeight}%` }}
                    />
                    {/* Compliant Bar */}
                    <div
                      className="w-1/3 bg-gradient-to-t from-[#064E3B] via-[#059669] to-[#00FF9C] rounded-t-sm shadow-[0_0_10px_rgba(0,255,156,0.5)] group-hover:brightness-125 transition-all relative"
                      style={{ height: `${compliantHeight}%` }}
                    />
                    {/* Violation Bar */}
                    <div
                      className="w-1/3 bg-gradient-to-t from-[#7F1D1D] via-[#DC2626] to-[#FF3158] rounded-t-sm shadow-[0_0_10px_rgba(255,49,88,0.7)] group-hover:brightness-125 transition-all relative"
                      style={{ height: `${Math.max(violationHeight, 6)}%` }}
                    />
                  </div>

                  {/* Bottom Time Stamp */}
                  <span className="text-[10px] sm:text-xs font-mono text-slate-300 font-bold mt-2.5 tracking-tighter sm:tracking-normal group-hover:text-[#00E5FF] transition-colors">
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
