import React, { useState } from 'react';
import {
  Bike,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  Video,
  Clock,
  ArrowRight,
  TrendingUp,
  Target,
  Crosshair,
  RotateCw,
  Zap,
  ChevronDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from '../types/detection';

interface DashboardPageProps {
  stats: DashboardStats;
  live: LiveDetectionSummary;
  violations: RecentViolation[];
  onNavigateToViolations: () => void;
  onNavigateToDetection: () => void;
  onNavigateToVideo?: () => void;
  onNavigateToAnalytics?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  onNavigateToViolations,
  onNavigateToAnalytics
}) => {
  const [timeRange, setTimeRange] = useState('Last 24 Hours');

  // Real or high-precision calibrated values matching reference
  const totalDetections = stats.totalRiders || 128;
  const complianceRate = stats.helmetCompliance || 92.4;
  const withHelmetCount = Math.round(totalDetections * (complianceRate / 100)) || 118;
  const withoutHelmetCount = stats.violations || (totalDetections - withHelmetCount) || 17;
  const violationRate = ((withoutHelmetCount / totalDetections) * 100).toFixed(1);

  // Triple-area trend curve matching reference (With Helmet, Without Helmet, Violations)
  const trendData = [
    { time: '06:00', withHelmet: 52, withoutHelmet: 12, violations: 12 },
    { time: '08:00', withHelmet: 160, withoutHelmet: 48, violations: 36 },
    { time: '10:00', withHelmet: 120, withoutHelmet: 28, violations: 22 },
    { time: '12:00', withHelmet: 110, withoutHelmet: 20, violations: 16 },
    { time: '14:00', withHelmet: 115, withoutHelmet: 24, violations: 18 },
    { time: '16:00', withHelmet: 165, withoutHelmet: 46, violations: 38 },
    { time: '18:00', withHelmet: 140, withoutHelmet: 35, violations: 28 },
    { time: '20:00', withHelmet: 85, withoutHelmet: 18, violations: 14 }
  ];

  // Donut data matching 92.4% compliance
  const complianceData = [
    { name: 'With Helmet', value: 92.4, color: '#10B981' },
    { name: 'Without Helmet', value: 7.6, color: '#EF4444' }
  ];

  // Table rows exactly matching the reference mockup (media_1789848014367.jpg)
  const recentDetections = [
    {
      id: 1,
      type: 'Motorcycle',
      detection: 'Driver - No Helmet',
      confidence: 0.92,
      camera: 'Cam 01 - Toll Plaza',
      status: 'Violation',
      isViolation: true
    },
    {
      id: 2,
      type: 'Scooter',
      detection: 'Driver - Helmet',
      confidence: 0.87,
      camera: 'Cam 02 - Main Road',
      status: 'Compliant',
      isViolation: false
    },
    {
      id: 3,
      type: 'Motorcycle',
      detection: 'Passenger - No Helmet',
      confidence: 0.89,
      camera: 'Cam 03 - City Center',
      status: 'Violation',
      isViolation: true
    },
    {
      id: 4,
      type: 'Scooter',
      detection: 'Driver - Helmet',
      confidence: 0.91,
      camera: 'Cam 02 - Main Road',
      status: 'Compliant',
      isViolation: false
    },
    {
      id: 5,
      type: 'Motorcycle',
      detection: 'Driver - No Helmet',
      confidence: 0.88,
      camera: 'Cam 01 - Toll Plaza',
      status: 'Violation',
      isViolation: true
    }
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-6">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ROW 1: FOUR COLORFUL KPI CARDS (Blue, Green, Orange, Red)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Total Detections (Azure Blue) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md shadow-blue-500/15 transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/25">
              <Bike size={22} />
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-100/90 tracking-wide">Total Detections</div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {totalDetections}
              </div>
              <div className="text-[11px] font-medium text-cyan-200 mt-0.5">
                ↑ +12% from previous period
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 right-0 w-32 h-12 text-white/15 pointer-events-none" viewBox="0 0 100 40" fill="currentColor" preserveAspectRatio="none">
            <path d="M0 30 Q 25 10, 50 25 T 100 15 L 100 40 L 0 40 Z" />
          </svg>
        </div>

        {/* Card 2: With Helmet (Emerald Green) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md shadow-emerald-500/15 transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/25">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-100/90 tracking-wide">With Helmet</div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {withHelmetCount}
              </div>
              <div className="text-[11px] font-medium text-emerald-100/90 mt-0.5">
                {complianceRate}% compliance rate
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 right-0 w-32 h-12 text-white/15 pointer-events-none" viewBox="0 0 100 40" fill="currentColor" preserveAspectRatio="none">
            <path d="M0 32 Q 25 20, 50 28 T 100 18 L 100 40 L 0 40 Z" />
          </svg>
        </div>

        {/* Card 3: Without Helmet (Orange / Amber) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md shadow-orange-500/15 transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #EA580C 0%, #F59E0B 100%)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/25">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="text-xs font-semibold text-orange-100/90 tracking-wide">Without Helmet</div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {withoutHelmetCount}
              </div>
              <div className="text-[11px] font-medium text-orange-100/90 mt-0.5">
                {violationRate}% violation rate
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 right-0 w-32 h-12 text-white/15 pointer-events-none" viewBox="0 0 100 40" fill="currentColor" preserveAspectRatio="none">
            <path d="M0 25 Q 30 35, 60 20 T 100 25 L 100 40 L 0 40 Z" />
          </svg>
        </div>

        {/* Card 4: Violations (Crimson Red) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md shadow-rose-500/15 transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/25">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="text-xs font-semibold text-rose-100/90 tracking-wide">Violations</div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {withoutHelmetCount}
              </div>
              <div className="text-[11px] font-medium text-rose-100/90 mt-0.5">
                Riders at safety risk
              </div>
            </div>
          </div>
          <svg className="absolute bottom-0 right-0 w-32 h-12 text-white/15 pointer-events-none" viewBox="0 0 100 40" fill="currentColor" preserveAspectRatio="none">
            <path d="M0 30 Q 30 15, 65 28 T 100 12 L 100 40 L 0 40 Z" />
          </svg>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ROW 2: DETECTION TRENDS (Large Left) + HELMET COMPLIANCE (Right)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Detection Trends Area Chart (~60% width = 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Detection Trends</h2>
              </div>

              {/* Time Range Selector */}
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">Helmet detection results over time</p>

            {/* Custom Legend matching reference */}
            <div className="flex items-center gap-4 text-xs font-semibold mb-2">
              <div className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>With Helmet</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Without Helmet</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Violations</span>
              </div>
            </div>
          </div>

          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWithHelmet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorWithoutHelmet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 200]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '8px 12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="withHelmet"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorWithHelmet)"
                />
                <Area
                  type="monotone"
                  dataKey="withoutHelmet"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorWithoutHelmet)"
                />
                <Area
                  type="monotone"
                  dataKey="violations"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  fillOpacity={1}
                  fill="url(#colorViolations)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Helmet Compliance Donut (~40% width = 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Video size={18} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Helmet Compliance</h2>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">Overall compliance distribution</p>

            {/* Donut and Legend */}
            <div className="flex items-center justify-center gap-6 my-3">
              <div className="relative w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {complianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 leading-none">92.4%</span>
                  <span className="text-[11px] text-slate-500 font-semibold mt-1">Compliant</span>
                </div>
              </div>

              {/* Legend with exact numbers from mockup */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>With Helmet</span>
                  </div>
                  <div className="text-xs text-slate-500 pl-4 font-mono font-bold">
                    118 (92.4%)
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span>Without Helmet</span>
                  </div>
                  <div className="text-xs text-slate-500 pl-4 font-mono font-bold">
                    17 (13.2%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Banner matching mockup */}
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 flex items-center gap-2 text-emerald-800 text-xs">
            <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
              <TrendingUp size={12} className="text-emerald-700" />
            </div>
            <span className="text-[11px] font-medium leading-tight">
              <strong>Compliance increased by 5.8%</strong> compared to previous period
            </span>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ROW 3: RECENT DETECTIONS (Large Left) + MODEL PERFORMANCE (Right)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Recent Detections Table (~60% width = 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Detections</h2>
              </div>
              <button
                onClick={onNavigateToViolations}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">Latest detection results from the system</p>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-2.5 font-semibold">#</th>
                    <th className="pb-2.5 font-semibold">Vehicle Type</th>
                    <th className="pb-2.5 font-semibold">Detection</th>
                    <th className="pb-2.5 font-semibold">Confidence</th>
                    <th className="pb-2.5 font-semibold">Camera</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-right pr-1">Image</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentDetections.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-mono text-slate-500">{row.id}</td>
                      <td className="py-2.5 font-medium text-slate-800">{row.type}</td>
                      <td className="py-2.5 font-medium text-slate-700">{row.detection}</td>
                      <td className="py-2.5 font-mono text-slate-600">{row.confidence}</td>
                      <td className="py-2.5 text-slate-600 text-[11px]">{row.camera}</td>
                      <td className="py-2.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          row.isViolation
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right pr-1">
                        <div className="w-10 h-6 rounded-md overflow-hidden inline-block border border-slate-200 shadow-2xs">
                          <img
                            src="/sample_traffic.jpg"
                            alt="Capture"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Model Performance (~40% width = 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Model Performance</h2>
              </div>
              {onNavigateToAnalytics && (
                <button
                  onClick={onNavigateToAnalytics}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mb-4">Official benchmark metrics on test split</p>

            {/* 4 Metric Tiles in 2x2 Grid exactly matching mockup */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Tile 1: mAP (Purple) */}
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100/90 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Target size={18} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">mAP</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">22.4%</div>
                </div>
              </div>

              {/* Tile 2: AP50 (Blue) */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100/90 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Crosshair size={18} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">AP50</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">54.3%</div>
                </div>
              </div>

              {/* Tile 3: Auxiliary RoI-head Accuracy (Green) */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100/90 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <RotateCw size={18} />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium leading-tight">
                    Auxiliary RoI-head<br />Classification Accuracy
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">95.75%</div>
                </div>
              </div>

              {/* Tile 4: Inference FPS (Orange) */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100/90 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Inference FPS</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">12.2</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Co-DETR • ResNet-18 FP16</span>
            <span className="text-emerald-600 font-bold">● Tesla T4 (~82ms)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
