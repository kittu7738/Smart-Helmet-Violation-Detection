import React from 'react';
import { Users, ShieldCheck, AlertOctagon, Cpu, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardStats } from '../types/detection';

interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'TOTAL RIDERS',
      value: stats.totalRiders ? stats.totalRiders.toLocaleString() : '1,284',
      unit: 'detected across streams',
      change: '+12% vs avg',
      isPositive: true,
      icon: Users,
      color: '#2563EB',
      textColor: 'text-gray-900',
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      badgeBg: 'bg-blue-50 text-blue-700',
      sparkline: [25, 40, 35, 55, 60, 50, 75, 90],
    },
    {
      title: 'HELMET COMPLIANCE',
      value: `${stats.helmetCompliance || 92.4}%`,
      unit: 'safety adherence rate',
      change: '+1.8% past 7d',
      isPositive: true,
      icon: ShieldCheck,
      color: '#10B981',
      textColor: 'text-emerald-700',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      badgeBg: 'bg-emerald-50 text-emerald-700',
      sparkline: [80, 84, 82, 88, 90, 89, 93, 95],
    },
    {
      title: 'ACTIVE VIOLATIONS',
      value: (stats.violations || 17).toString(),
      unit: 'unhelmeted infractions',
      change: '1 driver, 2 pillion',
      isPositive: false,
      icon: AlertOctagon,
      color: '#EF4444',
      textColor: 'text-red-700',
      iconBg: 'bg-red-50 text-red-600 border border-red-100',
      badgeBg: 'bg-red-50 text-red-700',
      sparkline: [40, 65, 50, 75, 45, 80, 70, 85],
    },
    {
      title: 'AI VISION CORE',
      value: 'ONLINE',
      unit: 'Tesla T4 • ~100ms latency',
      change: 'Co-DETR FP16',
      isPositive: true,
      icon: Cpu,
      color: '#6366F1',
      textColor: 'text-indigo-700',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      badgeBg: 'bg-indigo-50 text-indigo-700',
      sparkline: [24, 26, 27, 28, 28, 29, 28, 28],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const points = card.sparkline;
        const maxVal = Math.max(...points);
        const minVal = Math.min(...points) - 5;
        const width = 100;
        const height = 30;
        const polylinePoints = points
          .map((val, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - ((val - minVal) / (maxVal - minVal || 1)) * (height - 4) - 2;
            return `${x},${y}`;
          })
          .join(' ');

        return (
          <div
            key={idx}
            className="light-card light-card-hover p-5 sm:p-6 flex flex-col justify-between"
          >
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Metric Value & Sparkline */}
            <div className="flex items-baseline justify-between gap-3 my-1">
              <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.textColor}`}>
                {card.value}
              </div>

              {/* Clean Sparkline */}
              <div className="w-20 h-7 flex-shrink-0 opacity-80">
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
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-1 text-xs">
              <span className="text-gray-500 font-medium">{card.unit}</span>
              <span className={`flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md ${card.badgeBg}`}>
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
