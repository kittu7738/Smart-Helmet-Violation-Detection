import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
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
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Clean White SaaS Header */}
      <Header backendConnected={backendConnected} />

      {/* Clean Navigation Bar */}
      <Navigation
        activeTab={activeTab === 'violations' ? 'dashboard' : activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardPage
            stats={stats}
            live={live}
            violations={violations}
            onNavigateToViolations={() => setActiveTab('violations')}
            onNavigateToDetection={() => setActiveTab('detection')}
            onNavigateToVideo={() => setActiveTab('video')}
          />
        )}

        {activeTab === 'detection' && <DetectionPage />}

        {activeTab === 'video' && <VideoAnalysisPage />}

        {activeTab === 'camera' && <LiveCameraPage />}

        {activeTab === 'analytics' && <AnalyticsPage />}

        {activeTab === 'about' && <AboutPage />}

        {activeTab === 'violations' && <ViolationsPage />}
      </main>

      {/* Clean Modern Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 text-xs text-gray-500">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-gray-800">Smart Helmet AI Violation Detection System</span>
            <span className="text-gray-300">|</span>
            <span className="text-blue-600 font-medium">Co-DETR ResNet-18 FP16</span>
          </div>
          <div className="text-gray-500 text-[11px]">
            IIITVICD AI City Challenge Research Project
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
