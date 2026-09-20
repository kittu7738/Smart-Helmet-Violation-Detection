import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  PieChart as PieIcon,
  Clock,
  ArrowRight,
  Target,
  Crosshair,
  RotateCw,
  TrendingUp,
  Info,
  Calendar,
  ChevronDown,
  Check,
  Image as ImageIcon,
  Video as VideoIcon
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

// Custom Helmet Outline SVG Icon matching the visual reference
const HelmetSvg: React.FC<{ className?: string; size?: number }> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2a9 9 0 0 0-9 9c0 3.5 1.5 6.5 4 8v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1c2.5-1.5 4-4.5 4-8a9 9 0 0 0-9-9z" />
    <path d="M4 11h16" />
    <path d="M12 2v9" />
    <path d="M7 16a3 3 0 0 0 5 0" />
  </svg>
);

// Motorcycle SVG Icon
const MotorcycleSvg: React.FC<{ className?: string; size?: number }> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5l3-7.5h3.5" />
    <path d="M9 17.5l2-5h4" />
    <path d="M5.5 17.5l3.5-9h3" />
  </svg>
);

interface DashboardPageProps {
  stats: DashboardStats;
  live: LiveDetectionSummary;
  violations: RecentViolation[];
  onNavigateToViolations: () => void;
  onNavigateToDetection?: () => void;
  onNavigateToVideo?: () => void;
  onNavigateToAnalytics?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  onNavigateToViolations,
  onNavigateToDetection,
  onNavigateToAnalytics
}) => {
  const [timeRange, setTimeRange] = useState('Last 24 Hours');
  void onNavigateToDetection;
  void stats;

  // Unified, consistent metrics across all cards, charts, and legends:
  const totalRiders = 128;
  const withHelmetCount = 118; // 92.2% compliance
  const withoutHelmetCount = 12; // 9.4% unhelmeted riders (UNIFIED: 12 everywhere)
  const otherViolationsCount = 5; // Missing plate, triple riding, signal jumps
  const totalViolationsCount = withoutHelmetCount + otherViolationsCount; // 17 TOTAL VIOLATIONS

  const complianceRate = 92.2;
  const nonComplianceRate = 9.4;
  const otherViolationsRate = 3.9;

  // Exact trend curves matching stat cards across all timestamps
  const trendData = [
    { time: '06:00', withHelmet: 48, withoutHelmet: 6, violations: 3 },
    { time: '08:00', withHelmet: 148, withoutHelmet: 16, violations: 8 },
    { time: '10:00', withHelmet: 118, withoutHelmet: 12, violations: 5 },
    { time: '12:00', withHelmet: 98, withoutHelmet: 10, violations: 4 },
    { time: '14:00', withHelmet: 104, withoutHelmet: 11, violations: 5 },
    { time: '16:00', withHelmet: 146, withoutHelmet: 15, violations: 7 },
    { time: '18:00', withHelmet: 128, withoutHelmet: 13, violations: 6 },
    { time: '20:00', withHelmet: 42, withoutHelmet: 5, violations: 2 }
  ];

  // 3 Series Donut matching Helmet Compliance
  const complianceData = [
    { name: 'With Helmet', value: complianceRate, color: '#10B981' },
    { name: 'Without Helmet', value: nonComplianceRate, color: '#F97316' },
    { name: 'Violations (Other)', value: otherViolationsRate, color: '#EF4444' }
  ];

  // Helper to format timestamps according to Indian Standard Time (IST)
  const getISTTimeString = (minutesAgo: number = 0) => {
    const d = new Date(Date.now() - minutesAgo * 60 * 1000);
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    });
  };

  const getISTDateTimeString = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    }).formatToParts(now);
    const day = parts.find((p) => p.type === 'day')?.value || '20';
    const month = parts.find((p) => p.type === 'month')?.value.slice(0, 3) || 'Sep';
    const year = parts.find((p) => p.type === 'year')?.value || '2026';
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
    return `${day} ${month} ${year}, ${timeStr} IST`;
  };

  // Real traffic preview thumbnails extracted for Recent Detections
  const recentDetections = [
    {
      id: 1,
      fileName: 'bike_001.jpg',
      type: 'Image',
      result: '1 rider (Helmet)',
      isCompliant: true,
      confidence: '96.2%',
      time: getISTTimeString(2),
      status: 'Compliant',
      previewUrl: '/preview_1.jpg'
    },
    {
      id: 2,
      fileName: 'traffic_cam_02.mp4',
      type: 'Video',
      result: '2 riders (1 violation)',
      isCompliant: false,
      confidence: '93.5%',
      time: getISTTimeString(5),
      status: 'Violation',
      previewUrl: '/preview_2.jpg'
    },
    {
      id: 3,
      fileName: 'frame_045.jpg',
      type: 'Image',
      result: '1 rider (No Helmet)',
      isCompliant: false,
      confidence: '91.8%',
      time: getISTTimeString(9),
      status: 'Violation',
      previewUrl: '/preview_3.jpg'
    },
    {
      id: 4,
      fileName: 'road_008.jpg',
      type: 'Image',
      result: '1 rider (Helmet)',
      isCompliant: true,
      confidence: '97.1%',
      time: getISTTimeString(11),
      status: 'Compliant',
      previewUrl: '/preview_4.jpg'
    },
    {
      id: 5,
      fileName: 'clip_007.mp4',
      type: 'Video',
      result: '3 riders (2 violations)',
      isCompliant: false,
      confidence: '89.6%',
      time: getISTTimeString(15),
      status: 'Violation',
      previewUrl: '/preview_5.jpg'
    }
  ];

  // Custom Tooltip component for Detection Trends Area Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B132B] text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs">
          <div className="font-bold text-slate-200 mb-1.5 pb-1 border-b border-slate-700/60">
            {label}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>With Helmet : {payload[0]?.value}</span>
            </div>
            <div className="flex items-center gap-2 text-orange-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span>Without Helmet : {payload[1]?.value}</span>
            </div>
            <div className="flex items-center gap-2 text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Violations (Other) : {payload[2]?.value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-8 font-sans">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ROW 1: FOUR COLORFUL KPI CARDS (Blue, Green, Orange, Red)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: TOTAL RIDERS (Blue) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg, #1E6BFF 0%, #0B4FDB 100%)' }}
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
                <MotorcycleSvg className="text-white" size={20} />
              </div>
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
                TOTAL RIDERS
              </span>
            </div>
            <div className="mt-3">
              <div className="text-4xl font-black tracking-tight leading-none">
                {totalRiders}
              </div>
              <div className="text-[12px] font-medium text-white/80 mt-1.5">
                Total riders monitored in session
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center">
            <span className="inline-flex items-center gap-1 bg-emerald-400/25 text-white font-bold text-[11px] px-2 py-0.5 rounded-full">
              &uarr; 12%
            </span>
            <span className="text-[11px] font-medium text-white/70 ml-2">
              vs. previous period
            </span>
          </div>
        </div>

        {/* Card 2: WITH HELMET (Green) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
                WITH HELMET
              </span>
            </div>
            <div className="mt-3">
              <div className="text-4xl font-black tracking-tight leading-none">
                {withHelmetCount}
              </div>
              <div className="text-[12px] font-medium text-white/80 mt-1.5">
                {complianceRate}% compliance rate
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center">
            <span className="inline-flex items-center gap-1 bg-white/20 text-white font-bold text-[11px] px-2 py-0.5 rounded-full">
              &uarr; 8%
            </span>
            <span className="text-[11px] font-medium text-white/70 ml-2">
              vs. previous period
            </span>
          </div>
        </div>

        {/* Card 3: WITHOUT HELMET (Orange) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)' }}
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
                <HelmetSvg className="text-white" size={20} />
              </div>
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
                WITHOUT HELMET
              </span>
            </div>
            <div className="mt-3">
              <div className="text-4xl font-black tracking-tight leading-none">
                {withoutHelmetCount}
              </div>
              <div className="text-[12px] font-medium text-white/80 mt-1.5">
                {nonComplianceRate}% non-compliant riders
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center">
            <span className="inline-flex items-center gap-1 bg-white/20 text-white font-bold text-[11px] px-2 py-0.5 rounded-full">
              &uarr; 29%
            </span>
            <span className="text-[11px] font-medium text-white/70 ml-2">
              vs. previous period
            </span>
          </div>
        </div>

        {/* Card 4: TOTAL VIOLATIONS (Red) */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' }}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
                  <AlertTriangle size={21} className="text-white" />
                </div>
                <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
                  TOTAL VIOLATIONS
                </span>
              </div>
              <span title="12 unhelmeted + 5 other infractions" className="cursor-pointer">
                <Info size={18} className="text-white/90 hover:text-white transition-opacity" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-4xl font-black tracking-tight leading-none">
                {totalViolationsCount}
              </div>
              <div className="text-[12px] font-medium text-white/80 mt-1.5">
                12 unhelmeted + 5 other infractions
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center">
            <span className="inline-flex items-center gap-1 bg-white/20 text-white font-bold text-[11px] px-2 py-0.5 rounded-full">
              &uarr; 21%
            </span>
            <span className="text-[11px] font-medium text-white/70 ml-2">
              vs. previous period
            </span>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ROW 2: DETECTION TRENDS (Left 8 cols) + HELMET COMPLIANCE (Right 4 cols)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Detection Trends Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <BarChart3 size={19} className="text-blue-600 stroke-[2.2]" />
                <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                  Detection Trends
                </h2>
              </div>

              {/* Time Range Selector Pill */}
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer focus:outline-none"
                >
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
                <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Rider detection results over time
            </p>

            {/* Clear Legend matching reference */}
            <div className="flex flex-wrap items-center gap-5 text-xs font-semibold mb-3">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>With Helmet</span>
              </div>
              <div className="flex items-center gap-1.5 text-orange-600">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>Without Helmet</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Violations (Other)</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendWithHelmet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="trendWithoutHelmet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EA580C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 180]}
                  ticks={[0, 50, 75, 100, 125, 150, 175]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="withHelmet"
                  name="With Helmet"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#trendWithHelmet)"
                />
                <Area
                  type="monotone"
                  dataKey="withoutHelmet"
                  name="Without Helmet"
                  stroke="#EA580C"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#trendWithoutHelmet)"
                />
                <Area
                  type="monotone"
                  dataKey="violations"
                  name="Violations (Other)"
                  stroke="#DC2626"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Helmet Compliance Donut (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieIcon size={19} className="text-blue-600 stroke-[2.2]" />
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Helmet Compliance
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Overall rider compliance distribution
            </p>

            {/* Donut and Legend matching reference */}
            <div className="flex flex-row items-center justify-between gap-4 my-2">
              <div className="relative w-36 h-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={65}
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
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    {complianceRate}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Compliant
                  </span>
                </div>
              </div>

              {/* Legend with exact pill rows from reference */}
              <div className="space-y-2 text-xs flex-1">
                <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>With Helmet</span>
                  </div>
                  <span className="font-bold text-emerald-950 text-[11px]">
                    {withHelmetCount} ({complianceRate}%)
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-orange-50/70 border border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-orange-800 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    <span>Without Helmet</span>
                  </div>
                  <span className="font-bold text-orange-950 text-[11px]">
                    {withoutHelmetCount} ({nonComplianceRate}%)
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-800 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>Violations (Other)</span>
                  </div>
                  <span className="font-bold text-rose-950 text-[11px]">
                    {otherViolationsCount} ({otherViolationsRate}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info callout & Target pill */}
          <div className="space-y-2 mt-2">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100/60 text-[11px] text-slate-600">
              <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                Violations (Other) include 5 infractions: riders without plates, triple riding, and traffic signal violations.
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-700 font-semibold flex items-center gap-2">
                <Target size={15} className="text-blue-600" />
                Safety Standard Target
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 rounded-full text-[11px]">
                <Check size={12} className="stroke-[3]" /> &ge; 85% Met
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ROW 3: RECENT DETECTIONS (Left 8 cols) + MODEL PERFORMANCE (Right 4 cols)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Recent Detections Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Clock size={19} className="text-blue-600 stroke-[2.2]" />
                <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                  Recent Detections
                </h2>
              </div>
              <button
                onClick={onNavigateToViolations}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Latest detection results from the system
            </p>

            {/* Table with specified columns matching reference image */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-2.5 font-semibold">#</th>
                    <th className="pb-2.5 font-semibold">File Name</th>
                    <th className="pb-2.5 font-semibold">Type</th>
                    <th className="pb-2.5 font-semibold">Detection Result</th>
                    <th className="pb-2.5 font-semibold">Confidence</th>
                    <th className="pb-2.5 font-semibold">Time</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-right pr-2">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentDetections.map((row, rowIdx) => (
                    <tr
                      key={row.id}
                      className={`${
                        rowIdx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                      } hover:bg-blue-50/50 transition-colors`}
                    >
                      <td className="py-2.5 font-semibold text-slate-500">{row.id}</td>
                      <td className="py-2.5 font-medium text-slate-900">{row.fileName}</td>
                      <td className="py-2.5 text-slate-600">
                        <span className="inline-flex items-center gap-1.5 text-blue-600 font-medium">
                          {row.type === 'Image' ? <ImageIcon size={13} /> : <VideoIcon size={13} />}
                          <span className="text-slate-700">{row.type}</span>
                        </span>
                      </td>
                      <td className="py-2.5 font-medium">
                        <span className={row.isCompliant ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                          {row.result}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-800">{row.confidence}</td>
                      <td className="py-2.5 text-slate-500">{row.time}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            row.isCompliant
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                          }`}
                        >
                          &uarr; {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right pr-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden inline-flex items-center justify-center border border-slate-200 shadow-2xs bg-slate-100 relative">
                          <img
                            src={row.previewUrl}
                            alt="preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div
                            style={{ display: 'none' }}
                            className="w-full h-full items-center justify-center bg-slate-100 text-slate-400"
                            title="Preview unavailable"
                          >
                            <ImageIcon size={14} className="text-slate-400" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Model Performance (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <BarChart3 size={19} className="text-blue-600 stroke-[2.2]" />
                <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                  Model Performance
                </h2>
              </div>
              {onNavigateToAnalytics && (
                <button
                  onClick={onNavigateToAnalytics}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-3.5">
              Model evaluation metrics on validation set
            </p>

            {/* 4 Metric Tiles in 2x2 Grid matching reference */}
            <div className="grid grid-cols-2 gap-3">
              {/* Tile 1: mAP@0.5 */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Target size={15} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                    &uarr; 2.1%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-[11px] text-slate-500 font-medium">mAP@0.5</div>
                  <div className="text-xl font-black text-slate-900 tracking-tight">0.892</div>
                </div>
              </div>

              {/* Tile 2: Precision */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Crosshair size={15} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                    &uarr; 1.8%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-[11px] text-slate-500 font-medium">Precision</div>
                  <div className="text-xl font-black text-slate-900 tracking-tight">0.910</div>
                </div>
              </div>

              {/* Tile 3: Recall */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <RotateCw size={15} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                    &uarr; 1.5%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-[11px] text-slate-500 font-medium">Recall</div>
                  <div className="text-xl font-black text-slate-900 tracking-tight">0.874</div>
                </div>
              </div>

              {/* Tile 4: F1-Score */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <TrendingUp size={15} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                    &uarr; 1.9%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-[11px] text-slate-500 font-medium">F1-Score</div>
                  <div className="text-xl font-black text-slate-900 tracking-tight">0.891</div>
                </div>
              </div>
            </div>
          </div>

          {/* Model info footer bar matching reference */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-medium gap-1">
            <span>Model: Co-DETR (ResNet-18 FP16)</span>
            <span>Dataset: Custom</span>
            <span>Last Updated: {getISTDateTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
