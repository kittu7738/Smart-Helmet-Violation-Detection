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

  const totalViolations = violations.length;
  const driverViolations = violations.filter((v) => v.riderType === 'DRIVER').length;
  const passengerViolations = violations.filter((v) => v.riderType === 'PASSENGER').length;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-[#00E5FF]/20">
        <div>
          <h1 className="font-tech text-2xl sm:text-3xl font-black tracking-wider text-white uppercase text-glow-cyan">
            Helmet Violations Database
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Real-time audit log of non-compliant motorcycle operators and pillion passengers.
          </p>
        </div>
        <button
          onClick={() => alert('Exporting violation audit report as CSV...')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#006CFF] text-white font-mono font-black text-xs shadow-neon-cyan hover:shadow-neon-cyan-lg hover:scale-105 transition-all self-start sm:self-auto border border-[#00E5FF]"
        >
          <Download className="w-4 h-4 text-white" />
          <span>EXPORT CSV</span>
        </button>
      </div>

      {/* Metrics Header Summary (4 Vibrant Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="neon-glass-card rounded-2xl p-5 border-2 border-[#FF3158] shadow-neon-red">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">Total Violations</span>
            <AlertTriangle className="w-5 h-5 text-[#FF3158] drop-shadow-[0_0_6px_#FF3158]" />
          </div>
          <div className="text-3xl font-black font-tech text-[#FF3158] text-glow-red">{totalViolations}</div>
          <span className="text-[11px] text-slate-300 font-mono font-semibold">Matched current filter</span>
        </div>

        <div className="neon-glass-card rounded-2xl p-5 border-2 border-[#FFD400] shadow-neon-amber">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">Driver Violations</span>
            <User className="w-5 h-5 text-[#FFD400] drop-shadow-[0_0_6px_#FFD400]" />
          </div>
          <div className="text-3xl font-black font-tech text-[#FFD400] drop-shadow-[0_0_8px_#FFD400]">{driverViolations}</div>
          <span className="text-[11px] text-slate-300 font-mono font-semibold">No helmet on driver</span>
        </div>

        <div className="neon-glass-card rounded-2xl p-5 border-2 border-[#00E5FF] shadow-neon-cyan">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">Passenger Violations</span>
            <Users className="w-5 h-5 text-[#00E5FF] drop-shadow-[0_0_6px_#00E5FF]" />
          </div>
          <div className="text-3xl font-black font-tech text-[#00E5FF] text-glow-cyan">{passengerViolations}</div>
          <span className="text-[11px] text-slate-300 font-mono font-semibold">Pillion rider violation</span>
        </div>

        <div className="neon-glass-card rounded-2xl p-5 border-2 border-[#00FF9C] shadow-neon-green">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">Audit Interval</span>
            <Calendar className="w-5 h-5 text-[#00FF9C] drop-shadow-[0_0_6px_#00FF9C]" />
          </div>
          <div className="text-2xl font-black font-tech text-[#00FF9C] text-glow-green">TODAY</div>
          <span className="text-[11px] text-slate-300 font-mono font-semibold">24h surveillance cycle</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neon-glass-panel rounded-2xl p-4 sm:p-5 border-2 border-[#00E5FF]/30 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row gap-3.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#00E5FF]" />
            <input
              type="text"
              placeholder="Search by license plate, vehicle ID, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#060D1F] border-2 border-[#00E5FF]/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00E5FF] focus:shadow-neon-cyan transition-all font-mono font-medium"
            />
          </div>

          {/* Rider Type Selector */}
          <div className="flex items-center gap-2.5">
            <Filter className="w-4 h-4 text-[#00E5FF]" />
            <select
              value={riderFilter}
              onChange={(e) => setRiderFilter(e.target.value as any)}
              className="bg-[#060D1F] border-2 border-[#00E5FF]/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-[#00E5FF] shadow-sm cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="DRIVER">Drivers Only</option>
              <option value="PASSENGER">Passengers Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#060D1F] border-2 border-[#00E5FF]/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono font-bold focus:outline-none focus:border-[#00E5FF] shadow-sm cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Detected">Detected</option>
              <option value="Logged">Logged</option>
              <option value="Reviewed">Reviewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Violations List Container */}
      <div className="neon-glass-panel rounded-2xl p-6 border-2 border-[#00E5FF]/30 shadow-[0_0_30px_rgba(0,229,255,0.12)]">
        {loading ? (
          <div className="text-center py-12 font-mono text-sm text-[#00E5FF] font-bold">
            <span className="w-3 h-3 rounded-full bg-[#00E5FF] animate-ping inline-block mr-2" />
            Scanning database records...
          </div>
        ) : violations.length > 0 ? (
          <ViolationsTable violations={violations} compact={false} />
        ) : (
          <div className="text-center py-12 text-slate-400 space-y-3">
            <ShieldAlert className="w-10 h-10 mx-auto text-[#00E5FF]/40" />
            <p className="text-sm font-mono font-bold text-white">No violations match the specified criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};
