import React from 'react';
import { Users, ShieldCheck, AlertOctagon, Gauge } from 'lucide-react';
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
      color: 'cyan',
      glow: 'shadow-cyan-500/10'
    },
    {
      title: 'HELMET COMPLIANCE',
      value: `${stats.helmetCompliance}%`,
      unit: 'safety adherence',
      change: '+1.8% vs last week',
      isPositive: true,
      icon: ShieldCheck,
      color: 'teal',
      glow: 'shadow-teal-500/10'
    },
    {
      title: 'VIOLATIONS',
      value: stats.violations.toString(),
      unit: 'active infractions',
      change: '1 driver, 2 pillion',
      isPositive: false,
      icon: AlertOctagon,
      color: 'rose',
      glow: 'shadow-rose-500/10'
    },
    {
      title: 'DETECTION FPS',
      value: stats.detectionFps.toString(),
      unit: 'frames/sec realtime',
      change: 'GPU Inference Active',
      isPositive: true,
      icon: Gauge,
      color: 'blue',
      glow: 'shadow-blue-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const colorClasses = {
          cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30',
          teal: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30',
          rose: 'text-rose-400 border-rose-500/30 bg-rose-950/30',
          blue: 'text-blue-400 border-blue-500/30 bg-blue-950/30'
        }[card.color];

        return (
          <div
            key={idx}
            className="glass-card glass-card-hover rounded-xl p-4 sm:p-5 relative overflow-hidden transition-all duration-200"
          >
            {/* Ambient accent background glow */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-cyan-500/5 blur-xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg border ${colorClasses}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-tech tracking-tight text-white">
                {card.value}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">{card.unit}</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                  card.isPositive
                    ? 'text-emerald-400 bg-emerald-950/50'
                    : 'text-rose-400 bg-rose-950/50'
                }`}
              >
                {card.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
