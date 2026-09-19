import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Video,
  BarChart3,
  Camera,
  Info
} from 'lucide-react';

export type NavTab = 'dashboard' | 'detection' | 'video' | 'analytics' | 'camera' | 'about';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'detection' as NavTab, label: 'Detection', icon: ScanLine },
    { id: 'video' as NavTab, label: 'Video Analysis', icon: Video },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    {
      id: 'camera' as NavTab,
      label: 'Live Camera',
      icon: Camera,
      pill: 'Coming Soon'
    },
    { id: 'about' as NavTab, label: 'About', icon: Info }
  ];

  return (
    <>
      {/* Desktop & Tablet Navigation Bar */}
      <nav className="hidden md:block w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-16 sm:top-20 z-30 shadow-lg">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex space-x-2 py-2.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.pill && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {tab.pill}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex justify-around items-center shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors relative ${
                isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.label}</span>
              {tab.pill && (
                <span className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};
