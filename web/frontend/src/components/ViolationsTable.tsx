import React from 'react';
import { Clock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-rose-950/60 text-rose-300 border border-rose-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            Detected
          </span>
        );
      case 'Logged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/60 text-amber-300 border border-amber-500/40">
            <CheckCircle2 className="w-3 h-3 text-amber-400" />
            Logged
          </span>
        );
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/60 text-blue-300 border border-blue-500/40">
            <ShieldAlert className="w-3 h-3 text-blue-400" />
            Reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full">
      {/* Desktop / Tablet Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3">Time</th>
              <th className="py-3 px-3">Vehicle</th>
              <th className="py-3 px-3">Violation</th>
              <th className="py-3 px-3">Confidence</th>
              <th className="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {violations.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-900/50 transition-colors duration-150"
              >
                <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.time}</span>
                  </div>
                </td>
                <td className="py-3 px-3 font-medium text-slate-200 whitespace-nowrap">
                  <span className="text-cyan-400 font-mono">{item.vehicle}</span>
                  {!compact && item.location && (
                    <div className="text-[10px] text-slate-500 font-normal">
                      {item.location}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="font-medium text-rose-300">{item.violation}</span>
                  </div>
                </td>
                <td className="py-3 px-3 font-mono text-cyan-300 font-semibold whitespace-nowrap">
                  {item.confidence}%
                </td>
                <td className="py-3 px-3 text-right whitespace-nowrap">
                  {getStatusBadge(item.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack */}
      <div className="sm:hidden space-y-2.5">
        {violations.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-400 font-mono font-semibold">{item.vehicle}</span>
              <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.time}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-300 font-medium">{item.violation}</span>
              <span className="text-cyan-300 font-mono font-bold">{item.confidence}%</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-500 truncate max-w-[180px]">{item.location}</span>
              {getStatusBadge(item.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
