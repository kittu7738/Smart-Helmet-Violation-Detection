import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ViolationTypesCard: React.FC = () => {
  const types = [
    { name: 'Driver Without Helmet', count: 11, percentage: 65, color: '#EF4444', bg: 'bg-rose-500' },
    { name: 'Passenger Without Helmet', count: 4, percentage: 24, color: '#F59E0B', bg: 'bg-amber-500' },
    { name: 'Unhelmeted Overcrowding', count: 2, percentage: 11, color: '#3B82F6', bg: 'bg-blue-500' },
  ];

  return (
    <div className="rounded-xl p-5 sm:p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-lg flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
                VIOLATION TYPES
              </h3>
              <p className="text-xs text-slate-400">Distribution by infraction category</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            17 Total
          </span>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex mb-5">
          {types.map((t, idx) => (
            <div
              key={idx}
              className={`${t.bg} h-full transition-all`}
              style={{ width: `${t.percentage}%` }}
              title={`${t.name}: ${t.count} (${t.percentage}%)`}
            />
          ))}
        </div>

        {/* Breakdown List */}
        <div className="space-y-3">
          {types.map((t, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-slate-300 font-medium">{t.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-white font-bold">{t.count}</span>
                <span className="text-slate-500 text-[11px]">({t.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-800/80 text-xs text-slate-500">
        AI City Challenge rule: All riders on motorcycle must wear helmet.
      </div>
    </div>
  );
};
