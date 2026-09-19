import React from 'react';
import {
  ArrowRight,
  ScanLine,
  Video,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  Cpu,
  Bike,
  CheckCircle2,
  TrendingUp,
  Activity,
  Zap,
  Eye
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
    { name: 'Helmet Compliant', value: 92.4, count: 1186, color: '#10B981' },
    { name: 'Violation (No Helmet)', value: 7.6, count: 98, color: '#F43F5E' }
  ];

  const activityEvents = [
    {
      time: '08:42',
      vehicle: 'Motorcycle #01',
      plate: 'MH-04-EK-9214',
      camera: 'Cam 01 • Main Toll Plaza',
      role: 'Driver — Helmet',
      confidence: 94.2,
      isViolation: false
    },
    {
      time: '08:47',
      vehicle: 'Motorcycle #03',
      plate: 'DL-08-KL-9122',
      camera: 'Cam 02 • North Intersection',
      role: 'Driver — No Helmet',
      confidence: 87.1,
      isViolation: true
    },
    {
      time: '08:53',
      vehicle: 'Motorcycle #07',
      plate: 'GJ-01-AX-3819',
      camera: 'Cam 01 • Main Toll Plaza',
      role: 'Passenger — No Helmet',
      confidence: 91.4,
      isViolation: true
    },
    {
      time: '09:12',
      vehicle: 'Motorcycle #11',
      plate: 'KA-03-EM-4580',
      camera: 'Cam 03 • Expressway Flyover',
      role: 'Driver — Helmet',
      confidence: 96.8,
      isViolation: false
    },
    {
      time: '09:28',
      vehicle: 'Motorcycle #14',
      plate: 'MH-12-PQ-7721',
      camera: 'Cam 02 • North Intersection',
      role: 'Driver — No Helmet',
      confidence: 89.5,
      isViolation: true
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 space-y-10">

      {/* ── HEADER BAR ────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 40%, #EC4899 80%, #F59E0B 100%)',
          borderRadius: '24px',
          padding: '2px'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #EEF2FF 0%, #FAF5FF 50%, #FFF1F2 100%)',
            borderRadius: '22px',
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#10B981', boxShadow: '0 0 0 4px #D1FAE5',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{
                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: '#6D28D9'
              }}>Live System</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 900,
              color: '#1E1B4B', letterSpacing: '-0.03em', lineHeight: 1.1
            }}>
              Helmet Violation Monitor
            </h1>
            <p style={{ fontSize: '13px', color: '#5B21B6', fontWeight: 600, marginTop: '4px' }}>
              Real-time detection across all active camera feeds
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={onNavigateToDetection}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                color: '#fff', fontSize: '13px', fontWeight: 800,
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
                transition: 'transform 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <ScanLine size={16} />
              Image Detection
              <ArrowRight size={14} />
            </button>

            {onNavigateToVideo && (
              <button
                onClick={onNavigateToVideo}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                  color: '#fff', fontSize: '13px', fontWeight: 800,
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(14,165,233,0.4)',
                  transition: 'transform 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Video size={16} />
                Analyze Video
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 KPI CARDS ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>

        {/* Card 1 — Total Riders (Blue → Cyan) */}
        <div style={{
          background: 'linear-gradient(135deg, #DBEAFE 0%, #BAE6FD 60%, #E0F2FE 100%)',
          border: '2.5px solid #60A5FA',
          borderRadius: '20px',
          padding: '22px',
          boxShadow: '0 8px 32px rgba(59,130,246,0.18)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(37,99,235,0.12)'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1E40AF' }}>Total Riders</p>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#1E3A8A', fontFamily: 'monospace', lineHeight: 1.1, marginTop: '8px' }}>
                {stats.totalRiders ? stats.totalRiders.toLocaleString() : '1,284'}
              </div>
              <p style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600, marginTop: '4px' }}>Vehicles in active feeds</p>
            </div>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
            }}>
              <Bike size={22} color="#fff" />
            </div>
          </div>
          <div style={{
            marginTop: '16px', paddingTop: '12px',
            borderTop: '1.5px solid rgba(96,165,250,0.5)',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <TrendingUp size={13} color="#1D4ED8" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8' }}>+12.4% vs 7-day avg</span>
            <svg style={{ marginLeft: 'auto', width: '64px', height: '24px' }} viewBox="0 0 60 20" fill="none">
              <path d="M 0,16 Q 15,18 25,10 T 45,6 T 60,2" stroke="#3B82F6" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Card 2 — Helmet Compliance (Emerald → Teal) */}
        <div style={{
          background: 'linear-gradient(135deg, #D1FAE5 0%, #CCFBF1 60%, #ECFDF5 100%)',
          border: '2.5px solid #34D399',
          borderRadius: '20px',
          padding: '22px',
          boxShadow: '0 8px 32px rgba(16,185,129,0.18)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(5,150,105,0.10)'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#065F46' }}>Helmet Compliance</p>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#064E3B', fontFamily: 'monospace', lineHeight: 1.1, marginTop: '8px' }}>
                {stats.helmetCompliance || '92.4'}%
              </div>
              <p style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>Riders following rules</p>
            </div>
            <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
              <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#A7F3D0" strokeWidth="4.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#059669" strokeWidth="4.5"
                  strokeDasharray="92.4, 100" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div style={{
            marginTop: '16px', paddingTop: '12px',
            borderTop: '1.5px solid rgba(52,211,153,0.5)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{
              fontSize: '11px', fontWeight: 800, color: '#065F46',
              background: '#A7F3D0', padding: '3px 10px', borderRadius: '20px'
            }}>+1.8% improvement</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>Goal: &gt;95%</span>
          </div>
        </div>

        {/* Card 3 — Violations (Rose → Orange) */}
        <div style={{
          background: 'linear-gradient(135deg, #FFE4E6 0%, #FFEDD5 60%, #FFF1F2 100%)',
          border: '2.5px solid #FB7185',
          borderRadius: '20px',
          padding: '22px',
          boxShadow: '0 8px 32px rgba(244,63,94,0.18)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(225,29,72,0.10)'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9F1239' }}>Active Violations</p>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#881337', fontFamily: 'monospace', lineHeight: 1.1, marginTop: '8px' }}>
                {stats.violations ?? '17'}
              </div>
              <p style={{ fontSize: '12px', color: '#E11D48', fontWeight: 600, marginTop: '4px' }}>Infractions flagged</p>
            </div>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #E11D48, #F97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(225,29,72,0.4)'
            }}>
              <AlertTriangle size={22} color="#fff" />
            </div>
          </div>
          <div style={{
            marginTop: '16px', paddingTop: '12px',
            borderTop: '1.5px solid rgba(251,113,133,0.5)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{
              fontSize: '11px', fontWeight: 800, color: '#fff',
              background: 'linear-gradient(90deg, #E11D48, #F97316)',
              padding: '4px 10px', borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(225,29,72,0.3)'
            }}>12 Driver · 5 Pillion</span>
            <button
              onClick={onNavigateToViolations}
              style={{ fontSize: '12px', fontWeight: 800, color: '#BE123C', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >Review →</button>
          </div>
        </div>

        {/* Card 4 — AI Engine (Violet → Indigo) */}
        <div style={{
          background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 40%, #E0E7FF 100%)',
          border: '2.5px solid #A78BFA',
          borderRadius: '20px',
          padding: '22px',
          boxShadow: '0 8px 32px rgba(124,58,237,0.18)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(109,40,217,0.10)'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4C1D95' }}>Co-DETR Runtime</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 900, color: '#3B0764' }}>ONLINE</span>
                <span style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: '#10B981', boxShadow: '0 0 0 4px #D1FAE5',
                  display: 'inline-block', animation: 'pulse 2s infinite'
                }} />
              </div>
              <p style={{ fontSize: '12px', color: '#6D28D9', fontWeight: 600, marginTop: '4px' }}>Tesla T4 GPU · FP16</p>
            </div>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(124,58,237,0.4)'
            }}>
              <Cpu size={22} color="#fff" />
            </div>
          </div>
          <div style={{
            marginTop: '16px', paddingTop: '12px',
            borderTop: '1.5px solid rgba(167,139,250,0.5)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: 'monospace', fontSize: '12px', fontWeight: 800
          }}>
            <span style={{
              background: '#DDD6FE', color: '#4C1D95',
              padding: '3px 10px', borderRadius: '8px'
            }}>~112 ms</span>
            <span style={{ color: '#5B21B6' }}>acc0: 95.75%</span>
          </div>
        </div>
      </div>

      {/* ── QUICK STATS RIBBON ────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(90deg, #1E1B4B 0%, #312E81 30%, #1E3A8A 60%, #0F172A 100%)',
        borderRadius: '18px',
        padding: '18px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0',
        alignItems: 'center',
        justifyContent: 'space-around'
      }}>
        {[
          { label: 'mAP Score', value: '22.40%', color: '#FCD34D', icon: <Zap size={16} color="#FCD34D" /> },
          { label: 'AP50', value: '54.30%', color: '#6EE7B7', icon: <Eye size={16} color="#6EE7B7" /> },
          { label: 'Detection Classes', value: '7', color: '#93C5FD', icon: <ShieldCheck size={16} color="#93C5FD" /> },
          { label: 'Cameras Active', value: '3', color: '#F9A8D4', icon: <Activity size={16} color="#F9A8D4" /> },
          { label: 'System Uptime', value: '99.7%', color: '#86EFAC', icon: <TrendingUp size={16} color="#86EFAC" /> }
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 20px',
            borderRight: i < 4 ? '1px solid rgba(255,255,255,0.1)' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              {item.icon}
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</span>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 900, color: item.color, fontFamily: 'monospace' }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* ── ACTIVITY FEED ─────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 20%, #FFF 60%, #EFF6FF 100%)',
        border: '2.5px solid #FCD34D',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 8px 40px rgba(245,158,11,0.12)'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '20px', flexWrap: 'wrap', gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#D97706" />
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#78350F', margin: 0 }}>Live Detection Feed</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 600, marginTop: '4px' }}>
              Chronological stream — two-wheelers &amp; helmet classifications
            </p>
          </div>
          <button
            onClick={onNavigateToViolations}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 18px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#fff', fontSize: '12px', fontWeight: 800,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 3px 12px rgba(245,158,11,0.35)'
            }}
          >
            <FileText size={14} />
            Full Violations Log
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activityEvents.map((evt, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '16px',
                border: `2px solid ${evt.isViolation ? '#FCA5A5' : '#86EFAC'}`,
                background: evt.isViolation
                  ? 'linear-gradient(90deg, #FFF1F2 0%, #FFEDD5 100%)'
                  : 'linear-gradient(90deg, #F0FDF4 0%, #ECFEFF 100%)',
                transition: 'transform 0.15s',
                cursor: 'default'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: evt.isViolation ? '#F43F5E' : '#10B981',
                  boxShadow: `0 0 0 4px ${evt.isViolation ? '#FFE4E6' : '#D1FAE5'}`,
                  flexShrink: 0
                }} />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontFamily: 'monospace', fontSize: '12px', fontWeight: 800,
                  color: '#374151', background: '#fff',
                  padding: '3px 9px', borderRadius: '8px',
                  border: '1.5px solid #E5E7EB'
                }}>
                  <Clock size={11} color="#6B7280" />
                  {evt.time}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{evt.vehicle}</span>
                    <span style={{
                      fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                      background: '#EEF2FF', color: '#3730A3',
                      padding: '2px 8px', borderRadius: '6px', border: '1px solid #C7D2FE'
                    }}>{evt.plate}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, margin: '2px 0 0' }}>{evt.camera}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827' }}>{evt.role}</div>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6B7280', fontWeight: 600 }}>
                    {evt.confidence}% conf.
                  </div>
                </div>
                {evt.isViolation ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '20px',
                    background: 'linear-gradient(90deg, #E11D48, #F97316)',
                    color: '#fff', fontSize: '11px', fontWeight: 900,
                    boxShadow: '0 2px 10px rgba(225,29,72,0.35)'
                  }}>
                    <AlertTriangle size={12} />
                    VIOLATION
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '20px',
                    background: 'linear-gradient(90deg, #059669, #0D9488)',
                    color: '#fff', fontSize: '11px', fontWeight: 900,
                    boxShadow: '0 2px 10px rgba(5,150,105,0.35)'
                  }}>
                    <CheckCircle2 size={12} />
                    COMPLIANT
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ANALYTICS SECTION ─────────────────────────────────────── */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0EA5E9' }}>Analytics</span>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', margin: '4px 0 0', letterSpacing: '-0.02em' }}>
            Traffic &amp; Compliance Overview
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: '20px' }}>

          {/* Area Chart Card */}
          <div style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 30%, #EDE9FE 100%)',
            border: '2.5px solid #93C5FD',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(59,130,246,0.14)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: '20px',
              flexWrap: 'wrap', gap: '10px'
            }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1E3A8A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  24-Hour Traffic vs. Infractions
                </h3>
                <p style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600, marginTop: '3px' }}>
                  Surveillance throughput across all camera feeds
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', fontWeight: 700, color: '#1E40AF',
                  background: '#BFDBFE', padding: '4px 10px', borderRadius: '10px', border: '1px solid #93C5FD'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} />
                  Total Riders
                </span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', fontWeight: 700, color: '#9F1239',
                  background: '#FEE2E2', padding: '4px 10px', borderRadius: '10px', border: '1px solid #FCA5A5'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
                  Violations
                </span>
              </div>
            </div>
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotalV2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="colorViolV2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#BFDBFE" />
                  <XAxis dataKey="time" stroke="#3B82F6" fontSize={11} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#3B82F6" fontSize={11} fontWeight="bold" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '2px solid #BFDBFE',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      fontSize: '12px', fontWeight: 'bold'
                    }}
                  />
                  <Area type="monotone" dataKey="total" name="Total Vehicles"
                    stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorTotalV2)" />
                  <Area type="monotone" dataKey="violations" name="Violations"
                    stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#colorViolV2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Card */}
          <div style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 40%, #EDE9FE 100%)',
            border: '2.5px solid #6EE7B7',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(16,185,129,0.14)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#065F46', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Helmet Status Share
              </h3>
              <p style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '3px' }}>
                Overall safety adherence proportion
              </p>
            </div>

            <div style={{ position: 'relative', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={complianceDistribution} innerRadius={58} outerRadius={78} paddingAngle={4} dataKey="value">
                    {complianceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '26px', fontWeight: 900, color: '#064E3B', fontFamily: 'monospace' }}>92.4%</span>
                <span style={{
                  fontSize: '10px', fontWeight: 800, color: '#065F46', textTransform: 'uppercase',
                  background: '#A7F3D0', padding: '2px 8px', borderRadius: '6px', marginTop: '2px'
                }}>Compliant</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: '12px',
                background: '#D1FAE5', border: '1.5px solid #6EE7B7'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 800, color: '#064E3B' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  Helmeted Riders
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 900, color: '#064E3B' }}>1,186 (92.4%)</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: '12px',
                background: '#FFE4E6', border: '1.5px solid #FCA5A5'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 800, color: '#881337' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F43F5E', display: 'inline-block' }} />
                  No Helmet
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 900, color: '#881337' }}>98 (7.6%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
