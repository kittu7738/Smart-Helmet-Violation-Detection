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
      <nav className="hidden md:block w-full border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 py-2.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-cyan-300 bg-cyan-950/50 border border-cyan-500/40 shadow-neon-cyan/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>

                  {tab.badge !== undefined && (
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}

                  {/* Active Bottom Glow Indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Floating Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 px-3 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
