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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            New
          </span>
        );
      case 'Logged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Logged
          </span>
        );
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <ShieldAlert className="w-3 h-3" />
            Reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
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
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-xs uppercase bg-slate-950/60">
              <th className="py-3 px-4 font-semibold">Time</th>
              <th className="py-3 px-4 font-semibold">Vehicle</th>
              <th className="py-3 px-4 font-semibold">Violation Type</th>
              <th className="py-3 px-4 font-semibold">Confidence</th>
              <th className="py-3 px-4 font-semibold">Location</th>
              <th className="py-3 px-4 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {violations.map((v) => (
              <tr
                key={v.id}
                className="hover:bg-slate-800/40 transition-colors group cursor-default"
              >
                <td className="py-3 px-4 font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{v.time}</span>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-white bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60">
                    {v.vehicle}
                  </span>
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="font-medium text-slate-200">
                      {v.violation}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({v.riderType})
                    </span>
                  </div>
                </td>

                <td className="py-3 px-4 font-mono text-blue-400 font-semibold">
                  {v.confidence}%
                </td>

                <td className="py-3 px-4 text-slate-400 text-xs">
                  {v.location}
                </td>

                <td className="py-3 px-4 text-right">
                  {getStatusBadge(v.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="sm:hidden space-y-3">
        {violations.map((v) => (
          <div
            key={v.id}
            className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">
                {v.vehicle}
              </span>
              {getStatusBadge(v.status)}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{v.violation} ({v.riderType})</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
              <span>{v.time}</span>
              <span className="text-blue-400 font-bold">{v.confidence}% Conf</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
