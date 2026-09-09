import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  AlertTriangle,
  BarChart3,
  Settings
} from 'lucide-react';

export type NavTab = 'dashboard' | 'detection' | 'violations' | 'analytics' | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  violationsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  violationsCount = 17,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'detection' as NavTab, label: 'Detection', icon: ScanLine },
    {
      id: 'violations' as NavTab,
      label: 'Violations',
      icon: AlertTriangle,
      badge: violationsCount
    },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {/* Desktop & Tablet Navigation Bar */}
      <nav className="hidden md:block w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-16 sm:top-20 z-30">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex space-x-2 py-2.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                        isActive
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800 backdrop-blur-xl px-2 py-1.5 flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors relative ${
                isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};
