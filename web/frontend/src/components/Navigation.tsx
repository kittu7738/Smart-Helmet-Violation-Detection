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
      <nav className="hidden md:block w-full border-b border-[#00E5FF]/20 bg-[#060B19]/80 backdrop-blur-md sticky top-20 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-3 py-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-250 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-[#00E5FF]/25 via-[#1687FF]/35 to-[#006CFF]/30 border-2 border-[#00E5FF] shadow-[0_0_22px_rgba(0,229,255,0.45)]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-[#00E5FF]/30'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isActive
                        ? 'text-[#00E5FF] drop-shadow-[0_0_8px_#00E5FF] scale-110'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className={isActive ? 'text-glow-cyan' : ''}>{tab.label}</span>

                  {tab.badge !== undefined && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#FF3158] text-white shadow-neon-red drop-shadow-[0_0_6px_#FF3158]'
                          : 'bg-[#FF3158]/25 text-[#FF3158] border border-[#FF3158]/50'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}

                  {/* Active Bottom Glow Line */}
                  {isActive && (
                    <span className="absolute -bottom-3 left-3 right-3 h-[3px] bg-gradient-to-r from-[#00E5FF] via-[#00FF9C] to-[#1687FF] rounded-full shadow-[0_0_10px_#00E5FF]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Floating Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060B19]/95 backdrop-blur-2xl border-t-2 border-[#00E5FF]/40 px-3 py-2 shadow-[0_-4px_25px_rgba(0,229,255,0.2)]">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 py-1.5 px-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#00E5FF] bg-[#00E5FF]/15 border border-[#00E5FF]/50 shadow-neon-cyan scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_6px_#00E5FF]' : ''}`} />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2.5 bg-[#FF3158] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-neon-red">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
