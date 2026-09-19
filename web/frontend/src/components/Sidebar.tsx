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
        className={`fixed top-0 left-0 bottom-0 z-50 w-[280px] text-slate-300 flex flex-col justify-between border-r border-slate-800/70 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(7, 15, 35, 0.64) 0%, rgba(7, 15, 35, 0.48) 30%, rgba(7, 15, 35, 0.16) 62%, rgba(7, 15, 35, 0.50) 100%), url('/sidebar_rider.jpg') center bottom / cover no-repeat"
        }}
      >
        {/* Top: Branding matching reference */}
        <div>
          <div className="px-6 pt-6 pb-5 flex items-center gap-3.5 select-none">
            {/* Small Simple White Helmet Icon inside rounded-square glass container */}
            <div className="w-[58px] h-[58px] rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 shadow-sm">
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Full-face motorcycle helmet profile facing left */}
                <path d="M19 14.5c1.2 0 2.2-.9 2.2-2.1 0-5.7-4.6-10.4-10.2-10.4S1 6.7 1 12.4c0 2.5.8 4.7 2.2 6.5l.8 2.1c.3.7 1 1 1.7 1h5.8c.8 0 1.5-.5 1.8-1.2l.9-2.2c.8.3 1.7.5 2.6.5h1.2c1 0 1.8-.8 1.8-1.8v-1.8z" />
                <path d="M4 11.5h10.5c.8 0 1.5-.6 1.5-1.4V8.3c0-1.8-1.4-3.3-3.2-3.3H7.5C5.6 5 4 6.5 4 8.3v3.2z" />
              </svg>
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-[25px] font-bold text-white tracking-tight leading-tight drop-shadow-sm">
                Smart Helmet
              </h1>
              <p className="text-[14px] text-slate-300/90 font-normal tracking-tight leading-snug drop-shadow-xs">
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
