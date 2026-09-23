import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { HomePage } from './HomePage';
import { TasksPage } from './TasksPage';
import { ProjectsPage } from './ProjectsPage';
import { ProjectWorkspace } from './ProjectWorkspace';
import { AssistantPage } from './AssistantPage';
import { SettingsPage } from './SettingsPage';
import { initialTasks, initialProjects } from '../mockData';
import { isSupabaseConfigured, supabaseTaskService, supabaseProjectService } from '../lib/supabase';
import type { NavItemId, UserProfile, Task, Project, SettingsAreaId } from '../types';

export const AppShell: React.FC = () => {
  const getInitialProjectId = (): string | null => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#project-')) {
        return hash.replace('#project-', '');
      }
      try {
        const stored = localStorage.getItem('orbit_active_project_id');
        if (stored) return stored;
      } catch {
        // ignore
      }
    }
    return null;
  };

  const getInitialSettingsSection = (): SettingsAreaId | null => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#settings-')) {
        return hash.replace('#settings-', '') as SettingsAreaId;
      }
      if (hash === '#settings') {
        return 'account';
      }
    }
    return null;
  };

  const initialProjId = getInitialProjectId();
  const initialSettingsSec = getInitialSettingsSection();
  const [activeNavId, setActiveNavId] = useState<NavItemId>(
    initialProjId ? 'projects' : initialSettingsSec ? 'settings' : 'home'
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjId);
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsAreaId>(
    initialSettingsSec || 'account'
  );

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectSyncError, setProjectSyncError] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  const currentUser: UserProfile = {
    name: 'Alex',
    email: 'alex@orbit.internal',
    initials: 'AL',
    role: 'Personal Assistant Workspace',
  };

  // Sync selectedProjectId with window.location.hash and localStorage (data persists after refresh)
  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
    if (typeof window !== 'undefined') {
      try {
        if (projectId) {
          localStorage.setItem('orbit_active_project_id', projectId);
          window.location.hash = `project-${projectId}`;
        } else {
          localStorage.removeItem('orbit_active_project_id');
          if (window.location.hash.startsWith('#project-')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } catch {
        // ignore
      }
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#project-')) {
        const pId = hash.replace('#project-', '');
        setSelectedProjectId(pId);
        setActiveNavId('projects');
      } else if (selectedProjectId && !hash.startsWith('#project-')) {
        setSelectedProjectId(null);
      }

      if (hash.startsWith('#settings')) {
        setActiveNavId('settings');
        if (hash.startsWith('#settings-')) {
          setActiveSettingsSection(hash.replace('#settings-', '') as SettingsAreaId);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [selectedProjectId]);

  const handleNavSelect = (id: NavItemId) => {
    if (id === 'projects' && activeNavId === 'projects' && selectedProjectId) {
      handleSelectProject(null);
    } else {
      setActiveNavId(id);
      if (id !== 'projects') {
        handleSelectProject(null);
      }
      if (id === 'settings') {
        if (typeof window !== 'undefined') {
          window.location.hash = `settings-${activeSettingsSection}`;
        }
      } else if (typeof window !== 'undefined' && window.location.hash.startsWith('#settings')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  };

  // Load tasks from Supabase on mount
  useEffect(() => {
    if (isConfigured) {
      setIsLoadingTasks(true);
      supabaseTaskService
        .fetchTasks()
        .then((fetchedTasks) => {
          setTasks(fetchedTasks.length > 0 ? fetchedTasks : initialTasks);
          setSyncError(null);
        })
        .catch((err) => {
          console.warn('Failed to load tasks from Supabase:', err);
          const msg = err instanceof Error ? err.message : 'Could not fetch tasks.';
          setSyncError(`Supabase notice: ${msg}. Displaying local task data.`);
          setTasks(initialTasks);
        })
        .finally(() => {
          setIsLoadingTasks(false);
        });
    } else {
      setTasks(initialTasks);
    }
  }, [isConfigured]);

  // Load projects from Supabase on mount
  useEffect(() => {
    if (isConfigured) {
      setIsLoadingProjects(true);
      supabaseProjectService
        .fetchProjects()
        .then((fetchedProjects) => {
          setProjects(fetchedProjects);
          setProjectSyncError(null);
        })
        .catch((err) => {
          console.warn('Projects table not reachable or empty in Supabase:', err);
          const msg = err instanceof Error ? err.message : 'Could not fetch projects.';
          setProjectSyncError(
            `Supabase project sync notice: ${msg}. Displaying local project data.`
          );
          setProjects(initialProjects);
        })
        .finally(() => {
          setIsLoadingProjects(false);
        });
    } else {
      setProjects(initialProjects);
    }
  }, [isConfigured]);

  const handleToggleTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const newCompleted = !target.completed;

    // Optimistic UI update (Doherty Threshold)
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t))
    );

    if (!isConfigured) return;

    try {
      await supabaseTaskService.toggleTaskStatus(id, newCompleted);
      setSyncError(null);
    } catch (err) {
      console.warn('Supabase toggle task status notice:', err);
      // Notice without reverting local user action
      const msg = err instanceof Error ? err.message : 'Failed to sync status.';
      setSyncError(`Notice: ${msg}. Updated locally.`);
    }
  };

  const handleAddTask = async (data: Omit<Task, 'id' | 'completed'>) => {
    const tempId = crypto.randomUUID();
    const optimisticTask: Task = {
      id: tempId,
      projectId: data.projectId || null,
      title: data.title,
      description: data.description || '',
      category: data.category || 'General',
      priority: data.priority,
      completed: false,
      dueDate: data.dueDate,
      time: data.time,
    };

    setTasks((prev) => [optimisticTask, ...prev]);

    if (!isConfigured) return;

    try {
      const createdTask = await supabaseTaskService.createTask(data);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? createdTask : t)));
      setSyncError(null);
    } catch (err) {
      console.warn('Supabase create task notice:', err);
      const errorMsg =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to sync created task to Supabase.';
      setSyncError(`Notice: ${errorMsg}. Saved locally.`);
    }
  };

  const handleUpdateTask = async (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    if (!isConfigured) return;

    try {
      await supabaseTaskService.updateTask(updated);
      setSyncError(null);
    } catch (err) {
      console.warn('Supabase update task notice:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update task in Supabase.';
      setSyncError(`Notice: ${msg}. Saved locally.`);
    }
  };

  const handleMoveTaskToProject = async (taskId: string, newProjectId: string | null) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const updatedTask: Task = {
      ...target,
      projectId: newProjectId,
    };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    if (!isConfigured) return;

    try {
      await supabaseTaskService.updateTask(updatedTask);
      setSyncError(null);
    } catch (err) {
      console.warn('Supabase move task project notice:', err);
      const msg = err instanceof Error ? err.message : 'Failed to sync task project to Supabase.';
      setSyncError(`Notice: ${msg}. Updated locally.`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    if (!isConfigured) return;

    try {
      await supabaseTaskService.deleteTask(id);
      setSyncError(null);
    } catch (err) {
      console.warn('Supabase delete task notice:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete task from Supabase.';
      setSyncError(`Notice: ${msg}. Removed locally.`);
    }
  };

  const handleCreateProject = async (
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticProject: Project = {
      id: tempId,
      userId: null,
      name: data.name,
      description: data.description || '',
      status: data.status,
      priority: data.priority,
      createdAt: now,
      updatedAt: now,
    };

    setProjects((prev) => [optimisticProject, ...prev]);

    if (!isConfigured) {
      return;
    }

    try {
      const created = await supabaseProjectService.createProject(data);
      setProjects((prev) => prev.map((p) => (p.id === tempId ? created : p)));
      setProjectSyncError(null);
    } catch (err) {
      console.warn('Supabase create project sync notice:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create project in Supabase.';
      setProjectSyncError(`Notice: ${msg}. Saved locally.`);
    }
  };

  const handleUpdateProject = async (updated: Project) => {
    const prevProjects = projects;
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

    if (!isConfigured) return;

    try {
      await supabaseProjectService.updateProject(updated);
      setProjectSyncError(null);
    } catch (err) {
      console.warn('Supabase update project sync notice:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update project in Supabase.';
      setProjectSyncError(`Notice: ${msg}. Updated locally.`);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (selectedProjectId === id) {
      handleSelectProject(null);
    }
    const prevProjects = projects;
    const prevTasks = tasks;

    // Preserve existing tasks: update tasks referencing this projectId to null (mirroring ON DELETE SET NULL)
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) =>
      prev.map((t) => (t.projectId === id ? { ...t, projectId: null } : t))
    );

    if (!isConfigured) return;

    try {
      await supabaseProjectService.deleteProject(id);
      setProjectSyncError(null);
    } catch (err) {
      console.warn('Supabase delete project sync notice:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete project from Supabase.';
      setProjectSyncError(`Notice: ${msg}. Removed locally.`);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  const sectionTitles: Record<NavItemId, { title: string; subtitle: string }> = {
    home: { title: 'Home', subtitle: 'Overview' },
    tasks: { title: 'Tasks', subtitle: 'Organize everything you need to get done.' },
    projects: { title: 'Projects', subtitle: 'Manage bodies of work, track status, and coordinate outcomes.' },
    automations: { title: 'Automations', subtitle: 'Automations engine (Upcoming in Step 5)' },
    assistant: { title: 'Assistant', subtitle: 'Your personal assistant for tasks, planning, and automation.' },
    activity: { title: 'Activity', subtitle: 'Recent system activity (Upcoming in Step 5)' },
    integrations: { title: 'Integrations', subtitle: 'Connected services (Upcoming in Step 5)' },
    settings: { title: 'Settings', subtitle: 'Configure your workspace, preferences, and account controls.' },
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
        onSelect={handleNavSelect}
        user={currentUser}
      />

      {/* Desktop Left Sidebar */}
      <Sidebar
        activeId={activeNavId}
        onSelect={handleNavSelect}
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
              onClick={() => {
                handleSelectProject(null);
                setActiveNavId('home');
              }}
              className="text-zinc-700 font-semibold hover:text-zinc-950 transition-colors cursor-pointer"
            >
              Orbit
            </button>
            <span className="text-zinc-300">/</span>
            {activeNavId === 'projects' && selectedProject ? (
              <>
                <button
                  type="button"
                  id="breadcrumb-projects-btn"
                  onClick={() => handleSelectProject(null)}
                  className="text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  Projects
                </button>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-900 font-semibold truncate max-w-xs">
                  {selectedProject.name}
                </span>
              </>
            ) : (
              <span className="text-zinc-800 capitalize">
                {sectionTitles[activeNavId].title}
              </span>
            )}
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
              projects={projects}
              isLoading={isLoadingTasks}
              syncError={syncError}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onMoveTaskToProject={handleMoveTaskToProject}
              onOpenProjectWorkspace={(projId) => {
                setActiveNavId('projects');
                handleSelectProject(projId);
              }}
            />
          ) : activeNavId === 'projects' ? (
            selectedProject ? (
              <ProjectWorkspace
                project={selectedProject}
                allProjects={projects}
                tasks={tasks}
                currentUser={currentUser}
                isLoading={isLoadingProjects || isLoadingTasks}
                syncError={projectSyncError || syncError}
                onBackToProjects={() => handleSelectProject(null)}
                onNavigateToTasks={() => {
                  handleSelectProject(null);
                  setActiveNavId('tasks');
                }}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={(id) => {
                  handleDeleteProject(id);
                  handleSelectProject(null);
                }}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onMoveTaskToProject={handleMoveTaskToProject}
              />
            ) : (
              <ProjectsPage
                projects={projects}
                tasks={tasks}
                currentUser={currentUser}
                isLoading={isLoadingProjects}
                syncError={projectSyncError}
                onCreateProject={handleCreateProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onSelectProject={(project) => handleSelectProject(project.id)}
              />
            )
          ) : activeNavId === 'assistant' ? (
            <AssistantPage />
          ) : activeNavId === 'settings' ? (
            <SettingsPage
              currentUser={currentUser}
              initialSection={activeSettingsSection}
              onSectionChange={(sec) => setActiveSettingsSection(sec)}
              tasks={tasks}
              projects={projects}
            />
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
