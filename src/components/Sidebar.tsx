import React from 'react';
import {
  Home,
  CheckSquare,
  FolderKanban,
  Zap,
  Bot,
  Activity,
  Blocks,
  Settings,
  CircleDot,
} from 'lucide-react';
import type { NavItemId, UserProfile } from '../types';

interface SidebarProps {
  activeId: NavItemId;
  onSelect: (id: NavItemId) => void;
  user?: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeId,
  onSelect,
  user = {
    name: 'Alex Vance',
    email: 'alex@orbit.internal',
    initials: 'AV',
    role: 'Personal Workspace',
  },
}) => {
  const mainNavItems: { id: NavItemId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'assistant', label: 'Assistant', icon: Bot },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  const bottomNavItems: { id: NavItemId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'integrations', label: 'Integrations', icon: Blocks },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      id="desktop-sidebar"
      aria-label="Sidebar Navigation"
      className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-zinc-200/80 shrink-0 select-none sticky top-0"
    >
      {/* Top Brand / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-100">
        <button
          type="button"
          onClick={() => onSelect('home')}
          className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded-lg group"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-xs group-hover:bg-zinc-800 transition-colors">
            <CircleDot className="w-4 h-4 text-zinc-100" />
          </div>
          <div>
            <span className="text-base font-semibold text-zinc-900 tracking-tight block leading-tight">
              Orbit
            </span>
            <span className="text-[11px] text-zinc-400 font-medium tracking-wide">
              Workspace
            </span>
          </div>
        </button>
      </div>

      {/* Main Navigation (1-5) */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Navigation
        </div>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`nav-item-${item.id}`}
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-zinc-900' : 'text-zinc-500'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Navigation (6-7) */}
      <div className="px-3 py-3 border-t border-zinc-100 space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`nav-item-${item.id}`}
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-zinc-900' : 'text-zinc-500'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Profile Area */}
      <div
        id="sidebar-user-profile"
        className="p-3 border-t border-zinc-200/70 bg-zinc-50/50"
      >
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-100/70 transition-colors">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center text-xs font-semibold text-zinc-700">
              {user.initials}
            </div>
            <span
              aria-label="Online"
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate leading-tight">
              {user.name}
            </p>
            <p className="text-xs text-zinc-500 truncate mt-0.5 font-normal">
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
