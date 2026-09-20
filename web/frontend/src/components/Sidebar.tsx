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
        className={`fixed top-0 left-0 bottom-0 z-50 w-[280px] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 bg-[#0A1128] transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(10, 17, 40, 0.98) 0%, rgba(10, 17, 40, 0.92) 40%, rgba(10, 17, 40, 0.76) 75%, rgba(10, 17, 40, 0.92) 100%), url('/sidebar_rider.jpg') center bottom / cover no-repeat"
        }}
      >
        {/* Top: Compact horizontal branding matching reference exactly */}
        <div>
          <div className="px-5 py-4 flex flex-row items-center gap-3 select-none border-b border-white/10">
            {/* Standalone Helmet Image directly on dark navy sidebar - NO BOX, NO BORDER, NO CARD */}
            <img
              src="/logo_helmet.png"
              alt="Smart Helmet Logo"
              className="h-11 sm:h-12 w-auto object-contain shrink-0 select-none pointer-events-none"
            />

            {/* Horizontal Brand Text: Strictly single-line, no wrapping */}
            <div className="flex flex-col justify-center shrink-0">
              <h1 className="text-[18px] sm:text-[19px] font-bold text-white tracking-tight leading-snug whitespace-nowrap drop-shadow-sm">
                Smart Helmet
              </h1>
              <p className="text-[11px] sm:text-[12px] text-slate-300 font-medium tracking-tight leading-tight whitespace-nowrap drop-shadow-2xs">
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

        {/* Bottom rider graphic slogan */}
        <div className="mt-auto px-5 pb-6 pt-2 select-none">
          {/* Slogan */}
          <div className="px-1">
            <div className="text-[17px] font-extrabold text-white leading-tight">Ride <span className="text-blue-400 font-bold">Safe</span></div>
            <div className="text-[15px] font-extrabold text-blue-500 leading-tight">Safer Tomorrow</div>
          </div>
        </div>
      </aside>
    </>
  );
};
