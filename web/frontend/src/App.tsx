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
  const getInitialTab = (): NavTab => {
    const hash = window.location.hash.replace('#', '') as NavTab;
    const validTabs: NavTab[] = ['dashboard', 'detection', 'violations', 'analytics', 'settings'];
    return validTabs.includes(hash) ? hash : 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<NavTab>(getInitialTab);

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as NavTab;
      const validTabs: NavTab[] = ['dashboard', 'detection', 'violations', 'analytics', 'settings'];
      if (validTabs.includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
    <div className="min-h-screen flex flex-col bg-[#040711] text-white selection:bg-[#00E5FF]/30 selection:text-[#00E5FF]">
      {/* Top Header */}
      <Header backendConnected={backendConnected} />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        violationsCount={stats.violations}
      />

      {/* Main Content Area: High-Impact Full-Screen Width */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-6 pb-24 md:pb-12">
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

      {/* Clean Academic Project Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-400 font-mono">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-medium">Smart Helmet AI Violation Detection System</span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-400">Co-DETR Swin-L Vision Core</span>
          </div>
          <div className="text-slate-400">
            IIITVICD AI City Challenge Research & Development Demo
          </div>
        </div>
      </footer>
    </div>

  );
};

export default App;
