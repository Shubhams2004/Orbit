import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { HomePage } from './HomePage';
import { TasksPage } from './TasksPage';
import { AssistantPage } from './AssistantPage';
import { initialTasks } from '../mockData';
import { isSupabaseConfigured, supabaseTaskService } from '../lib/supabase';
import type { NavItemId, UserProfile, Task } from '../types';

export const AppShell: React.FC = () => {
  const [activeNavId, setActiveNavId] = useState<NavItemId>('home');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  const currentUser: UserProfile = {
    name: 'Alex',
    email: 'alex@orbit.internal',
    initials: 'AL',
    role: 'Personal Assistant Workspace',
  };

  // Load tasks from Supabase on mount
  useEffect(() => {
    if (isConfigured) {
      setIsLoadingTasks(true);
      supabaseTaskService
        .fetchTasks()
        .then((fetchedTasks) => {
          setTasks(fetchedTasks);
          setSyncError(null);
        })
        .catch((err) => {
          console.error('Failed to load tasks from Supabase:', err);
          const msg = err instanceof Error ? err.message : 'Could not fetch tasks.';
          setSyncError(`Supabase connection error: ${msg}`);
          setTasks([]);
        })
        .finally(() => {
          setIsLoadingTasks(false);
        });
    } else {
      setSyncError(
        'Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are provided.'
      );
      setTasks([]);
    }
  }, [isConfigured]);

  const handleToggleTask = async (id: string) => {
    if (!isConfigured) {
      setSyncError('Cannot update task: Supabase connection is not configured.');
      return;
    }

    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const newCompleted = !target.completed;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t))
    );

    try {
      await supabaseTaskService.toggleTaskStatus(id, newCompleted);
      setSyncError(null);
    } catch (err) {
      console.error('Supabase toggle task status error:', err);
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !newCompleted } : t))
      );
      const msg = err instanceof Error ? err.message : 'Failed to update task status in Supabase.';
      setSyncError(`Database error: ${msg}`);
    }
  };

  const handleAddTask = async (data: Omit<Task, 'id' | 'completed'>) => {
    if (!isConfigured) {
      setSyncError(
        'Cannot create task: Supabase connection is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
      return;
    }

    try {
      const createdTask = await supabaseTaskService.createTask(data);
      setTasks((prev) => [createdTask, ...prev]);
      setSyncError(null);
    } catch (err) {
      console.error('Supabase create task error:', err);
      const errorMsg =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to create task in Supabase.';
      setSyncError(`Database error: ${errorMsg}`);
    }
  };

  const handleUpdateTask = async (updated: Task) => {
    if (!isConfigured) {
      setSyncError('Cannot edit task: Supabase connection is not configured.');
      return;
    }

    const prevTasks = tasks;
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    try {
      await supabaseTaskService.updateTask(updated);
      setSyncError(null);
    } catch (err) {
      console.error('Supabase update task error:', err);
      setTasks(prevTasks);
      const msg = err instanceof Error ? err.message : 'Failed to update task in Supabase.';
      setSyncError(`Database error: ${msg}`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!isConfigured) {
      setSyncError('Cannot delete task: Supabase connection is not configured.');
      return;
    }

    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await supabaseTaskService.deleteTask(id);
      setSyncError(null);
    } catch (err) {
      console.error('Supabase delete task error:', err);
      setTasks(prevTasks);
      const msg = err instanceof Error ? err.message : 'Failed to delete task from Supabase.';
      setSyncError(`Database error: ${msg}`);
    }
  };

  const sectionTitles: Record<NavItemId, { title: string; subtitle: string }> = {
    home: { title: 'Home', subtitle: 'Overview' },
    tasks: { title: 'Tasks', subtitle: 'Organize everything you need to get done.' },
    automations: { title: 'Automations', subtitle: 'Automations engine (Upcoming in Step 5)' },
    assistant: { title: 'Assistant', subtitle: 'Your personal assistant for tasks, planning, and automation.' },
    activity: { title: 'Activity', subtitle: 'Recent system activity (Upcoming in Step 5)' },
    integrations: { title: 'Integrations', subtitle: 'Connected services (Upcoming in Step 5)' },
    settings: { title: 'Settings', subtitle: 'Workspace preferences (Upcoming in Step 5)' },
  };

  return (
    <div
      id="orbit-app-shell"
      className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row text-zinc-900 font-sans antialiased"
    >
      {/* Responsive Mobile Navigation */}
      <MobileNavigation
        isOpen={isMobileNavOpen}
        onToggle={() => setIsMobileNavOpen((prev) => !prev)}
        onClose={() => setIsMobileNavOpen(false)}
        activeId={activeNavId}
        onSelect={setActiveNavId}
        user={currentUser}
      />

      {/* Desktop Left Sidebar */}
      <Sidebar
        activeId={activeNavId}
        onSelect={setActiveNavId}
        user={currentUser}
      />

      {/* Main Content Area */}
      <main
        id="main-content-area"
        className="flex-1 flex flex-col min-h-screen overflow-y-auto"
      >
        {/* Desktop breadcrumb header */}
        <div className="hidden md:flex h-14 border-b border-zinc-200/70 px-8 items-center justify-between bg-white/70 backdrop-blur-xs sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <button
              type="button"
              onClick={() => setActiveNavId('home')}
              className="text-zinc-700 font-semibold hover:text-zinc-950 transition-colors cursor-pointer"
            >
              Orbit
            </button>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-800 capitalize">
              {sectionTitles[activeNavId].title}
            </span>
          </div>

          {/* Database connection status pill */}
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <span
                id="supabase-status-connected"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase connected</span>
              </span>
            ) : (
              <span
                id="supabase-status-local"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200/70"
                title="Configured via VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                <span>Database: Local state</span>
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex-1 flex ${
            activeNavId === 'assistant' ? 'items-stretch' : 'items-start'
          } justify-center p-4 sm:p-6 lg:p-8`}
        >
          {activeNavId === 'home' ? (
            <HomePage
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onNavigateToTasks={() => setActiveNavId('tasks')}
            />
          ) : activeNavId === 'tasks' ? (
            <TasksPage
              tasks={tasks}
              isLoading={isLoadingTasks}
              syncError={syncError}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          ) : activeNavId === 'assistant' ? (
            <AssistantPage />
          ) : (
            <div
              id={`section-${activeNavId}`}
              className="w-full max-w-lg mx-auto text-center p-8 bg-white border border-zinc-200/80 rounded-2xl shadow-xs mt-8"
            >
              <h2 className="text-xl font-semibold text-zinc-900">
                {sectionTitles[activeNavId].title}
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                {sectionTitles[activeNavId].subtitle}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  id="return-home-btn"
                  onClick={() => setActiveNavId('home')}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
