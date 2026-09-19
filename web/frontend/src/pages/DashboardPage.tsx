import React from 'react';
import {
  ArrowRight,
  ScanLine,
  Video,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Bike,
  CheckCircle2,
  TrendingUp,
  Activity,
  Zap,
  Eye,
  Camera
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
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  onNavigateToViolations,
  onNavigateToDetection,
  onNavigateToVideo
}) => {
  const trafficActivityData = [
    { time: '06:00', total: 46, violations: 4 },
    { time: '08:00', total: 170, violations: 28 },
    { time: '10:00', total: 124, violations: 14 },
    { time: '12:00', total: 100, violations: 11 },
    { time: '14:00', total: 94, violations: 10 },
    { time: '16:00', total: 147, violations: 22 },
    { time: '18:00', total: 139, violations: 19 },
    { time: '20:00', total: 82, violations: 8 }
  ];

  const complianceDistribution = [
    { name: 'Helmeted', value: 92.4, color: '#22C55E' },
    { name: 'Violation', value: 7.6, color: '#EF4444' }
  ];

  const activityEvents = [
    { time: '08:42', vehicle: 'Motorcycle #01', plate: 'MH-04-EK-9214', camera: 'Cam 01 • Main Toll Plaza', role: 'Driver — Helmet', confidence: 94.2, isViolation: false },
    { time: '08:47', vehicle: 'Motorcycle #03', plate: 'DL-08-KL-9122', camera: 'Cam 02 • North Intersection', role: 'Driver — No Helmet', confidence: 87.1, isViolation: true },
    { time: '08:53', vehicle: 'Motorcycle #07', plate: 'GJ-01-AX-3819', camera: 'Cam 01 • Main Toll Plaza', role: 'Passenger — No Helmet', confidence: 91.4, isViolation: true },
    { time: '09:12', vehicle: 'Motorcycle #11', plate: 'KA-03-EM-4580', camera: 'Cam 03 • Expressway Flyover', role: 'Driver — Helmet', confidence: 96.8, isViolation: false },
    { time: '09:28', vehicle: 'Motorcycle #14', plate: 'MH-12-PQ-7721', camera: 'Cam 02 • North Intersection', role: 'Driver — No Helmet', confidence: 89.5, isViolation: true }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 0 80px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PAGE TITLE — plain, confident, no fancy borders
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>
            ● Live &nbsp;·&nbsp; Today
          </p>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }}>
            Monitoring Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onNavigateToDetection} style={{
            display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 22px',
            borderRadius: '12px', background: '#4F46E5', color: '#fff',
            fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(79,70,229,0.35)'
          }}>
            <ScanLine size={15} /> Detect Image <ArrowRight size={14} />
          </button>
          {onNavigateToVideo && (
            <button onClick={onNavigateToVideo} style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 22px',
              borderRadius: '12px', background: '#0EA5E9', color: '#fff',
              fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(14,165,233,0.35)'
            }}>
              <Video size={15} /> Analyze Video
            </button>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TOP HERO ROW — Asymmetric: big compliance card + 3 right-side cards
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: '16px', marginBottom: '20px' }}>

        {/* BIG CARD — Helmet Compliance — spans 1 col, 2 rows — DARK GREEN */}
        <div style={{
          gridColumn: '1', gridRow: '1 / 3',
          background: 'linear-gradient(160deg, #14532D 0%, #166534 40%, #15803D 100%)',
          borderRadius: '24px', padding: '32px 28px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: '0 12px 40px rgba(21,128,61,0.35)',
          minHeight: '240px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} color="#4ADE80" />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#86EFAC' }}>
                Helmet Compliance
              </span>
            </div>
            <div style={{ fontSize: '76px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1, fontFamily: 'monospace', letterSpacing: '-0.04em' }}>
              92.4<span style={{ fontSize: '36px', color: '#4ADE80' }}>%</span>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, margin: '12px 0 0' }}>
              of riders wearing helmets correctly
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ background: 'rgba(74,222,128,0.2)', color: '#4ADE80', fontSize: '12px', fontWeight: 800, padding: '5px 12px', borderRadius: '20px' }}>
              ↑ +1.8% this week
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Target: 95%</span>
          </div>
        </div>

        {/* CARD — Total Riders — DARK BLUE */}
        <div style={{
          gridColumn: '2', gridRow: '1',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
          borderRadius: '20px', padding: '24px',
          boxShadow: '0 8px 28px rgba(29,78,216,0.30)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#93C5FD' }}>Total Riders</span>
            <Bike size={18} color="#60A5FA" />
          </div>
          <div>
            <div style={{ fontSize: '52px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {stats.totalRiders ? stats.totalRiders.toLocaleString() : '1,284'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px' }}>
              <TrendingUp size={13} color="#93C5FD" />
              <span style={{ fontSize: '12px', color: '#93C5FD', fontWeight: 700 }}>+12.4% vs last week</span>
            </div>
          </div>
        </div>

        {/* CARD — Active Violations — HOT RED/ORANGE */}
        <div style={{
          gridColumn: '3', gridRow: '1',
          background: 'linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)',
          borderRadius: '20px', padding: '24px',
          boxShadow: '0 8px 28px rgba(220,38,38,0.35)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FCA5A5' }}>Violations</span>
            <AlertTriangle size={18} color="#FCA5A5" />
          </div>
          <div>
            <div style={{ fontSize: '52px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {stats.violations ?? '17'}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '3px 9px', borderRadius: '12px', fontWeight: 700 }}>12 Driver</span>
              <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '3px 9px', borderRadius: '12px', fontWeight: 700 }}>5 Pillion</span>
            </div>
          </div>
        </div>

        {/* CARD — Co-DETR Status — row 2, col 2 — VIOLET */}
        <div style={{
          gridColumn: '2', gridRow: '2',
          background: 'linear-gradient(135deg, #2E1065 0%, #6D28D9 100%)',
          borderRadius: '20px', padding: '20px 24px',
          boxShadow: '0 8px 28px rgba(109,40,217,0.30)',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C4B5FD' }}>Co-DETR Engine</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF' }}>ONLINE</span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 0 3px rgba(74,222,128,0.3)', display: 'inline-block' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#C4B5FD' }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '6px' }}>~112 ms</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '6px' }}>Tesla T4</span>
          </div>
        </div>

        {/* CARD — mAP / Accuracy — row 2, col 3 — AMBER */}
        <div style={{
          gridColumn: '3', gridRow: '2',
          background: 'linear-gradient(135deg, #78350F 0%, #D97706 100%)',
          borderRadius: '20px', padding: '20px 24px',
          boxShadow: '0 8px 28px rgba(217,119,6,0.30)',
          display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FDE68A' }}>Model Stats</span>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>22.4%</div>
              <div style={{ fontSize: '10px', color: '#FDE68A', fontWeight: 700, textTransform: 'uppercase' }}>mAP</div>
            </div>
            <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>54.3%</div>
              <div style={{ fontSize: '10px', color: '#FDE68A', fontWeight: 700, textTransform: 'uppercase' }}>AP50</div>
            </div>
            <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>95.8%</div>
              <div style={{ fontSize: '10px', color: '#FDE68A', fontWeight: 700, textTransform: 'uppercase' }}>acc0</div>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CHARTS ROW — Full-width area chart + compact donut side panel
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px', alignItems: 'stretch' }}>

        {/* Area Chart */}
        <div style={{
          background: '#FFFFFF',
          border: '2px solid #E2E8F0',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>24-Hour Traffic</h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0', fontWeight: 500 }}>Riders detected vs. infractions flagged</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#1D4ED8' }}>
                <span style={{ width: '24px', height: '3px', background: '#3B82F6', borderRadius: '2px', display: 'inline-block' }} />
                Riders
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>
                <span style={{ width: '24px', height: '3px', background: '#EF4444', borderRadius: '2px', display: 'inline-block' }} />
                Violations
              </span>
            </div>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficActivityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="gViol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '12px', fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="total" name="Total Riders" stroke="#2563EB" strokeWidth={2.5} fill="url(#gTotal)" />
                <Area type="monotone" dataKey="violations" name="Violations" stroke="#DC2626" strokeWidth={2.5} fill="url(#gViol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Donut */}
        <div style={{
          background: '#0F172A',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#F1F5F9', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status Split</h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0, fontWeight: 500 }}>Helmet vs. No-Helmet</p>
          </div>

          <div style={{ position: 'relative', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={complianceDistribution} innerRadius={52} outerRadius={70} paddingAngle={5} dataKey="value">
                  {complianceDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>92.4%</span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#22C55E', textTransform: 'uppercase', marginTop: '2px' }}>Safe</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(34,197,94,0.12)', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 700, color: '#86EFAC' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                Helmeted
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 900, color: '#4ADE80' }}>1,186</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(239,68,68,0.12)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 700, color: '#FCA5A5' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                No Helmet
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 900, color: '#F87171' }}>98</span>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          DETECTION FEED — Feels like a real event log, not a card grid
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        background: '#FFFBF0',
        border: '2px solid #FDE68A',
        borderRadius: '24px',
        overflow: 'hidden'
      }}>
        {/* Feed header */}
        <div style={{
          background: '#FBBF24',
          padding: '16px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} color="#78350F" />
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#78350F', letterSpacing: '-0.01em' }}>Live Detection Feed</span>
            <span style={{ background: '#78350F', color: '#FDE68A', fontSize: '11px', fontWeight: 800, padding: '2px 9px', borderRadius: '12px' }}>
              {activityEvents.length} events
            </span>
          </div>
          <button
            onClick={onNavigateToViolations}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#78350F', color: '#FDE68A', border: 'none',
              padding: '8px 16px', borderRadius: '10px',
              fontSize: '12px', fontWeight: 800, cursor: 'pointer'
            }}
          >
            <FileText size={13} /> Full Log
          </button>
        </div>

        {/* Column labels */}
        <div style={{
          display: 'grid', gridTemplateColumns: '70px 1fr 1fr auto',
          padding: '10px 28px', gap: '12px',
          background: '#FEF3C7', borderBottom: '1px solid #FDE68A'
        }}>
          {['Time', 'Vehicle', 'Camera', 'Status'].map((col) => (
            <span key={col} style={{ fontSize: '11px', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col}</span>
          ))}
        </div>

        {/* Event rows */}
        {activityEvents.map((evt, idx) => (
          <div key={idx} style={{
            display: 'grid', gridTemplateColumns: '70px 1fr 1fr auto',
            padding: '14px 28px', gap: '12px', alignItems: 'center',
            borderBottom: idx < activityEvents.length - 1 ? '1px solid #FDE68A' : 'none',
            background: evt.isViolation ? 'rgba(254,226,226,0.5)' : 'transparent',
            transition: 'background 0.15s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                background: evt.isViolation ? '#EF4444' : '#22C55E'
              }} />
              <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#374151' }}>{evt.time}</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{evt.vehicle}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#EEF2FF', color: '#3730A3', padding: '2px 7px', borderRadius: '6px', fontWeight: 700, border: '1px solid #C7D2FE' }}>
                  {evt.plate}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, marginTop: '2px' }}>{evt.role} · {evt.confidence}% conf.</div>
            </div>
            <div style={{ fontSize: '12px', color: '#374151', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Camera size={13} color="#9CA3AF" />
              {evt.camera}
            </div>
            <div>
              {evt.isViolation ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: '#DC2626', color: '#fff',
                  padding: '5px 12px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: 900,
                  boxShadow: '0 2px 8px rgba(220,38,38,0.3)'
                }}>
                  <AlertTriangle size={11} /> VIOLATION
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: '#16A34A', color: '#fff',
                  padding: '5px 12px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: 900,
                  boxShadow: '0 2px 8px rgba(22,163,74,0.3)'
                }}>
                  <CheckCircle2 size={11} /> COMPLIANT
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BOTTOM STATS BAR — Cameras & system info
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '20px'
      }}>
        {[
          { icon: <Camera size={18} color="#60A5FA" />, label: 'Active Cameras', value: '3 / 3', sub: 'All feeds online', bg: '#EFF6FF', border: '#BFDBFE', accent: '#1D4ED8' },
          { icon: <Zap size={18} color="#34D399" />, label: 'System Uptime', value: '99.7%', sub: 'No interruptions', bg: '#F0FDF4', border: '#BBF7D0', accent: '#15803D' },
          { icon: <Eye size={18} color="#C084FC" />, label: 'Model Classes', value: '7 Classes', sub: 'ResNet-18 backbone', bg: '#FAF5FF', border: '#E9D5FF', accent: '#7E22CE' }
        ].map((item, i) => (
          <div key={i} style={{
            background: item.bg, border: `1.5px solid ${item.border}`,
            borderRadius: '18px', padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: '14px'
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fff', border: `1.5px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: item.accent, fontFamily: 'monospace', lineHeight: 1.2 }}>{item.value}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
