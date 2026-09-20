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
            {/* Small Helmet Logo Image */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 border border-white/25 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
              <img
                src="/logo_helmet.jpg"
                alt="Smart Helmet"
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </div>

            {/* Horizontal Brand Text: Strictly single-line, no wrapping */}
            <div className="flex flex-col justify-center shrink-0">
              <h1 className="text-[20px] font-bold text-white tracking-tight leading-snug whitespace-nowrap drop-shadow-sm">
                Smart Helmet
              </h1>
              <p className="text-[12px] text-slate-300 font-medium tracking-tight leading-tight whitespace-nowrap drop-shadow-2xs">
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

        {/* Bottom rider graphic and AI safety monitor card matching reference */}
        <div className="mt-auto px-4 pb-4 pt-2 select-none">
          {/* Slogan */}
          <div className="mb-3 px-1">
            <div className="text-[17px] font-extrabold text-white leading-tight">Ride <span className="text-blue-400 font-bold">Safe</span></div>
            <div className="text-[15px] font-extrabold text-blue-500 leading-tight">Safer Tomorrow</div>
          </div>

          {/* AI Safety Monitor Badge */}
          <div className="p-3 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 shadow-lg">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                AI Safety Monitor
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                System Ready
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Co-DETR • Vision System
            </div>
          </div>

          {/* Footer Text */}
          <div className="text-center mt-3 text-[9px] font-bold tracking-[0.2em] text-slate-400/80 uppercase">
            SAFER ROADS • SMARTER CITIES
          </div>
        </div>
      </aside>
    </>
  );
};
