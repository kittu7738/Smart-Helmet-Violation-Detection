import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ViolationTypesCard: React.FC = () => {
  const types = [
    { name: 'No Helmet — Driver', count: 11, percentage: 65, color: '#DC2626', bg: 'bg-red-600' },
    { name: 'No Helmet — Passenger', count: 4, percentage: 24, color: '#F59E0B', bg: 'bg-amber-500' },
    { name: 'Triple Riding', count: 2, percentage: 11, color: '#2563EB', bg: 'bg-blue-600' },
  ];

  return (
    <div className="rounded-xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase">
                VIOLATION TYPES
              </h3>
              <p className="text-xs text-slate-500">Distribution by infraction category</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            17 Total
          </span>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex mb-5">
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
                <span className="text-slate-700 font-medium">{t.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-900 font-bold">{t.count}</span>
                <span className="text-slate-400 text-[11px]">({t.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between font-mono">
        <span>Model: Co-DETR Dual-Head</span>
        <span className="text-blue-600 font-semibold">94.8% Mean Acc.</span>
      </div>
    </div>
  );
};
