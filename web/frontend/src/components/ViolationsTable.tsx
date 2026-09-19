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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-violation">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            New
          </span>
        );
      case 'Logged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-warning">
            <CheckCircle2 className="w-3 h-3" />
            Logged
          </span>
        );
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-blue">
            <ShieldAlert className="w-3 h-3" />
            Reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs badge-neutral">
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
            <tr className="border-b border-gray-200 text-gray-500 font-mono text-xs uppercase bg-gray-50/75">
              <th className="py-3 px-4 font-semibold">Time</th>
              <th className="py-3 px-4 font-semibold">Vehicle</th>
              <th className="py-3 px-4 font-semibold">Violation Type</th>
              <th className="py-3 px-4 font-semibold">Confidence</th>
              <th className="py-3 px-4 font-semibold">Location</th>
              <th className="py-3 px-4 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {violations.map((v) => (
              <tr
                key={v.id}
                className="hover:bg-gray-50/80 transition-colors group cursor-default"
              >
                <td className="py-3 px-4 font-mono text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{v.time}</span>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                    {v.vehicle}
                  </span>
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    <span className="font-semibold text-gray-800">
                      {v.violation}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      ({v.riderType})
                    </span>
                  </div>
                </td>

                <td className="py-3 px-4 font-mono text-blue-600 font-bold">
                  {v.confidence}%
                </td>

                <td className="py-3 px-4 text-gray-500 text-xs">
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
            className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded text-xs border border-gray-200">
                {v.vehicle}
              </span>
              {getStatusBadge(v.status)}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-red-700 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
              <span>{v.violation} ({v.riderType})</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono pt-1 border-t border-gray-200/80">
              <span>{v.time}</span>
              <span className="text-blue-600 font-bold">{v.confidence}% Conf</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
