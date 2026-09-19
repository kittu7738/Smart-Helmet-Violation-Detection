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
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#070D1E] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #070D1E 0%, #0A142F 50%, #060B1A 100%)'
        }}
      >
        {/* Top: Logo & Branding */}
        <div>
          <div className="px-6 py-6 border-b border-slate-800/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              {/* Minimalist Helmet Icon */}
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

        {/* Bottom Section: Futuristic Rider Graphic & Slogan */}
        <div className="p-4 mt-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/80 to-blue-950/40 border border-blue-500/20 p-4 text-center">
            {/* Glowing neon vector profile of helmet rider */}
            <div className="flex justify-center mb-2">
              <svg width="100" height="90" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]">
                {/* Outer glowing helmet visor profile */}
                <circle cx="48" cy="40" r="32" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3" opacity="0.4" />
                <path
                  d="M24 48C22 35 28 22 42 16C58 10 74 16 80 30C84 38 82 48 76 54C70 60 56 64 44 64C36 64 28 58 24 48Z"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Visor shield */}
                <path
                  d="M48 26C58 24 70 28 74 36C76 40 74 46 68 50C62 53 52 52 46 48C42 45 42 32 48 26Z"
                  fill="url(#visorGrad)"
                  stroke="#00E5FF"
                  strokeWidth="2"
                />
                {/* Chin strap & neck guard */}
                <path
                  d="M34 52L30 68C30 72 34 76 42 78L58 78C64 78 68 74 66 68L64 56"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Shoulder armor lines */}
                <path
                  d="M16 86C20 78 30 74 40 76L60 76C70 74 80 78 84 86"
                  stroke="#0284C7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Glowing neon accents */}
                <circle cx="66" cy="38" r="2.5" fill="#38BDF8" />
                <path d="M50 34L64 36" stroke="#E0F2FE" strokeWidth="1.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="visorGrad" x1="42" y1="26" x2="74" y2="52" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0284C7" stopOpacity="0.8" />
                    <stop offset="1" stopColor="#06B6D4" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Stylized Motto text matching mockup */}
            <p
              className="text-[13px] font-semibold text-cyan-300 leading-snug tracking-wide"
              style={{
                fontFamily: '"Caveat", "Brush Script MT", "Segoe Script", cursive',
                textShadow: '0 0 10px rgba(56, 189, 248, 0.4)'
              }}
            >
              Safer Roads<br />
              <span className="text-sky-200">Stronger Tomorrow</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
