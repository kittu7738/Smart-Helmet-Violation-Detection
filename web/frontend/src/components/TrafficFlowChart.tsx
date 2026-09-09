import React from 'react';
import { Activity } from 'lucide-react';

export const TrafficFlowChart: React.FC = () => {
  // 12 5-minute intervals across the last 1 hour
  const intervals = [
    { time: '10:00', total: 24, compliant: 22, violations: 2 },
    { time: '10:05', total: 32, compliant: 30, violations: 2 },
    { time: '10:10', total: 28, compliant: 25, violations: 3 },
    { time: '10:15', total: 45, compliant: 41, violations: 4 },
    { time: '10:20', total: 38, compliant: 36, violations: 2 },
    { time: '10:25', total: 42, compliant: 37, violations: 5 },
    { time: '10:30', total: 50, compliant: 47, violations: 3 },
    { time: '10:35', total: 46, compliant: 41, violations: 5 },
    { time: '10:40', total: 39, compliant: 35, violations: 4 },
    { time: '10:45', total: 54, compliant: 50, violations: 4 },
    { time: '10:50', total: 48, compliant: 45, violations: 3 },
    { time: '10:55', total: 36, compliant: 34, violations: 2 },
  ];

  const maxVal = 60;

  return (
    <div className="neon-glass-panel rounded-2xl p-5 sm:p-6 border-2 border-[#00E5FF]/30 shadow-[0_0_25px_rgba(0,229,255,0.12)]">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-[#00E5FF]/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/40 text-[#00E5FF]">
            <Activity className="w-5 h-5 drop-shadow-[0_0_6px_#00E5FF]" />
          </div>
          <div>
            <h3 className="font-tech text-base sm:text-lg font-bold tracking-wider text-white uppercase text-glow-cyan">
              TRAFFIC FLOW (Last 1 Hour)
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Real-time throughput: Helmet compliant motorcycles vs detected violations
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#00E5FF] shadow-neon-cyan" />
            <span className="text-[#00E5FF]">Total Traffic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#00FF9C] shadow-neon-green" />
            <span className="text-[#00FF9C]">Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#FF3158] shadow-neon-red" />
            <span className="text-[#FF3158]">Violations</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-56 w-full flex flex-col justify-end">
        {/* Grid Bars Area */}
        <div className="relative flex-1 w-full flex items-end justify-between gap-2 sm:gap-3 px-1 sm:px-2 border-b-2 border-[#00E5FF]/30">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
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
                <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-[#060B19]/95 border-2 border-[#00E5FF] text-white text-[11px] font-mono px-2.5 py-1 rounded-lg pointer-events-none transition-all z-20 whitespace-nowrap shadow-neon-cyan flex flex-col items-center">
                  <span className="font-bold text-[#00E5FF]">{item.time}</span>
                  <span>{item.total} bikes • <span className="text-[#FF3158] font-bold">{item.violations} viol.</span></span>
                </div>

                {/* Triple bar group */}
                <div className="w-full max-w-[28px] flex items-end justify-center gap-0.5 sm:gap-1">
                  {/* Total Traffic Bar */}
                  <div
                    className="w-1/3 bg-gradient-to-t from-[#006CFF] via-[#1687FF] to-[#00E5FF] rounded-t-sm shadow-[0_0_8px_rgba(0,229,255,0.4)] group-hover:brightness-125 transition-all"
                    style={{ height: `${totalHeight}%` }}
                  />
                  {/* Compliant Bar */}
                  <div
                    className="w-1/3 bg-gradient-to-t from-[#0A3827] via-[#00FF9C]/80 to-[#00FF9C] rounded-t-sm shadow-[0_0_8px_rgba(0,255,156,0.4)] group-hover:brightness-125 transition-all"
                    style={{ height: `${compliantHeight}%` }}
                  />
                  {/* Violation Bar */}
                  <div
                    className="w-1/3 bg-gradient-to-t from-[#451020] via-[#FF3158]/90 to-[#FF3158] rounded-t-sm shadow-[0_0_8px_rgba(255,49,88,0.5)] group-hover:brightness-125 transition-all"
                    style={{ height: `${violationHeight}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis Time Labels */}
        <div className="flex justify-between text-[11px] font-mono font-bold text-slate-300 pt-3 px-1">
          {intervals.map((item, idx) => (
            <span key={idx} className={idx % 2 === 0 ? 'inline' : 'hidden sm:inline'}>
              {item.time}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
