import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Task,
  TaskPriority,
  Project,
  ProjectPriority,
  ProjectStatus,
  OrbitSettings,
  AppearanceSettings,
} from '../types';
import { initialProjects } from '../mockData';

// Environment variables for Supabase connection
const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
    ? (process.env as Record<string, string | undefined>)
    : {};
const supabaseUrl = env?.VITE_SUPABASE_URL;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY;

// Check if credentials are provided and valid
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    typeof supabaseUrl === 'string' &&
    typeof supabaseAnonKey === 'string' &&
    supabaseUrl.trim().startsWith('http') &&
    !supabaseUrl.includes('placeholder')
  );
};

// Lazily/safely initialized Supabase client
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database row definition matching the Supabase table schema
export interface SupabaseTaskRow {
  id: string | number;
  project_id?: string | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: string; // 'high' | 'medium' | 'low'
  status: string; // 'pending' | 'completed'
  due_date: string | null; // timestamptz
  created_at?: string;
}

// Database row definition matching the Supabase projects table schema
export interface SupabaseProjectRow {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

/**
 * Convert user-entered dueDate string ('Today', 'Tomorrow', '2026-09-22', etc.)
 * and time string ('10:00 AM', '14:30', etc.) into a timestamptz ISO string.
 */
export const mapDateToDb = (dueDate: string, time: string): string => {
  const now = new Date();
  const targetDate = new Date(now);

  const lowerDue = (dueDate || '').toLowerCase().trim();

  if (lowerDue.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (!lowerDue.includes('today') && lowerDue) {
    // Try to parse as specific date
    const parsed = new Date(dueDate);
    if (!isNaN(parsed.getTime())) {
      targetDate.setFullYear(parsed.getFullYear());
      targetDate.setMonth(parsed.getMonth());
      targetDate.setDate(parsed.getDate());
    }
  }

  // Parse time string e.g. "10:30 AM", "2:00 PM", "14:30"
  if (time) {
    const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const meridian = timeMatch[3]?.toUpperCase();

      if (meridian === 'PM' && hours < 12) {
        hours += 12;
      } else if (meridian === 'AM' && hours === 12) {
        hours = 0;
      }

      targetDate.setHours(hours, minutes, 0, 0);
    }
  }

  return targetDate.toISOString();
};

/**
 * Convert timestamptz ISO string from DB to displayable dueDate and time strings.
 */
export const mapDateFromDb = (
  dueDateIso: string | null
): { dueDate: string; time: string } => {
  if (!dueDateIso) {
    return { dueDate: 'Today', time: '12:00 PM' };
  }

  const d = new Date(dueDateIso);
  if (isNaN(d.getTime())) {
    return { dueDate: 'Today', time: '12:00 PM' };
  }

  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();

  let dueDate: string;
  if (isToday) {
    dueDate = 'Today';
  } else if (isTomorrow) {
    dueDate = 'Tomorrow';
  } else {
    dueDate = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  const time = d.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return { dueDate, time };
};

export const mapPriorityFromDb = (dbPriority: string | null | undefined): TaskPriority => {
  if (!dbPriority) return 'Medium priority';
  const p = dbPriority.toLowerCase().trim();
  if (p === 'high' || p === 'high priority') return 'High priority';
  if (p === 'low' || p === 'low priority') return 'Low priority';
  return 'Medium priority';
};

export const mapPriorityToDb = (priority: TaskPriority): string => {
  if (priority === 'High priority') return 'high';
  if (priority === 'Low priority') return 'low';
  return 'medium';
};

/**
 * Convert a Supabase database row into the application Task model.
 */
export const mapRowToTask = (row: SupabaseTaskRow): Task => {
  const { dueDate, time } = mapDateFromDb(row.due_date);

  return {
    id: String(row.id),
    projectId: row.project_id ? String(row.project_id) : null,
    title: row.title || 'Untitled Task',
    description: row.description || '',
    category: row.category || 'General',
    priority: mapPriorityFromDb(row.priority),
    completed: (row.status || '').toLowerCase() === 'completed',
    dueDate,
    time,
  };
};

const LOCAL_TASK_PROJECT_MAP_KEY = 'orbit_task_project_assignments';
let remoteTasksHasProjectId: boolean | null = null;

/**
 * Retrieve persistent task-to-project assignment mappings.
 * Allows project associations to survive and function even if the remote DB
 * table is pending migration of the 'project_id' column.
 */
export const getStoredTaskProjectMap = (): Record<string, string | null> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_TASK_PROJECT_MAP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }
  return {};
};

export const saveStoredTaskProject = (taskId: string, projectId: string | null): void => {
  if (typeof window === 'undefined') return;
  try {
    const map = getStoredTaskProjectMap();
    if (projectId) {
      map[taskId] = projectId;
    } else {
      delete map[taskId];
    }
    localStorage.setItem(LOCAL_TASK_PROJECT_MAP_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage write error
  }
};

export const removeStoredTaskProject = (taskId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const map = getStoredTaskProjectMap();
    delete map[taskId];
    localStorage.setItem(LOCAL_TASK_PROJECT_MAP_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage write error
  }
};

/**
 * Helper to identify if a Supabase error is due to a missing column in the schema cache (PGRST204).
 */
export const isColumnMissingError = (err: unknown, column = 'project_id'): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string; details?: string; hint?: string };
  if (e.code === 'PGRST204') return true;
  const combined = `${e.message || ''} ${e.details || ''} ${e.hint || ''}`;
  return (
    combined.includes(`'${column}' column`) ||
    combined.includes(`"${column}" column`) ||
    combined.includes(`column "${column}"`) ||
    combined.includes(`column '${column}'`)
  );
};

/**
 * Supabase Task API Service
 */
export const supabaseTaskService = {
  /**
   * Fetch all tasks from Supabase 'tasks' table
   */
  async fetchTasks(): Promise<Task[]> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching tasks from Supabase:', error);
      throw error;
    }

    const projectMap = getStoredTaskProjectMap();
    return (data as SupabaseTaskRow[]).map((row) => {
      const task = mapRowToTask(row);
      if (!task.projectId && projectMap[task.id]) {
        task.projectId = projectMap[task.id];
      }
      return task;
    });
  },

  /**
   * Insert a new task into the 'tasks' table
   */
  async createTask(taskData: Omit<Task, 'id' | 'completed'>): Promise<Task> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    const generatedId = crypto.randomUUID();
    const assignedProjectId = taskData.projectId || null;

    if (assignedProjectId) {
      saveStoredTaskProject(generatedId, assignedProjectId);
    }

    const payload: Record<string, unknown> = {
      id: generatedId,
      title: taskData.title,
      description: taskData.description || null,
      category: taskData.category || 'General',
      priority: mapPriorityToDb(taskData.priority),
      status: 'pending',
      due_date: mapDateToDb(taskData.dueDate, taskData.time),
    };

    // Only include project_id if remote table hasn't already reported it missing
    if (remoteTasksHasProjectId !== false && assignedProjectId !== null) {
      payload.project_id = assignedProjectId;
    }

    if (userId) {
      payload.user_id = userId;
    }

    // Attempt insert and select representation
    let insertResult = await supabase
      .from('tasks')
      .insert([payload])
      .select();

    // If PGRST204 occurs because 'project_id' column is missing in schema cache,
    // seamlessly retry without project_id and remember column is absent.
    if (insertResult.error && isColumnMissingError(insertResult.error, 'project_id')) {
      remoteTasksHasProjectId = false;
      delete payload.project_id;
      insertResult = await supabase
        .from('tasks')
        .insert([payload])
        .select();
    }

    if (insertResult.error) {
      console.error('Error creating task in Supabase:', insertResult.error);
      throw insertResult.error;
    }

    if (insertResult.data && insertResult.data.length > 0) {
      const created = mapRowToTask(insertResult.data[0] as SupabaseTaskRow);
      created.projectId = assignedProjectId;
      return created;
    }

    // Fallback: return constructed task using the generated ID
    return {
      id: generatedId,
      projectId: assignedProjectId,
      title: taskData.title,
      description: taskData.description || '',
      category: taskData.category || 'General',
      priority: taskData.priority,
      completed: false,
      dueDate: taskData.dueDate,
      time: taskData.time,
    };
  },

  /**
   * Update an existing task in the 'tasks' table
   */
  async updateTask(task: Task): Promise<Task> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const assignedProjectId = task.projectId || null;
    saveStoredTaskProject(task.id, assignedProjectId);

    const payload: Record<string, unknown> = {
      title: task.title,
      description: task.description || null,
      category: task.category || 'General',
      priority: mapPriorityToDb(task.priority),
      status: task.completed ? 'completed' : 'pending',
      due_date: mapDateToDb(task.dueDate, task.time),
    };

    if (remoteTasksHasProjectId !== false && task.projectId !== undefined) {
      payload.project_id = assignedProjectId;
    }

    let updateResult = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', task.id)
      .select();

    // If PGRST204 occurs because 'project_id' column is missing in schema cache,
    // seamlessly retry without project_id
    if (updateResult.error && isColumnMissingError(updateResult.error, 'project_id')) {
      remoteTasksHasProjectId = false;
      delete payload.project_id;
      updateResult = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', task.id)
        .select();
    }

    if (updateResult.error) {
      console.error('Error updating task in Supabase:', updateResult.error);
      throw updateResult.error;
    }

    if (updateResult.data && updateResult.data.length > 0) {
      const updated = mapRowToTask(updateResult.data[0] as SupabaseTaskRow);
      updated.projectId = assignedProjectId;
      return updated;
    }

    return task;
  },

  /**
   * Toggle task completed status
   */
  async toggleTaskStatus(id: string, completed: boolean): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: completed ? 'completed' : 'pending' })
      .eq('id', id);

    if (error) {
      console.error('Error toggling task status in Supabase:', error);
      throw error;
    }
  },

  /**
   * Delete a task from the 'tasks' table
   */
  async deleteTask(id: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    removeStoredTaskProject(id);

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting task from Supabase:', error);
      throw error;
    }
  },
};

/**
 * Helper to identify if a Supabase error is due to an unmigrated table
 * or missing PostgREST schema cache entry (e.g. PGRST205).
 */
export const isSchemaCacheMissingError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  return (
    e.code === 'PGRST205' ||
    (typeof e.message === 'string' &&
      (e.message.includes('schema cache') ||
        e.message.includes('Could not find the table') ||
        e.message.includes('relation "public.projects" does not exist')))
  );
};

const LOCAL_PROJECTS_STORAGE_KEY = 'orbit_projects_local';

/**
 * Retrieve local cached projects (survives refreshes even when remote table is pending migration).
 */
export const getStoredLocalProjects = (): Project[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }
  return [];
};

/**
 * Persist projects into local storage fallback.
 */
export const saveStoredLocalProjects = (projects: Project[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Ignore storage write error
  }
};

/**
 * Convert a Supabase database row into the application Project model.
 */
export const mapRowToProject = (row: SupabaseProjectRow): Project => ({
  id: String(row.id),
  userId: row.user_id ? String(row.user_id) : null,
  name: row.name || 'Untitled Project',
  description: row.description || '',
  status: row.status || 'active',
  priority: row.priority || 'medium',
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at || new Date().toISOString(),
});

/**
 * Supabase Project API Service (S5.1/S5.2 Project Data Access Layer)
 * Resilient to pending database migrations with transparent local caching.
 */
export const supabaseProjectService = {
  /**
   * Fetch all projects accessible to the current user
   */
  async fetchProjects(): Promise<Project[]> {
    if (!supabase) {
      let local = getStoredLocalProjects();
      if (local.length === 0) {
        local = [...initialProjects];
        saveStoredLocalProjects(local);
      }
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // When table is pending migration (PGRST205), fall back to local projects without console.error
        if (isSchemaCacheMissingError(error)) {
          let local = getStoredLocalProjects();
          if (local.length === 0) {
            local = [...initialProjects];
            saveStoredLocalProjects(local);
          }
          return local;
        }
        console.warn('Supabase projects query notice:', error.message);
        const local = getStoredLocalProjects();
        return local.length > 0 ? local : initialProjects;
      }

      const remoteProjects = (data as SupabaseProjectRow[]).map(mapRowToProject);
      saveStoredLocalProjects(remoteProjects);
      return remoteProjects;
    } catch (err) {
      if (!isSchemaCacheMissingError(err)) {
        console.warn('Projects fetch caught error:', err);
      }
      const local = getStoredLocalProjects();
      return local.length > 0 ? local : initialProjects;
    }
  },

  /**
   * Fetch a single project by ID
   */
  async fetchProjectById(id: string): Promise<Project | null> {
    if (!supabase) {
      const local = getStoredLocalProjects();
      return local.find((p) => p.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        if (!isSchemaCacheMissingError(error)) {
          console.warn('Error fetching project by ID:', error);
        }
        const local = getStoredLocalProjects();
        return local.find((p) => p.id === id) || null;
      }

      return data ? mapRowToProject(data as SupabaseProjectRow) : null;
    } catch {
      const local = getStoredLocalProjects();
      return local.find((p) => p.id === id) || null;
    }
  },

  /**
   * Create a new project in the 'projects' table
   */
  async createProject(
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> {
    const generatedId = crypto.randomUUID();
    const now = new Date().toISOString();
    const fallbackProject: Project = {
      id: generatedId,
      userId: null,
      name: projectData.name,
      description: projectData.description || '',
      status: projectData.status || 'active',
      priority: projectData.priority || 'medium',
      createdAt: now,
      updatedAt: now,
    };

    if (!supabase) {
      const local = getStoredLocalProjects();
      const updated = [fallbackProject, ...local];
      saveStoredLocalProjects(updated);
      return fallbackProject;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const payload: Record<string, unknown> = {
        id: generatedId,
        name: projectData.name,
        description: projectData.description || null,
        status: projectData.status || 'active',
        priority: projectData.priority || 'medium',
      };

      if (userId) {
        payload.user_id = userId;
        fallbackProject.userId = userId;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([payload])
        .select();

      if (error) {
        if (!isSchemaCacheMissingError(error)) {
          console.warn('Supabase project creation notice:', error.message);
        }
        const local = getStoredLocalProjects();
        const updated = [fallbackProject, ...local];
        saveStoredLocalProjects(updated);
        return fallbackProject;
      }

      if (data && data.length > 0) {
        const created = mapRowToProject(data[0] as SupabaseProjectRow);
        const local = getStoredLocalProjects();
        saveStoredLocalProjects([created, ...local.filter((p) => p.id !== created.id)]);
        return created;
      }

      return fallbackProject;
    } catch (err) {
      if (!isSchemaCacheMissingError(err)) {
        console.warn('Failed to insert project into Supabase, saving locally:', err);
      }
      const local = getStoredLocalProjects();
      const updated = [fallbackProject, ...local];
      saveStoredLocalProjects(updated);
      return fallbackProject;
    }
  },

  /**
   * Update an existing project
   */
  async updateProject(
    project: Partial<Project> & { id: string }
  ): Promise<Project> {
    const applyLocalUpdate = () => {
      const local = getStoredLocalProjects();
      let updatedProject: Project | null = null;
      const updatedList = local.map((p) => {
        if (p.id === project.id) {
          updatedProject = {
            ...p,
            ...project,
            updatedAt: new Date().toISOString(),
          };
          return updatedProject;
        }
        return p;
      });
      if (!updatedProject) {
        updatedProject = {
          id: project.id,
          userId: null,
          name: project.name || 'Untitled Project',
          description: project.description || '',
          status: project.status || 'active',
          priority: project.priority || 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedList.unshift(updatedProject);
      }
      saveStoredLocalProjects(updatedList);
      return updatedProject;
    };

    if (!supabase) {
      return applyLocalUpdate();
    }

    try {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (project.name !== undefined) payload.name = project.name;
      if (project.description !== undefined) payload.description = project.description || null;
      if (project.status !== undefined) payload.status = project.status;
      if (project.priority !== undefined) payload.priority = project.priority;

      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', project.id)
        .select();

      if (error) {
        if (!isSchemaCacheMissingError(error)) {
          console.warn('Supabase project update notice:', error.message);
        }
        return applyLocalUpdate();
      }

      if (data && data.length > 0) {
        const mapped = mapRowToProject(data[0] as SupabaseProjectRow);
        const local = getStoredLocalProjects();
        saveStoredLocalProjects(local.map((p) => (p.id === mapped.id ? mapped : p)));
        return mapped;
      }

      return applyLocalUpdate();
    } catch (err) {
      if (!isSchemaCacheMissingError(err)) {
        console.warn('Failed to update project in Supabase, updating locally:', err);
      }
      return applyLocalUpdate();
    }
  },

  /**
   * Delete a project from the 'projects' table
   */
  async deleteProject(id: string): Promise<void> {
    const local = getStoredLocalProjects();
    saveStoredLocalProjects(local.filter((p) => p.id !== id));

    if (!supabase) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);

      if (error && !isSchemaCacheMissingError(error)) {
        console.warn('Supabase delete project notice:', error.message);
      }
    } catch (err) {
      if (!isSchemaCacheMissingError(err)) {
        console.warn('Failed to delete project from Supabase:', err);
      }
    }
  },
};

// ==============================================================
// S6.1 Settings Architecture: Data Models & Persistence Services
// ==============================================================

export interface SupabaseUserSettingsRow {
  id: string;
  user_id: string;
  display_name: string | null;
  timezone: string;
  default_task_priority: string;
  default_task_view: string;
  default_task_sort: string;
  show_completed_tasks: boolean;
  auto_archive_tasks: boolean;
  time_format: string;
  week_start: string;
  default_landing_view: string;
  in_app_alerts: boolean;
  email_digest: string;
  created_at: string;
  updated_at: string;
}

export const LOCAL_SETTINGS_STORAGE_KEY = 'orbit_user_settings_local';
export const LOCAL_THEME_STORAGE_KEY = 'orbit_theme';
export const LOCAL_COMPACT_MODE_STORAGE_KEY = 'orbit_compact_mode';
export const LOCAL_REDUCED_MOTION_STORAGE_KEY = 'orbit_reduced_motion';
export const LOCAL_SIDEBAR_COLLAPSED_STORAGE_KEY = 'orbit_sidebar_collapsed';

export const defaultOrbitSettings: OrbitSettings = {
  account: {
    displayName: 'Alex Vance',
    email: 'alex@orbit.internal',
    timezone: 'UTC',
  },
  appearance: {
    theme: 'system',
    compactMode: false,
    reducedMotion: false,
  },
  tasks: {
    defaultPriority: 'Medium priority',
    defaultView: 'all',
    defaultSort: 'due_date',
    showCompleted: true,
    autoArchive: false,
  },
  app: {
    timeFormat: '12h',
    weekStart: 'monday',
    defaultLandingView: 'home',
    sidebarCollapsed: false,
  },
  data: {
    lastBackupDate: null,
    storageUsageEstimate: 'Clean',
  },
  notifications: {
    inAppAlerts: true,
    emailDigest: 'never',
  },
  security: {
    sessionActive: false,
    lastSignInAt: null,
    provider: 'email',
  },
  about: {
    appName: 'Orbit',
    version: '0.1.0',
    environment: 'production',
    buildDate: '2026-09-23',
    docsUrl: 'https://github.com/orbit/docs',
    license: 'MIT',
  },
};

/**
 * Retrieve local device appearance preferences
 */
export const getLocalAppearance = (): AppearanceSettings => {
  if (typeof window === 'undefined') return defaultOrbitSettings.appearance;
  try {
    const theme = localStorage.getItem(LOCAL_THEME_STORAGE_KEY) as any;
    const compactMode = localStorage.getItem(LOCAL_COMPACT_MODE_STORAGE_KEY) === 'true';
    const reducedMotion = localStorage.getItem(LOCAL_REDUCED_MOTION_STORAGE_KEY) === 'true';
    return {
      theme: theme === 'light' || theme === 'dark' ? theme : 'system',
      compactMode,
      reducedMotion,
    };
  } catch {
    return defaultOrbitSettings.appearance;
  }
};

/**
 * Save local device appearance preferences
 */
export const saveLocalAppearance = (appearance: Partial<AppearanceSettings>): void => {
  if (typeof window === 'undefined') return;
  try {
    if (appearance.theme) localStorage.setItem(LOCAL_THEME_STORAGE_KEY, appearance.theme);
    if (appearance.compactMode !== undefined) {
      localStorage.setItem(LOCAL_COMPACT_MODE_STORAGE_KEY, String(appearance.compactMode));
    }
    if (appearance.reducedMotion !== undefined) {
      localStorage.setItem(LOCAL_REDUCED_MOTION_STORAGE_KEY, String(appearance.reducedMotion));
    }
  } catch {
    // Ignore storage write error
  }
};

/**
 * Retrieve local cached user settings
 */
export const getStoredLocalSettings = (): OrbitSettings => {
  if (typeof window === 'undefined') return defaultOrbitSettings;
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_STORAGE_KEY);
    const appearance = getLocalAppearance();
    const sidebarCollapsed = localStorage.getItem(LOCAL_SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...defaultOrbitSettings,
          ...parsed,
          account: { ...defaultOrbitSettings.account, ...(parsed.account || {}) },
          appearance: { ...appearance, ...(parsed.appearance || {}) },
          tasks: { ...defaultOrbitSettings.tasks, ...(parsed.tasks || {}) },
          app: {
            ...defaultOrbitSettings.app,
            ...(parsed.app || {}),
            sidebarCollapsed,
          },
          data: { ...defaultOrbitSettings.data, ...(parsed.data || {}) },
          notifications: { ...defaultOrbitSettings.notifications, ...(parsed.notifications || {}) },
          security: { ...defaultOrbitSettings.security, ...(parsed.security || {}) },
          about: defaultOrbitSettings.about,
        };
      }
    }
    return {
      ...defaultOrbitSettings,
      appearance,
      app: { ...defaultOrbitSettings.app, sidebarCollapsed },
    };
  } catch {
    return defaultOrbitSettings;
  }
};

/**
 * Persist user settings to local storage fallback
 */
export const saveStoredLocalSettings = (settings: OrbitSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    saveLocalAppearance(settings.appearance);
    localStorage.setItem(
      LOCAL_SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(settings.app.sidebarCollapsed)
    );
  } catch {
    // Ignore storage write error
  }
};

/**
 * Map a Supabase database row to the frontend OrbitSettings model
 */
export const mapRowToUserSettings = (
  row: SupabaseUserSettingsRow,
  fallback: OrbitSettings = defaultOrbitSettings
): OrbitSettings => {
  const localAppearance = getLocalAppearance();
  return {
    ...fallback,
    account: {
      ...fallback.account,
      displayName: row.display_name || fallback.account.displayName,
      timezone: row.timezone || fallback.account.timezone,
    },
    appearance: localAppearance,
    tasks: {
      ...fallback.tasks,
      defaultPriority: (row.default_task_priority as any) || fallback.tasks.defaultPriority,
      defaultView: (row.default_task_view as any) || fallback.tasks.defaultView,
      defaultSort: (row.default_task_sort as any) || fallback.tasks.defaultSort,
      showCompleted: row.show_completed_tasks ?? fallback.tasks.showCompleted,
      autoArchive: row.auto_archive_tasks ?? fallback.tasks.autoArchive,
    },
    app: {
      ...fallback.app,
      timeFormat: (row.time_format as any) || fallback.app.timeFormat,
      weekStart: (row.week_start as any) || fallback.app.weekStart,
      defaultLandingView: (row.default_landing_view as any) || fallback.app.defaultLandingView,
    },
    notifications: {
      ...fallback.notifications,
      inAppAlerts: row.in_app_alerts ?? fallback.notifications.inAppAlerts,
      emailDigest: (row.email_digest as any) || fallback.notifications.emailDigest,
    },
    security: {
      ...fallback.security,
      sessionActive: true,
    },
  };
};

/**
 * Map frontend OrbitSettings to a Supabase database row payload
 */
export const mapUserSettingsToRow = (
  settings: OrbitSettings,
  userId: string
): Record<string, unknown> => ({
  user_id: userId,
  display_name: settings.account.displayName,
  timezone: settings.account.timezone,
  default_task_priority: settings.tasks.defaultPriority,
  default_task_view: settings.tasks.defaultView,
  default_task_sort: settings.tasks.defaultSort,
  show_completed_tasks: settings.tasks.showCompleted,
  auto_archive_tasks: settings.tasks.autoArchive,
  time_format: settings.app.timeFormat,
  week_start: settings.app.weekStart,
  default_landing_view: settings.app.defaultLandingView,
  in_app_alerts: settings.notifications.inAppAlerts,
  email_digest: settings.notifications.emailDigest,
  updated_at: new Date().toISOString(),
});

/**
 * Supabase Settings API Service (S6.1 Settings Data Access Layer)
 */
export const supabaseSettingsService = {
  /**
   * Fetch current user settings with automatic local cache synchronization
   */
  async fetchSettings(): Promise<OrbitSettings> {
    const local = getStoredLocalSettings();

    if (!supabase) {
      return local;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        return local;
      }

      // Sync account email and last login from auth user
      local.account.email = user.email || local.account.email;
      local.security.sessionActive = true;
      local.security.lastSignInAt = user.last_sign_in_at || null;
      local.security.provider = user.app_metadata?.provider || 'email';

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (!isSchemaCacheMissingError(error)) {
          console.warn('Supabase settings query notice:', error.message);
        }
        return local;
      }

      if (data) {
        const merged = mapRowToUserSettings(data as SupabaseUserSettingsRow, local);
        saveStoredLocalSettings(merged);
        return merged;
      }

      // First-time user: persist default settings to remote database
      try {
        const payload = mapUserSettingsToRow(local, user.id);
        const { data: createdData } = await supabase
          .from('user_settings')
          .insert([payload])
          .select()
          .maybeSingle();

        if (createdData) {
          const merged = mapRowToUserSettings(createdData as SupabaseUserSettingsRow, local);
          saveStoredLocalSettings(merged);
          return merged;
        }
      } catch {
        // Continue with local on schema cache error
      }

      return local;
    } catch (err) {
      if (!isSchemaCacheMissingError(err)) {
        console.warn('Settings fetch error, falling back to local:', err);
      }
      return local;
    }
  },

  /**
   * Update settings (supports partial updates across any of the 8 logical areas)
   */
  async updateSettings(partial: Partial<OrbitSettings>): Promise<OrbitSettings> {
    const current = getStoredLocalSettings();
    const updated: OrbitSettings = {
      account: { ...current.account, ...(partial.account || {}) },
      appearance: { ...current.appearance, ...(partial.appearance || {}) },
      tasks: { ...current.tasks, ...(partial.tasks || {}) },
      app: { ...current.app, ...(partial.app || {}) },
      data: { ...current.data, ...(partial.data || {}) },
      notifications: { ...current.notifications, ...(partial.notifications || {}) },
      security: { ...current.security, ...(partial.security || {}) },
      about: current.about,
    };

    saveStoredLocalSettings(updated);

    if (!supabase) {
      return updated;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) {
        return updated;
      }

      const payload = mapUserSettingsToRow(updated, userId);

      const { error } = await supabase
        .from('user_settings')
        .upsert(payload, { onConflict: 'user_id' });

      if (error && !isSchemaCacheMissingError(error)) {
        console.warn('Supabase settings update notice:', error.message);
      }
      return updated;
    } catch (err) {
      if (!isSchemaCacheMissingError(err)) {
        console.warn('Settings update caught exception, updated locally:', err);
      }
      return updated;
    }
  },

  /**
   * Reset user settings to defaults
   */
  async resetSettings(): Promise<OrbitSettings> {
    return this.updateSettings(defaultOrbitSettings);
  },
};

