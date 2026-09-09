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
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Detected
          </span>
        );
      case 'Logged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Logged
          </span>
        );
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <ShieldAlert className="w-3 h-3" />
            Reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300">
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
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-xs uppercase">
              <th className="py-3 px-4 font-semibold">Time</th>
              <th className="py-3 px-4 font-semibold">Vehicle</th>
              <th className="py-3 px-4 font-semibold">Violation</th>
              <th className="py-3 px-4 font-semibold">Confidence</th>
              <th className="py-3 px-4 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {violations.map((v) => (
              <tr
                key={v.id}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                <td className="py-3 px-4 text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{v.time}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="font-tech font-bold text-white text-sm">
                    {v.vehicle}
                  </div>
                  <div className="text-[11px] text-slate-400">{v.location}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>{v.violation}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Role: <span className="text-slate-300">{v.riderType}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-sky-400">
                    {v.confidence}%
                  </span>
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
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
            className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-tech font-bold text-white text-base">
                {v.vehicle}
              </span>
              {getStatusBadge(v.status)}
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-red-400 font-medium">
                {v.violation}
              </span>
              <span className="text-sky-400 font-semibold">{v.confidence}%</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
              <span>{v.location}</span>
              <span>{v.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
