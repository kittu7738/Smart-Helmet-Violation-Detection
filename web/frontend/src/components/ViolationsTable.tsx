import React from 'react';
import { Clock, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { RecentViolation } from '../types/detection';

interface ViolationsTableProps {
  violations: RecentViolation[];
  compact?: boolean;
}

export const ViolationsTable: React.FC<ViolationsTableProps> = ({
  violations,
  compact = false
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Detected':
      case 'New':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            New
          </span>
        );
      case 'Logged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <CheckCircle2 className="w-3 h-3" />
            Logged
          </span>
        );
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldAlert className="w-3 h-3" />
            Reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className={`w-full ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* Desktop / Tablet Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-mono text-xs uppercase bg-slate-50/75">
              <th className="py-3 px-4 font-semibold">Time</th>
              <th className="py-3 px-4 font-semibold">Vehicle</th>
              <th className="py-3 px-4 font-semibold">Violation Type</th>
              <th className="py-3 px-4 font-semibold">Confidence</th>
              <th className="py-3 px-4 font-semibold">Location</th>
              <th className="py-3 px-4 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {violations.map((v) => (
              <tr
                key={v.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                <td className="py-3.5 px-4 text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{v.time}</span>
                </td>
                <td className="py-3.5 px-4 font-sans">
                  <div className="font-bold text-slate-900">
                    {v.vehicle}
                  </div>
                </td>
                <td className="py-3.5 px-4 font-sans">
                  <div className="font-semibold text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>{v.violation}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Role: <span className="text-slate-600 font-medium">{v.riderType}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-bold text-blue-600">
                    {v.confidence}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-sans">
                  {v.location}
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  {getStatusBadge(v.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {violations.map((v) => (
          <div
            key={v.id}
            className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-base">
                {v.vehicle}
              </span>
              {getStatusBadge(v.status)}
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-red-600 font-semibold">
                {v.violation}
              </span>
              <span className="text-blue-600 font-bold">{v.confidence}%</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100">
              <span>{v.location}</span>
              <span>{v.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
