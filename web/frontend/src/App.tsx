import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { DetectionPage } from './pages/DetectionPage';
import { ViolationsPage } from './pages/ViolationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from './types/detection';
import { mockDashboardStats, mockLiveDetection, mockRecentViolations } from './data/mockDashboard';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [stats, setStats] = useState<DashboardStats>(mockDashboardStats);
  const [live, setLive] = useState<LiveDetectionSummary>(mockLiveDetection);
  const [violations, setViolations] = useState<RecentViolation[]>(mockRecentViolations);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    // Initial fetch from API (falls back gracefully to mock data if backend is offline)
    const loadData = async () => {
      const health = await api.getHealth();
      setBackendConnected(health.isConnected);

      const dashboard = await api.getDashboard();
      if (dashboard) {
        setStats(dashboard.stats);
        setLive(dashboard.live);
        setViolations(dashboard.recentViolations);
      }
    };

    loadData();
    // Periodic refresh
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header backendConnected={backendConnected} />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        violationsCount={stats.violations}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
        {activeTab === 'dashboard' && (
          <DashboardPage
            stats={stats}
            live={live}
            violations={violations}
            onNavigateToViolations={() => setActiveTab('violations')}
            onNavigateToDetection={() => setActiveTab('detection')}
          />
        )}

        {activeTab === 'detection' && <DetectionPage />}

        {activeTab === 'violations' && <ViolationsPage />}

        {activeTab === 'analytics' && <AnalyticsPage />}

        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Futuristic Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Smart Helmet Violation Detection System</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400">Co-DETR & Swin-L Core</span>
          </div>
          <div className="text-slate-400">
            IIITVICD AI City Challenge Research & Development
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
