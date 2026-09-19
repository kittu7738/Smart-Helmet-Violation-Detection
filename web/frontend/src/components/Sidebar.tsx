import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Video,
  Camera,
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
    { id: 'detection', label: 'Detection', icon: ScanLine },
    { id: 'video', label: 'Video Analysis', icon: Video },
    { id: 'camera', label: 'Live Camera', icon: Camera },
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
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#070D1E] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(7, 13, 30, 0.90) 0%, rgba(10, 20, 47, 0.88) 55%, rgba(6, 11, 26, 0.96) 100%), url('/sidebar_rider.jpg') center/cover no-repeat"
        }}
      >
        {/* Top: Logo & Branding */}
        <div>
          <div className="px-5 py-5 border-b border-slate-800/60 flex items-center gap-3 backdrop-blur-xs bg-slate-950/40">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              <img
                src="/logo_helmet.jpg"
                alt="Smart Helmet Logo"
                className="w-full h-full object-cover"
              />
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
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
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

        {/* Bottom Section: Real Rider Photo Card & Slogan */}
        <div className="p-4 mt-auto">
          <div className="relative overflow-hidden rounded-2xl border border-blue-400/30 shadow-xl group">
            {/* Real rider photo at sunset */}
            <div className="h-36 w-full relative">
              <img
                src="/sidebar_rider.jpg"
                alt="Rider Safety"
                className="w-full h-full object-cover object-center brightness-90 contrast-105 transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              
              {/* Motto text on the photo */}
              <div className="absolute bottom-2.5 inset-x-0 text-center px-3">
                <p
                  className="text-[14px] font-bold text-amber-300 leading-snug tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  style={{
                    fontFamily: '"Caveat", "Brush Script MT", "Segoe Script", cursive',
                    textShadow: '0 0 12px rgba(251, 191, 36, 0.6)'
                  }}
                >
                  Safer Roads<br />
                  <span className="text-sky-200">Stronger Tomorrow</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
