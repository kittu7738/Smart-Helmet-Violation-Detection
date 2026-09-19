import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ViolationTypesCard: React.FC = () => {
  const types = [
    { name: 'Driver Without Helmet', count: 11, percentage: 65, color: '#EF4444', bg: 'bg-red-500' },
    { name: 'Passenger Without Helmet', count: 4, percentage: 24, color: '#F59E0B', bg: 'bg-amber-500' },
    { name: 'Overcrowding / Tripling', count: 2, percentage: 11, color: '#2563EB', bg: 'bg-blue-500' },
  ];

  return (
    <div className="light-card p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-gray-900 uppercase">
                VIOLATION TYPES
              </h3>
              <p className="text-xs text-gray-500">Distribution by infraction category</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
            17 Logged
          </span>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex mb-5">
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
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-gray-700 font-medium">{t.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-gray-900 font-bold">{t.count}</span>
                <span className="text-gray-400 text-[11px]">({t.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100 text-xs text-gray-500">
        AI City Challenge rule: Both driver and pillion must wear standard helmets.
      </div>
    </div>
  );
};
