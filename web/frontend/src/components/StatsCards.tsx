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
      change: '+12% from peak hour',
      isPositive: true,
      icon: Users,
      theme: 'cyan',
      borderColor: 'border-[#00E5FF]',
      glowShadow: 'shadow-[0_0_25px_rgba(0,229,255,0.3)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5)]',
      bgGradient: 'from-[#0A1A35]/90 via-[#0E264E]/70 to-[#0A1A35]/90',
      textColor: 'text-[#00E5FF]',
      textGlow: 'text-glow-cyan',
      badgeBg: 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50',
      iconBox: 'bg-[#00E5FF]/20 border-2 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_12px_#00E5FF]',
      sparkline: [25, 40, 35, 55, 60, 50, 75, 90],
      sparklineColor: '#00E5FF',
    },
    {
      title: 'HELMET COMPLIANCE',
      value: `${stats.helmetCompliance}%`,
      unit: 'safety adherence',
      change: '+1.8% vs last week',
      isPositive: true,
      icon: ShieldCheck,
      theme: 'green',
      borderColor: 'border-[#00FF9C]',
      glowShadow: 'shadow-[0_0_25px_rgba(0,255,156,0.3)] hover:shadow-[0_0_35px_rgba(0,255,156,0.5)]',
      bgGradient: 'from-[#062419]/90 via-[#0A3827]/70 to-[#062419]/90',
      textColor: 'text-[#00FF9C]',
      textGlow: 'text-glow-green',
      badgeBg: 'bg-[#00FF9C]/20 text-[#00FF9C] border border-[#00FF9C]/50',
      iconBox: 'bg-[#00FF9C]/20 border-2 border-[#00FF9C] text-[#00FF9C] shadow-[0_0_12px_#00FF9C]',
      sparkline: [80, 84, 82, 88, 90, 89, 93, 95],
      sparklineColor: '#00FF9C',
    },
    {
      title: 'VIOLATIONS',
      value: stats.violations.toString(),
      unit: 'active infractions',
      change: '1 driver, 2 pillion',
      isPositive: false,
      icon: AlertOctagon,
      theme: 'red',
      borderColor: 'border-[#FF3158]',
      glowShadow: 'shadow-[0_0_25px_rgba(255,49,88,0.35)] hover:shadow-[0_0_35px_rgba(255,49,88,0.6)]',
      bgGradient: 'from-[#2D0914]/90 via-[#451020]/70 to-[#2D0914]/90',
      textColor: 'text-[#FF3158]',
      textGlow: 'text-glow-red',
      badgeBg: 'bg-[#FF3158]/20 text-[#FF3158] border border-[#FF3158]/50',
      iconBox: 'bg-[#FF3158]/20 border-2 border-[#FF3158] text-[#FF3158] shadow-[0_0_12px_#FF3158]',
      sparkline: [40, 65, 50, 75, 45, 80, 70, 85],
      sparklineColor: '#FF3158',
    },
    {
      title: 'DETECTION FPS',
      value: stats.detectionFps.toString(),
      unit: 'frames/sec realtime',
      change: 'GPU Inference Active',
      isPositive: true,
      icon: Gauge,
      theme: 'purple',
      borderColor: 'border-[#B44CFF]',
      glowShadow: 'shadow-[0_0_25px_rgba(180,76,255,0.3)] hover:shadow-[0_0_35px_rgba(180,76,255,0.5)]',
      bgGradient: 'from-[#1A0A33]/90 via-[#2A1152]/70 to-[#1A0A33]/90',
      textColor: 'text-[#B44CFF]',
      textGlow: 'text-glow-purple',
      badgeBg: 'bg-[#B44CFF]/20 text-[#B44CFF] border border-[#B44CFF]/50',
      iconBox: 'bg-[#B44CFF]/20 border-2 border-[#B44CFF] text-[#B44CFF] shadow-[0_0_12px_#B44CFF]',
      sparkline: [24, 26, 27, 28, 28, 29, 28, 28],
      sparklineColor: '#B44CFF',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        // Generate SVG path for mini sparkline
        const points = card.sparkline;
        const maxVal = Math.max(...points);
        const minVal = Math.min(...points) - 5;
        const width = 120;
        const height = 36;
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
            className={`relative rounded-2xl p-5 sm:p-6 border-2 bg-gradient-to-br ${card.bgGradient} ${card.borderColor} ${card.glowShadow} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden group`}
          >
            {/* Ambient corner light flare */}
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none"
              style={{ backgroundColor: card.sparklineColor }}
            />

            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl ${card.iconBox}`}>
                <Icon className="w-5 h-5 drop-shadow-md" />
              </div>
            </div>

            {/* Metric Value */}
            <div className="flex items-baseline justify-between gap-2">
              <div className={`text-3xl sm:text-4xl font-black font-tech tracking-tight ${card.textColor} ${card.textGlow}`}>
                {card.value}
              </div>

              {/* Mini Sparkline Graph */}
              <div className="w-24 h-8">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={card.sparklineColor} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={card.sparklineColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`0,${height} ${polylinePoints} ${width},${height}`}
                    fill={`url(#grad-${idx})`}
                  />
                  <polyline
                    fill="none"
                    stroke={card.sparklineColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />
                </svg>
              </div>
            </div>

            {/* Subtext and Trend Indicator */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-1 text-xs">
              <span className="text-slate-300 font-medium text-[11px]">{card.unit}</span>
              <span className={`flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${card.badgeBg} whitespace-nowrap`}>
                {card.isPositive ? (
                  <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 flex-shrink-0" />
                )}
                <span className="truncate max-w-[130px] sm:max-w-none">{card.change}</span>
              </span>
            </div>

          </div>
        );
      })}
    </div>
  );
};
