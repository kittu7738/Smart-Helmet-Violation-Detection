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
      color: '#38bdf8',
      textColor: 'text-sky-400',
      iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
      badgeBg: 'bg-sky-500/10 text-sky-400',
      sparkline: [25, 40, 35, 55, 60, 50, 75, 90],
    },
    {
      title: 'HELMET COMPLIANCE',
      value: `${stats.helmetCompliance}%`,
      unit: 'safety adherence',
      change: '+1.8% vs last week',
      isPositive: true,
      icon: ShieldCheck,
      color: '#10b981',
      textColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      badgeBg: 'bg-emerald-500/10 text-emerald-400',
      sparkline: [80, 84, 82, 88, 90, 89, 93, 95],
    },
    {
      title: 'VIOLATIONS',
      value: stats.violations.toString(),
      unit: 'active infractions',
      change: '1 driver, 2 pillion',
      isPositive: false,
      icon: AlertOctagon,
      color: '#ef4444',
      textColor: 'text-red-400',
      iconBg: 'bg-red-500/10 text-red-400 border border-red-500/20',
      badgeBg: 'bg-red-500/10 text-red-400',
      sparkline: [40, 65, 50, 75, 45, 80, 70, 85],
    },
    {
      title: 'DETECTION FPS',
      value: stats.detectionFps.toString(),
      unit: 'inference throughput',
      change: 'GPU Active',
      isPositive: true,
      icon: Gauge,
      color: '#a855f7',
      textColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      badgeBg: 'bg-purple-500/10 text-purple-400',
      sparkline: [24, 26, 27, 28, 28, 29, 28, 28],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const points = card.sparkline;
        const maxVal = Math.max(...points);
        const minVal = Math.min(...points) - 5;
        const width = 100;
        const height = 32;
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
            className="rounded-xl p-5 bg-slate-900/80 border border-slate-800 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Metric Value & Sparkline */}
            <div className="flex items-baseline justify-between gap-2 my-1">
              <div className={`text-3xl font-bold font-tech ${card.textColor}`}>
                {card.value}
              </div>

              {/* Clean Sparkline */}
              <div className="w-20 h-7 flex-shrink-0">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke={card.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />
                </svg>
              </div>
            </div>

            {/* Subtext and Trend Indicator */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-1 text-xs">
              <span className="text-slate-400 text-xs">{card.unit}</span>
              <span className={`flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded ${card.badgeBg}`}>
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
