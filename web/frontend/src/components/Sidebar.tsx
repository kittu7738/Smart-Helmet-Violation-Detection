import React from 'react';
import {
  Home,
  Camera,
  PlayCircle,
  Video,
  BarChart3,
  FileText,
  Database,
  Cpu,
  Settings
} from 'lucide-react';
import { NavTab } from './Navigation';

interface SidebarProps {
  activeTab: NavTab | 'violations' | 'reports' | 'dataset' | 'model';
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
    { id: 'dataset', label: 'Dataset', icon: Database, target: 'about' },
    { id: 'model', label: 'Model', icon: Cpu, target: 'about' },
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
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white text-slate-700 flex flex-col justify-between border-r border-slate-200/90 shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: '#FFFFFF'
        }}
      >
        {/* Top: Logo & Branding */}
        <div>
          <div className="px-5 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white border border-slate-200/90 flex items-center justify-center shadow-sm shrink-0 p-1">
              <img
                src="/logo_helmet.jpg"
                alt="Smart Helmet Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-[16px] font-black text-slate-900 tracking-tight leading-tight truncate">
                Smart Helmet
              </h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate">
                Violation Detection System
              </p>
            </div>
          </div>

          {/* Navigation Links — Clean Light Pill Styling */}
          <nav className="px-3.5 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id || (item.target && activeTab === item.target && !['dashboard','detection','video','camera'].includes(activeTab));

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 text-left cursor-pointer group ${
                    isSelected
                      ? 'bg-[#EBF2FE] text-[#1D4ED8] font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon
                    size={18}
                    className={`transition-colors shrink-0 ${
                      isSelected ? 'text-[#1D4ED8]' : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Rider Safety Graphic from Screenshot */}
        <div className="p-3.5 mt-auto">
          <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-950">
            <img
              src="/sidebar_bottom_graphic.png"
              alt="Helmet Today Safer Tomorrow"
              className="w-full h-auto object-cover block"
            />
          </div>
        </div>
      </aside>
    </>
  );
};
