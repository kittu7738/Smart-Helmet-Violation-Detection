import React from 'react';
import { Users, ShieldCheck, AlertOctagon, Gauge, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardStats } from '../types/detection';

interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'TOTAL RIDERS',
      value: stats.totalRiders.toLocaleString(),
      unit: 'detected today',
      change: '+12% vs avg',
      isPositive: true,
      icon: Users,
      color: '#2563EB',
      textColor: 'text-blue-600',
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      badgeBg: 'bg-blue-50 text-blue-700',
      sparkline: [25, 40, 35, 55, 60, 50, 75, 90],
    },
    {
      title: 'HELMET COMPLIANCE',
      value: `${stats.helmetCompliance}%`,
      unit: 'safety adherence',
      change: '+1.8% vs last week',
      isPositive: true,
      icon: ShieldCheck,
      color: '#16A34A',
      textColor: 'text-green-600',
      iconBg: 'bg-green-50 text-green-600 border border-green-100',
      badgeBg: 'bg-green-50 text-green-700',
      sparkline: [80, 84, 82, 88, 90, 89, 93, 95],
    },
    {
      title: 'VIOLATIONS',
      value: stats.violations.toString(),
      unit: 'active infractions',
      change: '1 driver, 2 pillion',
      isPositive: false,
      icon: AlertOctagon,
      color: '#DC2626',
      textColor: 'text-red-600',
      iconBg: 'bg-red-50 text-red-600 border border-red-100',
      badgeBg: 'bg-red-50 text-red-700',
      sparkline: [40, 65, 50, 75, 45, 80, 70, 85],
    },
    {
      title: 'DETECTION FPS',
      value: stats.detectionFps.toString(),
      unit: 'real-time inference',
      change: 'GPU Active',
      isPositive: true,
      icon: Gauge,
      color: '#7C3AED',
      textColor: 'text-purple-600',
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
      badgeBg: 'bg-purple-50 text-purple-700',
      sparkline: [24, 26, 27, 28, 28, 29, 28, 28],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const points = card.sparkline;
        const maxVal = Math.max(...points);
        const minVal = Math.min(...points) - 5;
        const width = 110;
        const height = 34;
        const polylinePoints = points
          .map((val, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - ((val - minVal) / (maxVal - minVal || 1)) * (height - 6) - 3;
            return `${x},${y}`;
          })
          .join(' ');

        return (
          <div
            key={idx}
            className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold tracking-wider text-slate-500 uppercase">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Metric Value & Sparkline */}
            <div className="flex items-baseline justify-between gap-2 my-1">
              <div className={`text-3xl sm:text-4xl font-bold font-tech tracking-tight ${card.textColor}`}>
                {card.value}
              </div>

              {/* Clean Sparkline */}
              <div className="w-24 h-8 flex-shrink-0">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke={card.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />
                </svg>
              </div>
            </div>

            {/* Subtext and Trend Indicator */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
              <span className="text-slate-500 font-medium text-xs">{card.unit}</span>
              <span className={`flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${card.badgeBg}`}>
                {card.isPositive ? (
                  <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 flex-shrink-0" />
                )}
                <span>{card.change}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
