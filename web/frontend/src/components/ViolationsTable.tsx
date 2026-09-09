import React from 'react';
import { Clock, AlertCircle, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#FF3158]/20 text-[#FF3158] border border-[#FF3158] shadow-neon-red">
            <span className="w-2 h-2 rounded-full bg-[#FF3158] animate-ping" />
            Detected
          </span>
        );
      case 'Logged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#FFD400]/20 text-[#FFD400] border border-[#FFD400] shadow-neon-amber">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Logged
          </span>
        );
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#1687FF]/20 text-[#1687FF] border border-[#1687FF] shadow-neon-blue">
            <ShieldAlert className="w-3.5 h-3.5" />
            Reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
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
            <tr className="border-b-2 border-[#00E5FF]/20 text-slate-300 font-mono text-xs uppercase tracking-wider">
              <th className="py-3.5 px-4 font-bold">Time</th>
              <th className="py-3.5 px-4 font-bold">Vehicle</th>
              <th className="py-3.5 px-4 font-bold">Violation</th>
              <th className="py-3.5 px-4 font-bold">Confidence</th>
              <th className="py-3.5 px-4 text-right font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {violations.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-[#0A1632]/80 transition-colors duration-150 group"
              >
                <td className="py-3.5 px-4 font-mono text-slate-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#00E5FF]" />
                    <span className="font-semibold">{item.time}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                  <span className="text-white font-bold font-mono text-sm tracking-wide">
                    {item.vehicle}
                  </span>
                  {!compact && item.location && (
                    <div className="text-[11px] text-[#00E5FF] font-normal mt-0.5">
                      {item.location}
                    </div>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#FF3158] flex-shrink-0 drop-shadow-[0_0_6px_#FF3158]" />
                    <span className="font-bold text-[#FF3158] text-glow-red text-sm">
                      {item.violation}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-[#00E5FF] font-black text-sm whitespace-nowrap text-glow-cyan">
                  {item.confidence}%
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  {getStatusBadge(item.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack */}
      <div className="sm:hidden space-y-3">
        {violations.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-gradient-to-r from-[#200812] to-[#12061A] border-2 border-[#FF3158]/60 shadow-neon-red space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-white font-mono font-black text-sm">{item.vehicle}</span>
              <span className="text-[#00E5FF] font-mono text-xs font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {item.time}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#FF3158] font-bold text-sm text-glow-red flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {item.violation}
              </span>
              <span className="text-[#00E5FF] font-mono font-black text-sm text-glow-cyan">
                {item.confidence}%
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span className="text-slate-300 truncate max-w-[180px] font-medium">{item.location}</span>
              {getStatusBadge(item.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
