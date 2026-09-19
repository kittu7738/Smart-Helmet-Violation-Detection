import React from 'react';
import {
  Home,
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
    { id: 'dashboard', label: 'Dashboard', icon: Home },
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
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#070D1E] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #070D1E 0%, #0A142F 50%, #060B1A 100%)'
        }}
      >
        {/* Top: Logo & Branding */}
        <div>
          <div className="px-5 py-5 border-b border-slate-800/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 text-left cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
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

        {/* Bottom Section: Hero Helmet Visual matching Reference 4 */}
        <div className="p-4 mt-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-blue-950/60 to-slate-950/90 border border-blue-500/20 p-4 text-left">
            {/* Glowing blue radial backdrop behind helmet */}
            <div
              className="absolute -top-4 -left-4 w-40 h-40 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(37, 99, 235, 0.45) 0%, rgba(6, 182, 212, 0.15) 50%, transparent 70%)',
                filter: 'blur(16px)'
              }}
            />

            {/* Prominent White/Blue Helmet Image */}
            <div className="relative w-full flex justify-center mb-3">
              <img
                src="/helmet_hero.png"
                alt="Smart Helmet"
                className="w-28 h-28 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.6)]"
              />
            </div>

            {/* Typography matching reference */}
            <div className="relative">
              <h3 className="text-sm font-extrabold text-white leading-tight">
                Ride Safe
              </h3>
              <p className="text-sm font-extrabold text-sky-400 leading-tight">
                Stay Protected
              </p>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                <span>Safer Roads</span>
                <span className="text-slate-600">•</span>
                <span>Brighter Tomorrow</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
