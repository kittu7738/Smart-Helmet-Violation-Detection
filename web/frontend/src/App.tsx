import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { NavTab } from './components/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { DetectionPage } from './pages/DetectionPage';
import { VideoAnalysisPage } from './pages/VideoAnalysisPage';
import { LiveCameraPage } from './pages/LiveCameraPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AboutPage } from './pages/AboutPage';
import { ViolationsPage } from './pages/ViolationsPage';
import { api } from './services/api';
import { DashboardStats, LiveDetectionSummary, RecentViolation } from './types/detection';
import { mockDashboardStats, mockLiveDetection, mockRecentViolations } from './data/mockDashboard';

export const App: React.FC = () => {
  const getInitialTab = (): NavTab | 'violations' => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['dashboard', 'detection', 'video', 'camera', 'analytics', 'about', 'violations'];
    return validTabs.includes(hash) ? (hash as any) : 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<NavTab | 'violations'>(getInitialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const setActiveTab = (tab: NavTab | 'violations') => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['dashboard', 'detection', 'video', 'camera', 'analytics', 'about', 'violations'];
      if (validTabs.includes(hash)) {
        setActiveTabState(hash as any);
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
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#EEF2F8] text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      {/* Dark Sidebar matching the reference mockup (media_1789845147108.jpg) */}
      <Sidebar
        activeTab={activeTab === 'violations' ? 'dashboard' : activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace Area to the right of the sidebar */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        {/* Minimalist SaaS Top Header */}
        <TopBar
          backendConnected={backendConnected}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7">
          {activeTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              live={live}
              violations={violations}
              onNavigateToViolations={() => setActiveTab('violations')}
              onNavigateToDetection={() => setActiveTab('detection')}
              onNavigateToVideo={() => setActiveTab('video')}
              onNavigateToAnalytics={() => setActiveTab('analytics')}
            />
          )}

          {activeTab === 'detection' && <DetectionPage />}

          {activeTab === 'video' && <VideoAnalysisPage />}

          {activeTab === 'camera' && <LiveCameraPage />}

          {activeTab === 'analytics' && <AnalyticsPage />}

          {activeTab === 'about' && <AboutPage />}

          {activeTab === 'violations' && <ViolationsPage />}
        </main>

        {/* Footer exactly matching mockup */}
        <footer className="border-t border-slate-200/80 bg-white/60 py-4 px-6 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1400px] mx-auto">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-semibold text-slate-700">Smart Helmet Violation Detection System</span>
              <span className="text-slate-300">|</span>
              <span>Safer Roads, Brighter Futures</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 font-medium">
              <span className="hover:text-slate-800 cursor-pointer">Privacy</span>
              <span className="hover:text-slate-800 cursor-pointer">Terms</span>
              <span className="hover:text-slate-800 cursor-pointer">Contact</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
