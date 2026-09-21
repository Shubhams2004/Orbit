import React, { useEffect } from 'react';
import {
  Menu,
  X,
  CircleDot,
  Home,
  CheckSquare,
  Zap,
  Bot,
  Activity,
  Blocks,
  Settings,
} from 'lucide-react';
import type { NavItemId, UserProfile } from '../types';

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  activeId: NavItemId;
  onSelect: (id: NavItemId) => void;
  user?: UserProfile;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onToggle,
  onClose,
  activeId,
  onSelect,
  user = {
    name: 'Alex Vance',
    email: 'alex@orbit.internal',
    initials: 'AV',
  },
}) => {
  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const mainNavItems: { id: NavItemId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'assistant', label: 'Assistant', icon: Bot },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  const bottomNavItems: { id: NavItemId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'integrations', label: 'Integrations', icon: Blocks },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleItemClick = (id: NavItemId) => {
    onSelect(id);
    onClose();
  };

  const getActiveTitle = () => {
    const all = [...mainNavItems, ...bottomNavItems];
    return all.find((item) => item.id === activeId)?.label || 'Orbit';
  };

  return (
    <div className="md:hidden">
      {/* Mobile Top Header */}
      <header
        id="mobile-header"
        className="h-14 bg-white border-b border-zinc-200/80 px-4 flex items-center justify-between sticky top-0 z-30"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-xs">
            <CircleDot className="w-3.5 h-3.5 text-zinc-100" />
          </div>
          <span className="font-semibold text-zinc-900 tracking-tight text-sm">
            Orbit
          </span>
          <span className="text-zinc-300">/</span>
          <span className="text-xs font-medium text-zinc-500 capitalize">
            {getActiveTitle()}
          </span>
        </div>

        <button
          type="button"
          id="mobile-menu-toggle-btn"
          onClick={onToggle}
          aria-label={isOpen ? 'Close menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          className="p-2 -mr-1 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 cursor-pointer"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          id="mobile-drawer-backdrop"
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 bg-zinc-900/30 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Drawer Panel */}
      <nav
        id="mobile-drawer-panel"
        aria-label="Mobile Navigation"
        className={`fixed top-0 bottom-0 left-0 w-4/5 max-w-xs bg-white z-50 shadow-xl flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
                <CircleDot className="w-4 h-4 text-zinc-100" />
              </div>
              <span className="font-semibold text-zinc-900 text-base">Orbit</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Navigation
            </div>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`mobile-nav-item-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-3 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Workspace
            </div>
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`mobile-nav-item-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Profile in Mobile Drawer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center text-xs font-semibold text-zinc-700">
                {user.initials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};
