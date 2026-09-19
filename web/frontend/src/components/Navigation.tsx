import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Video,
  BarChart3,
  Camera,
  Info
} from 'lucide-react';

export type NavTab = 'dashboard' | 'detection' | 'video' | 'camera' | 'analytics' | 'about';

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
    {
      id: 'camera' as NavTab,
      label: 'Live Camera',
      icon: Camera,
      pill: 'Coming Soon'
    },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'about' as NavTab, label: 'About', icon: Info }
  ];

  return (
    <>
      {/* Desktop Navigation Bar */}
      <nav className="hidden md:block w-full border-b border-gray-200/80 bg-white sticky top-16 sm:top-20 z-30 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1.5 py-2.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-600 border border-blue-200 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                  {tab.pill && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-2 flex justify-around items-center shadow-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-colors relative ${
                isActive ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.label}</span>
              {tab.pill && (
                <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};
