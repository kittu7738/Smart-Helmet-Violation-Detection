import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  User,
  Users,
  ShieldAlert,
  Download,
  Calendar
} from 'lucide-react';
import { ViolationsTable } from '../components/ViolationsTable';
import { RecentViolation } from '../types/detection';
import { api } from '../services/api';

export const ViolationsPage: React.FC = () => {
  const [violations, setViolations] = useState<RecentViolation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [riderFilter, setRiderFilter] = useState<'ALL' | 'DRIVER' | 'PASSENGER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Detected' | 'Logged' | 'Reviewed'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadViolations();
  }, [searchQuery, riderFilter, statusFilter]);

  const loadViolations = async () => {
    setLoading(true);
    try {
      const res = await api.getViolations({
        search: searchQuery,
        type: riderFilter,
        status: statusFilter
      });
      setViolations(res.violations);
    } catch (err) {
      console.error('Failed to load violations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics derived from list
  const totalViolations = violations.length;
  const driverViolations = violations.filter((v) => v.riderType === 'DRIVER').length;
  const passengerViolations = violations.filter((v) => v.riderType === 'PASSENGER').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="font-tech text-2xl font-bold tracking-wider text-slate-100 uppercase">
            Helmet Violations Database
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time audit log of non-compliant motorcycle operators and pillion passengers.
          </p>
        </div>
        <button
          onClick={() => alert('Exporting violation audit report as CSV...')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-mono text-slate-200 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>EXPORT CSV</span>
        </button>
      </div>

      {/* Metrics Header Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Total Violations</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-tech text-rose-400">{totalViolations}</div>
          <span className="text-[10px] text-slate-500 font-mono">Matched current filter</span>
        </div>

        <div className="glass-card rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Driver Violations</span>
            <User className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-tech text-amber-400">{driverViolations}</div>
          <span className="text-[10px] text-slate-500 font-mono">No helmet on driver</span>
        </div>

        <div className="glass-card rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Passenger Violations</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-tech text-cyan-300">{passengerViolations}</div>
          <span className="text-[10px] text-slate-500 font-mono">Pillion rider without helmet</span>
        </div>

        <div className="glass-card rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Audit Interval</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-tech text-slate-200">TODAY</div>
          <span className="text-[10px] text-slate-500 font-mono">Continuous 24h cycle</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-xl p-4 border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by license plate, vehicle ID, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Rider Type Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={riderFilter}
              onChange={(e) => setRiderFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All Roles</option>
              <option value="DRIVER">Drivers Only</option>
              <option value="PASSENGER">Passengers Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="Detected">Detected</option>
              <option value="Logged">Logged</option>
              <option value="Reviewed">Reviewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Violations List / Table Container */}
      <div className="glass-panel rounded-xl p-5 border-slate-800">
        {loading ? (
          <div className="text-center py-12 font-mono text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block mr-2" />
            Scanning database records...
          </div>
        ) : violations.length > 0 ? (
          <ViolationsTable violations={violations} compact={false} />
        ) : (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <ShieldAlert className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-mono">No violations match the specified criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};
