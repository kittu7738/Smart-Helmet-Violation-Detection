import React from 'react';
import { Activity } from 'lucide-react';

export const TrafficFlowChart: React.FC = () => {
  // 12 visible 5-minute intervals across the last 1 hour
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
    <div className="rounded-xl p-5 sm:p-6 bg-slate-900/80 border border-slate-800 shadow-md">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-tech text-base sm:text-lg font-bold tracking-wide text-white uppercase">
              Traffic Flow & Compliance (Last 1 Hour)
            </h3>
            <p className="text-xs text-slate-400">
              5-minute telemetry intervals comparing total traffic vs detected violations
            </p>
          </div>
        </div>

        {/* Clean Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
            <span className="text-slate-300">Total Traffic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-300">Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span className="text-slate-300">Violations</span>
          </div>
        </div>
      </div>

      {/* Bar Chart with Y-Axis */}
      <div className="w-full flex gap-3">
        {/* Y-Axis */}
        <div className="h-56 flex flex-col justify-between items-end text-[10px] font-mono text-slate-500 pb-6 pr-1 select-none">
          <span>80</span>
          <span>60</span>
          <span>40</span>
          <span>20</span>
          <span>0</span>
        </div>

        {/* Bars Container */}
        <div className="h-56 flex-1 flex flex-col justify-end">
          <div className="relative flex-1 w-full flex items-end justify-between gap-1 sm:gap-2 px-1 border-b border-slate-800">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="w-full border-b border-slate-700" />
              <div className="w-full border-b border-slate-700" />
              <div className="w-full border-b border-slate-700" />
              <div className="w-full border-b border-slate-700" />
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
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-slate-950 border border-slate-700 text-white text-[11px] font-mono px-2.5 py-1 rounded-md pointer-events-none transition-opacity z-20 whitespace-nowrap shadow-md flex flex-col items-center">
                    <span className="font-semibold text-sky-400">{item.time}</span>
                    <span className="text-slate-300">{item.total} total • <span className="text-red-400 font-medium">{item.violations} viol.</span></span>
                  </div>

                  {/* Clean Bar Group */}
                  <div className="w-full max-w-[28px] flex items-end justify-center gap-0.5 sm:gap-1 h-full pb-0.5">
                    {/* Total Bar */}
                    <div
                      className="w-1/3 bg-sky-500/80 hover:bg-sky-400 rounded-t-sm transition-colors"
                      style={{ height: `${totalHeight}%` }}
                    />
                    {/* Compliant Bar */}
                    <div
                      className="w-1/3 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-sm transition-colors"
                      style={{ height: `${compliantHeight}%` }}
                    />
                    {/* Violation Bar */}
                    <div
                      className="w-1/3 bg-red-500/80 hover:bg-red-400 rounded-t-sm transition-colors"
                      style={{ height: `${Math.max(violationHeight, 6)}%` }}
                    />
                  </div>

                  {/* Time Stamp */}
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-2">
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
