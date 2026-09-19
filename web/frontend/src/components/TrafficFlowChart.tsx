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
    <div className="rounded-xl p-5 sm:p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-lg flex flex-col justify-between h-full">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
              TRAFFIC FLOW & COMPLIANCE
            </h3>
            <p className="text-xs text-slate-400">
              5-minute intervals (Last 1 hour) • Total volume vs helmet infractions
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="text-slate-300">Total Traffic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-300">Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span className="text-slate-300">Violations</span>
          </div>
        </div>
      </div>

      {/* Bar Chart with Y-Axis */}
      <div className="w-full flex gap-3">
        {/* Y-Axis */}
        <div className="flex flex-col justify-between text-[11px] font-mono text-slate-500 pb-6 pr-1 border-r border-slate-800">
          <span>80</span>
          <span>60</span>
          <span>40</span>
          <span>20</span>
          <span>0</span>
        </div>

        {/* Bars Container */}
        <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-3 h-52 pb-6 border-b border-slate-800 relative">
          {/* Subtle grid lines */}
          <div className="absolute inset-x-0 top-0 border-b border-slate-800/60 pointer-events-none" />
          <div className="absolute inset-x-0 top-1/4 border-b border-slate-800/60 pointer-events-none" />
          <div className="absolute inset-x-0 top-2/4 border-b border-slate-800/60 pointer-events-none" />
          <div className="absolute inset-x-0 top-3/4 border-b border-slate-800/60 pointer-events-none" />

          {intervals.map((item, idx) => {
            const totalHeight = (item.total / maxVal) * 100;
            const compliantHeight = (item.compliant / maxVal) * 100;
            const violationHeight = (item.violations / maxVal) * 100;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                {/* Tooltip on hover */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] font-mono py-1 px-2 rounded-md shadow-xl border border-slate-800 pointer-events-none whitespace-nowrap z-20">
                  <div className="text-blue-400 font-bold">{item.time}</div>
                  <div>Total: {item.total} | Violations: {item.violations}</div>
                </div>

                {/* Triple bar group */}
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                  {/* Total Bar */}
                  <div
                    className="w-1/3 max-w-[8px] bg-blue-500/80 rounded-t-sm group-hover:bg-blue-400 transition-colors"
                    style={{ height: `${totalHeight}%` }}
                  />
                  {/* Compliant Bar */}
                  <div
                    className="w-1/3 max-w-[8px] bg-emerald-500/80 rounded-t-sm group-hover:bg-emerald-400 transition-colors"
                    style={{ height: `${compliantHeight}%` }}
                  />
                  {/* Violation Bar */}
                  <div
                    className="w-1/3 max-w-[8px] bg-rose-500 rounded-t-sm group-hover:bg-rose-400 transition-colors"
                    style={{ height: `${violationHeight}%` }}
                  />
                </div>

                {/* X-Axis Label */}
                <span className="text-[10px] font-mono text-slate-500 mt-2 truncate">
                  {idx % 2 === 0 ? item.time : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
