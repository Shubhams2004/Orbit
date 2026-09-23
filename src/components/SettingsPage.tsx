import React, { useState, useEffect } from 'react';
import {
  User,
  Palette,
  CheckSquare,
  Sliders,
  Database,
  Bell,
  Shield,
  Info,
  Check,
  RotateCcw,
  Download,
  Trash2,
  Lock,
  ExternalLink,
  Sun,
  Moon,
  Monitor,
  AlertCircle,
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import type {
  SettingsAreaId,
  UserProfile,
  Task,
  Project,
  AppTheme,
  TaskPriority,
  TaskFilter,
  TaskSortOption,
  TimeFormat,
  WeekStartDay,
  LandingView,
  EmailDigestFrequency,
} from '../types';

interface SettingsPageProps {
  currentUser?: UserProfile;
  initialSection?: SettingsAreaId;
  onSectionChange?: (section: SettingsAreaId) => void;
  tasks?: Task[];
  projects?: Project[];
}

interface SectionMeta {
  id: SettingsAreaId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

const SECTIONS: SectionMeta[] = [
  {
    id: 'account',
    label: 'Account',
    icon: User,
    description: 'Personal profile, display name, and localization.',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Theme preference, display density, and motion effects.',
  },
  {
    id: 'tasks',
    label: 'Task Preferences',
    icon: CheckSquare,
    description: 'Defaults for task priority, views, and completion behavior.',
  },
  {
    id: 'app',
    label: 'Application',
    icon: Sliders,
    description: 'Time formatting, week starting day, and landing view.',
  },
  {
    id: 'data',
    label: 'Data & Storage',
    icon: Database,
    description: 'Workspace data export, cache management, and storage stats.',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'In-app alert banners and scheduled email digests.',
    badge: 'Preview',
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Session overview, data isolation, and RLS enforcement.',
  },
  {
    id: 'about',
    label: 'About',
    icon: Info,
    description: 'System architecture, version specs, and open license.',
  },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  initialSection = 'account',
  onSectionChange,
  tasks = [],
  projects = [],
}) => {
  const { settings, isLoading, error, updateSettings, resetSettings } = useSettings();
  const [activeSection, setActiveSection] = useState<SettingsAreaId>(initialSection);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Sync state if initialSection changes from URL deep link
  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const handleSelectSection = (id: SettingsAreaId) => {
    setActiveSection(id);
    if (onSectionChange) {
      onSectionChange(id);
    }
    // Update hash for deep-linking & browser history without reloading
    if (typeof window !== 'undefined') {
      window.location.hash = `settings-${id}`;
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  // Helper to handle partial updates with instant UI feedback (Doherty Threshold)
  const handleUpdate = async (partial: Parameters<typeof updateSettings>[0], successMsg: string) => {
    try {
      await updateSettings(partial);
      showFeedback(successMsg);
    } catch {
      showFeedback('Error saving preference. Updated locally.');
    }
  };

  // Export workspace data as JSON
  const handleExportData = () => {
    setIsExporting(true);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        version: settings.about.version,
        user: {
          name: settings.account.displayName,
          email: settings.account.email,
        },
        settings,
        metrics: {
          totalTasks: tasks.length,
          totalProjects: projects.length,
        },
        tasks,
        projects,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `orbit-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showFeedback('Workspace data exported successfully');
    } catch {
      showFeedback('Failed to export workspace data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('orbit_task_project_assignments');
        localStorage.removeItem('orbit_active_project_id');
        showFeedback('Local cache cleared. Application state refreshed.');
      } catch {
        showFeedback('Failed to clear local cache');
      }
    }
  };

  const handleConfirmReset = async () => {
    try {
      await resetSettings();
      setIsResetConfirmOpen(false);
      showFeedback('All settings reset to default values');
    } catch {
      showFeedback('Failed to reset settings');
    }
  };

  const activeMeta = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      {/* Top Header */}
      <div className="mb-6 sm:mb-8 pb-4 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configure your workspace, preferences, and account controls.
          </p>
        </div>

        {/* Global Action / Status */}
        <div className="flex items-center gap-3">
          {isLoading && (
            <span className="text-xs text-zinc-400 animate-pulse">Syncing settings…</span>
          )}
          {feedbackMessage && (
            <div
              id="settings-feedback-banner"
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg shadow-sm animate-fade-in"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{feedbackMessage}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-sm flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Notice: {error}. Preferences are operating with persistent local cache.</span>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Navigation Sidebar (Desktop 4 cols, Mobile 12 cols segmented scroll) */}
        <aside className="md:col-span-4 lg:col-span-3 w-full">
          {/* Mobile Horizontal Navigation Tab Bar */}
          <div className="md:hidden overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-2 mb-4 border-b border-zinc-200">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  id={`mobile-tab-${sec.id}`}
                  onClick={() => handleSelectSection(sec.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Vertical Navigation Menu */}
          <nav
            aria-label="Settings navigation"
            className="hidden md:flex flex-col gap-1 bg-white border border-zinc-200/80 rounded-2xl p-2 shadow-xs"
          >
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  id={`nav-settings-${sec.id}`}
                  onClick={() => handleSelectSection(sec.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
                    <span className="truncate">{sec.label}</span>
                  </div>
                  {sec.badge && (
                    <span
                      className={`text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Info Block in Sidebar (Desktop) */}
          <div className="hidden md:block mt-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 text-xs text-zinc-500 space-y-2">
            <div className="flex items-center justify-between text-zinc-700 font-medium">
              <span>Orbit Client</span>
              <span>v{settings.about.version}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Preferences are automatically synchronized with your authenticated account and local cache.
            </p>
          </div>
        </aside>

        {/* Settings Content Panel (Desktop 8-9 cols, Mobile 12 cols) */}
        <main
          id={`settings-panel-${activeSection}`}
          className="md:col-span-8 lg:col-span-9 bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-8 shadow-xs"
        >
          {/* Section Header */}
          <div className="pb-6 mb-6 border-b border-zinc-100 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <activeMeta.icon className="w-5 h-5 text-zinc-700" />
                <h2 className="text-lg sm:text-xl font-semibold text-zinc-950">
                  {activeMeta.label}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                {activeMeta.description}
              </p>
            </div>
          </div>

          {/* SECTION 1: ACCOUNT */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200/60">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white font-semibold text-base flex items-center justify-center shadow-xs">
                  {currentUser?.initials || 'AL'}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {settings.account.displayName || currentUser?.name || 'Alex Vance'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {settings.account.email || currentUser?.email || 'alex@orbit.internal'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Role: {currentUser?.role || 'Personal Assistant Workspace'}
                  </p>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-display-name" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Display Name
                  </label>
                  <input
                    id="settings-display-name"
                    type="text"
                    value={settings.account.displayName}
                    onChange={(e) =>
                      handleUpdate(
                        { account: { ...settings.account, displayName: e.target.value } },
                        'Display name updated'
                      )
                    }
                    className="w-full px-3.5 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    placeholder="Enter display name"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Used across task assignments and assistant conversations.
                  </p>
                </div>

                <div>
                  <label htmlFor="settings-timezone" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Timezone
                  </label>
                  <select
                    id="settings-timezone"
                    value={settings.account.timezone}
                    onChange={(e) =>
                      handleUpdate(
                        { account: { ...settings.account, timezone: e.target.value } },
                        'Timezone updated'
                      )
                    }
                    className="w-full px-3.5 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London (GMT / BST)</option>
                    <option value="Europe/Paris">Paris, Berlin, Rome (CET)</option>
                    <option value="Asia/Tokyo">Tokyo, Osaka (JST)</option>
                    <option value="Asia/Kolkata">India Standard Time (IST)</option>
                    <option value="Australia/Sydney">Sydney, Melbourne (AEST)</option>
                  </select>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Controls due date triggers and time formatting.
                  </p>
                </div>
              </div>

              {/* Email Address Read-Only */}
              <div className="pt-4 border-t border-zinc-100">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Account Email
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/60 text-xs text-zinc-600">
                  <span>{settings.account.email}</span>
                  <span className="text-[11px] text-zinc-400 font-medium">Managed by Authentication</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: APPEARANCE */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-3">
                  Color Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'system' as AppTheme, label: 'System', icon: Monitor },
                    { id: 'light' as AppTheme, label: 'Light', icon: Sun },
                    { id: 'dark' as AppTheme, label: 'Dark', icon: Moon },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = settings.appearance.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        id={`theme-opt-${t.id}`}
                        onClick={() =>
                          handleUpdate(
                            { appearance: { ...settings.appearance, theme: t.id } },
                            `Theme changed to ${t.label}`
                          )
                        }
                        className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-zinc-100' : 'text-zinc-500'}`} />
                        <span className="text-xs font-medium">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  System theme automatically matches your operating system display settings.
                </p>
              </div>

              {/* Display Density Toggles */}
              <div className="pt-4 border-t border-zinc-100 space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-900">Compact Density</h4>
                    <p className="text-xs text-zinc-500">
                      Reduces row padding in Task and Project lists for information-dense views.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="toggle-compact-mode"
                    onClick={() =>
                      handleUpdate(
                        { appearance: { ...settings.appearance, compactMode: !settings.appearance.compactMode } },
                        settings.appearance.compactMode ? 'Compact mode disabled' : 'Compact mode enabled'
                      )
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
                      settings.appearance.compactMode ? 'bg-zinc-900' : 'bg-zinc-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.appearance.compactMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-900">Reduced Motion</h4>
                    <p className="text-xs text-zinc-500">
                      Disables non-essential animated transitions across modal dialogs and cards.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="toggle-reduced-motion"
                    onClick={() =>
                      handleUpdate(
                        { appearance: { ...settings.appearance, reducedMotion: !settings.appearance.reducedMotion } },
                        settings.appearance.reducedMotion ? 'Reduced motion disabled' : 'Reduced motion enabled'
                      )
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
                      settings.appearance.reducedMotion ? 'bg-zinc-900' : 'bg-zinc-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.appearance.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: TASK PREFERENCES */}
          {activeSection === 'tasks' && (
            <div className="space-y-6">
              {/* Default Priority */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  Default Task Priority
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['High priority', 'Medium priority', 'Low priority'] as TaskPriority[]).map((p) => {
                    const isSelected = settings.tasks.defaultPriority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        id={`task-pref-prio-${p.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() =>
                          handleUpdate(
                            { tasks: { ...settings.tasks, defaultPriority: p } },
                            `Default priority set to ${p}`
                          )
                        }
                        className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Pre-populates new task creation dialogs and quick-add inputs.
                </p>
              </div>

              {/* Default Filter & Sorting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                <div>
                  <label htmlFor="settings-default-view" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Default Task Filter View
                  </label>
                  <select
                    id="settings-default-view"
                    value={settings.tasks.defaultView}
                    onChange={(e) =>
                      handleUpdate(
                        { tasks: { ...settings.tasks, defaultView: e.target.value as TaskFilter } },
                        'Default task view updated'
                      )
                    }
                    className="w-full px-3.5 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="all">All Tasks</option>
                    <option value="today">Today Only</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="settings-default-sort" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Default Sort Order
                  </label>
                  <select
                    id="settings-default-sort"
                    value={settings.tasks.defaultSort}
                    onChange={(e) =>
                      handleUpdate(
                        { tasks: { ...settings.tasks, defaultSort: e.target.value as TaskSortOption } },
                        'Default sort updated'
                      )
                    }
                    className="w-full px-3.5 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="due_date">Due Date</option>
                    <option value="priority">Priority</option>
                    <option value="title">Title (Alphabetical)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-4 border-t border-zinc-100 space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-900">Show Completed Tasks</h4>
                    <p className="text-xs text-zinc-500">
                      Display finished tasks with strike-through styling in active task lists.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="toggle-show-completed"
                    onClick={() =>
                      handleUpdate(
                        { tasks: { ...settings.tasks, showCompleted: !settings.tasks.showCompleted } },
                        settings.tasks.showCompleted ? 'Completed tasks hidden' : 'Completed tasks shown'
                      )
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
                      settings.tasks.showCompleted ? 'bg-zinc-900' : 'bg-zinc-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.tasks.showCompleted ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-900">Auto-Archive Completed</h4>
                    <p className="text-xs text-zinc-500">
                      Automatically archive tasks older than 7 days from project workspaces.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="toggle-auto-archive"
                    onClick={() =>
                      handleUpdate(
                        { tasks: { ...settings.tasks, autoArchive: !settings.tasks.autoArchive } },
                        settings.tasks.autoArchive ? 'Auto-archive disabled' : 'Auto-archive enabled'
                      )
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
                      settings.tasks.autoArchive ? 'bg-zinc-900' : 'bg-zinc-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.tasks.autoArchive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: APPLICATION PREFERENCES */}
          {activeSection === 'app' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Time Format */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2">
                    Time Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: '12h' as TimeFormat, label: '12-Hour (AM/PM)' },
                      { id: '24h' as TimeFormat, label: '24-Hour' },
                    ].map((f) => {
                      const isSelected = settings.app.timeFormat === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          id={`time-format-${f.id}`}
                          onClick={() =>
                            handleUpdate(
                              { app: { ...settings.app, timeFormat: f.id } },
                              `Time format set to ${f.label}`
                            )
                          }
                          className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Week Start */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2">
                    Start of the Week
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'monday' as WeekStartDay, label: 'Monday' },
                      { id: 'sunday' as WeekStartDay, label: 'Sunday' },
                    ].map((w) => {
                      const isSelected = settings.app.weekStart === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          id={`week-start-${w.id}`}
                          onClick={() =>
                            handleUpdate(
                              { app: { ...settings.app, weekStart: w.id } },
                              `Week start set to ${w.label}`
                            )
                          }
                          className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Default Landing View */}
              <div className="pt-4 border-t border-zinc-100">
                <label htmlFor="settings-landing-view" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Default Landing View
                </label>
                <select
                  id="settings-landing-view"
                  value={settings.app.defaultLandingView}
                  onChange={(e) =>
                    handleUpdate(
                      { app: { ...settings.app, defaultLandingView: e.target.value as LandingView } },
                      'Default landing view updated'
                    )
                  }
                  className="w-full sm:w-1/2 px-3.5 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="home">Home (Overview Dashboard)</option>
                  <option value="tasks">Tasks View</option>
                  <option value="projects">Projects Grid</option>
                  <option value="assistant">Assistant Workspace</option>
                </select>
                <p className="text-[11px] text-zinc-400 mt-1">
                  The initial screen shown when opening Orbit without a deep link.
                </p>
              </div>

              {/* Sidebar Default State */}
              <div className="pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-900">Collapse Desktop Sidebar</h4>
                    <p className="text-xs text-zinc-500">
                      Maximize canvas space by keeping the navigation bar collapsed by default.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="toggle-sidebar-collapsed"
                    onClick={() =>
                      handleUpdate(
                        { app: { ...settings.app, sidebarCollapsed: !settings.app.sidebarCollapsed } },
                        settings.app.sidebarCollapsed ? 'Sidebar expanded' : 'Sidebar collapsed'
                      )
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
                      settings.app.sidebarCollapsed ? 'bg-zinc-900' : 'bg-zinc-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.app.sidebarCollapsed ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: DATA & STORAGE */}
          {activeSection === 'data' && (
            <div className="space-y-6">
              {/* Workspace Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
                  <div className="text-xs text-zinc-500">Active Tasks</div>
                  <div className="text-lg font-bold text-zinc-900 mt-0.5">{tasks.length}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
                  <div className="text-xs text-zinc-500">Total Projects</div>
                  <div className="text-lg font-bold text-zinc-900 mt-0.5">{projects.length}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60 col-span-2 sm:col-span-1">
                  <div className="text-xs text-zinc-500">Local Storage Cache</div>
                  <div className="text-lg font-bold text-zinc-900 mt-0.5">Optimized</div>
                </div>
              </div>

              {/* Export Data Action */}
              <div className="p-4 rounded-xl border border-zinc-200/80 bg-white space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">Export Workspace Data</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Download a JSON backup of all your tasks, projects, assignments, and preference settings.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="export-data-btn"
                    disabled={isExporting}
                    onClick={handleExportData}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExporting ? 'Exporting…' : 'Export JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Clear Local Cache */}
              <div className="p-4 rounded-xl border border-zinc-200/80 bg-white space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">Clear Local Storage Cache</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Purges cached offline task-project indices and refreshes synchronized state from Supabase.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="clear-cache-btn"
                    onClick={handleClearCache}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Clear Cache</span>
                  </button>
                </div>
              </div>

              {/* Informational Stage Notice */}
              <div className="p-3.5 rounded-xl bg-zinc-50 text-xs text-zinc-500 border border-zinc-200/60 leading-relaxed">
                Automated cloud backup schedules and external migration workflows will be enabled in subsequent platform releases.
              </div>
            </div>
          )}

          {/* SECTION 6: NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              {/* In-App Alerts Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-900">In-App Alert Banners</h4>
                  <p className="text-xs text-zinc-500">
                    Display transient feedback banners for task status changes and workspace operations.
                  </p>
                </div>
                <button
                  type="button"
                  id="toggle-in-app-alerts"
                  onClick={() =>
                    handleUpdate(
                      { notifications: { ...settings.notifications, inAppAlerts: !settings.notifications.inAppAlerts } },
                      settings.notifications.inAppAlerts ? 'In-app alerts disabled' : 'In-app alerts enabled'
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
                    settings.notifications.inAppAlerts ? 'bg-zinc-900' : 'bg-zinc-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.notifications.inAppAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email Digest */}
              <div className="pt-4 border-t border-zinc-100">
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  Email Summary Digest
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['never', 'daily', 'weekly'] as EmailDigestFrequency[]).map((freq) => {
                    const isSelected = settings.notifications.emailDigest === freq;
                    return (
                      <button
                        key={freq}
                        type="button"
                        id={`digest-opt-${freq}`}
                        onClick={() =>
                          handleUpdate(
                            { notifications: { ...settings.notifications, emailDigest: freq } },
                            `Email digest set to ${freq}`
                          )
                        }
                        className={`px-3 py-2 text-xs font-medium rounded-xl border capitalize transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        {freq}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Receive periodic task overviews and overdue notifications directly in your inbox.
                </p>
              </div>

              {/* Future Implementation Note */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 text-xs text-zinc-500 space-y-1.5 leading-relaxed">
                <div className="font-semibold text-zinc-700">Notification Delivery Engine</div>
                <p>
                  Preference choices are saved now to your user profile. The background notification worker and email dispatch services will be provisioned in a future milestone.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 7: SECURITY */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              {/* Session Overview Card */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-zinc-900">Current Session Active</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Provider: {settings.security.provider || 'Supabase Auth'}
                  </span>
                </div>
                <div className="text-xs text-zinc-600">
                  Authenticated User: <span className="font-medium text-zinc-900">{settings.account.email}</span>
                </div>
              </div>

              {/* Row Level Security Status */}
              <div className="p-4 rounded-xl border border-zinc-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-900">Database Row Level Security</h4>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  PostgreSQL Row Level Security (RLS) is active on your workspace records. All task items, project entities, and user preference rows are isolated to your authenticated account credentials.
                </p>
              </div>

              {/* Security Best Practices Notice */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 text-xs text-zinc-500 space-y-2 leading-relaxed">
                <div className="font-semibold text-zinc-700">Zero-Credential Architecture</div>
                <p>
                  Orbit adheres strictly to a zero-credential user preference policy: API keys, external tokens, and plaintext passwords are never stored in user settings records.
                </p>
                <p className="text-[11px] text-zinc-400">
                  Multi-factor authentication (MFA) and granular API scope controls will be introduced in upcoming security modules.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 8: ABOUT */}
          {activeSection === 'about' && (
            <div className="space-y-6">
              {/* App Overview */}
              <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950">Orbit</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">AI Personal Assistant & Task Automation Workspace</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-zinc-200 text-zinc-800">
                      v{settings.about.version}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-zinc-200/60">
                  <div>
                    <span className="text-zinc-400 block">Environment</span>
                    <span className="font-medium text-zinc-800 capitalize">{settings.about.environment}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Build Date</span>
                    <span className="font-medium text-zinc-800">{settings.about.buildDate}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">License</span>
                    <span className="font-medium text-zinc-800">{settings.about.license}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Documentation</span>
                    <a
                      href={settings.about.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-zinc-900 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Guides</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Technical Stack Specifications */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-700">Technology Architecture</h4>
                <div className="p-4 rounded-xl border border-zinc-200/80 text-xs text-zinc-600 space-y-2">
                  <div className="flex justify-between py-1 border-b border-zinc-100">
                    <span className="text-zinc-500">Frontend Core</span>
                    <span className="font-mono text-zinc-900">React 19 + TypeScript + Tailwind CSS</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100">
                    <span className="text-zinc-500">Bundler / Dev Engine</span>
                    <span className="font-mono text-zinc-900">Vite 8</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-100">
                    <span className="text-zinc-500">Persistence / Database</span>
                    <span className="font-mono text-zinc-900">Supabase (PostgreSQL + RLS)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Design Standard</span>
                    <span className="font-mono text-zinc-900">Zero-Pill Minimalist Monochrome</span>
                  </div>
                </div>
              </div>

              {/* Reset All Settings Button */}
              <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-900">Reset Preferences</h4>
                  <p className="text-xs text-zinc-500">
                    Revert all workspace settings back to system defaults.
                  </p>
                </div>
                <button
                  type="button"
                  id="reset-settings-btn"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Reset to Defaults</span>
                </button>
              </div>

              {/* Confirmation Dialog */}
              {isResetConfirmOpen && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-3">
                  <p className="font-semibold">
                    Are you sure you want to restore default settings? Your custom preferences will be reset.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="confirm-reset-btn"
                      onClick={handleConfirmReset}
                      className="px-3 py-1.5 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Yes, Reset Settings
                    </button>
                    <button
                      type="button"
                      id="cancel-reset-btn"
                      onClick={() => setIsResetConfirmOpen(false)}
                      className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
