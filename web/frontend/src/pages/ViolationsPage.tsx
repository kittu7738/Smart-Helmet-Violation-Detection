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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
            Helmet Violations Database
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Audit log of non-compliant motorcycle operators and pillion passengers.
          </p>
        </div>
        <button
          onClick={() => alert('Exporting violation audit report as CSV...')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Metrics Header Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Violations</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-red-600 font-mono">{totalViolations}</div>
          <span className="text-[11px] text-slate-400 font-medium">Matched current filter</span>
        </div>

        <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Driver Violations</span>
            <User className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">{driverViolations}</div>
          <span className="text-[11px] text-slate-400 font-medium">No helmet on driver</span>
        </div>

        <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Passenger Violations</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">{passengerViolations}</div>
          <span className="text-[11px] text-slate-400 font-medium">Pillion rider violation</span>
        </div>

        <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Audit Interval</span>
            <Calendar className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">Today</div>
          <span className="text-[11px] text-slate-400 font-medium">24h surveillance cycle</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by license plate, vehicle ID, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Rider Type Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={riderFilter}
              onChange={(e) => setRiderFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="DRIVER">Drivers Only</option>
              <option value="PASSENGER">Passengers Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
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
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-sm text-blue-600 font-medium">
            Loading database records...
          </div>
        ) : violations.length > 0 ? (
          <ViolationsTable violations={violations} compact={false} />
        ) : (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <ShieldAlert className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No violations match the specified criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};
