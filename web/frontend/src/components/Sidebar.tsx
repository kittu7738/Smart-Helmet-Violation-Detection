import React from 'react';
import {
  LayoutDashboard,
  Camera,
  PlayCircle,
  Video,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react';
import { NavTab } from './Navigation';

interface SidebarProps {
  activeTab: NavTab | 'violations' | 'reports';
  onTabChange: (tab: NavTab | 'violations') => void;
  onOpenSettings: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  mobileOpen = false,
  onCloseMobile
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'detection', label: 'Detection', icon: Camera },
    { id: 'video', label: 'Video Analysis', icon: PlayCircle },
    { id: 'camera', label: 'Live Camera', icon: Video },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText, target: 'analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, isAction: true }
  ];

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.isAction) {
      onOpenSettings();
    } else if (item.target) {
      onTabChange(item.target as NavTab);
    } else {
      onTabChange(item.id as NavTab);
    }
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 text-slate-300 flex flex-col justify-between border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(7, 13, 30, 0.95) 0%, rgba(7, 13, 30, 0.88) 35%, rgba(7, 13, 30, 0.45) 65%, rgba(7, 13, 30, 0.82) 100%), url('/sidebar_rider.jpg') center bottom / cover no-repeat"
        }}
      >
        {/* Top: Branding matching reference */}
        <div>
          <div className="px-5 py-5 border-b border-slate-800/60 flex items-center gap-3 backdrop-blur-xs">
            {/* Small White Helmet Logo Icon */}
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 0 0-9 9c0 3.5 1.5 6.5 4 8v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1c2.5-1.5 4-4.5 4-8a9 9 0 0 0-9-9z" />
                <path d="M4 11h16" />
                <path d="M12 2v9" />
                <path d="M7 16a3 3 0 0 0 5 0" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold text-white tracking-tight leading-tight truncate">
                Smart Helmet
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide truncate">
                Violation Detection System
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3.5 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id || (item.target && activeTab === item.target && !['dashboard','detection','video','camera'].includes(activeTab));

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 text-left cursor-pointer group backdrop-blur-xs ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon
                    size={17}
                    className={`transition-colors ${
                      isSelected ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Sidebar: Cursive brand text matching reference mockup */}
        <div className="p-5 mt-auto select-none">
          <p
            className="text-white/90 text-[19px] italic tracking-wide drop-shadow-md leading-tight"
            style={{ fontFamily: "'Caveat', 'Brush Script MT', 'Dancing Script', 'Playfair Display', cursive, serif", transform: 'rotate(-2deg)' }}
          >
            Safer Roads<br />Stronger Tomorrow
          </p>
        </div>
      </aside>
    </>
  );
};
