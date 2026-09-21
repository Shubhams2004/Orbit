import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Task, TaskPriority } from '../types';

// Environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  title: string;
  description: string | null;
  category: string | null;
  priority: string; // 'high' | 'medium' | 'low'
  status: string; // 'pending' | 'completed'
  due_date: string | null; // timestamptz
  created_at?: string;
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
    title: row.title || 'Untitled Task',
    description: row.description || '',
    category: row.category || 'General',
    priority: mapPriorityFromDb(row.priority),
    completed: (row.status || '').toLowerCase() === 'completed',
    dueDate,
    time,
  };
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

    return (data as SupabaseTaskRow[]).map(mapRowToTask);
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

    const payload: Record<string, unknown> = {
      title: taskData.title,
      description: taskData.description || null,
      category: taskData.category || 'General',
      priority: mapPriorityToDb(taskData.priority),
      status: 'pending',
      due_date: mapDateToDb(taskData.dueDate, taskData.time),
    };

    if (userId) {
      payload.user_id = userId;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating task in Supabase:', error);
      throw error;
    }

    return mapRowToTask(data as SupabaseTaskRow);
  },

  /**
   * Update an existing task in the 'tasks' table
   */
  async updateTask(task: Task): Promise<Task> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const payload = {
      title: task.title,
      description: task.description || null,
      category: task.category || 'General',
      priority: mapPriorityToDb(task.priority),
      status: task.completed ? 'completed' : 'pending',
      due_date: mapDateToDb(task.dueDate, task.time),
    };

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', task.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task in Supabase:', error);
      throw error;
    }

    return mapRowToTask(data as SupabaseTaskRow);
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

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting task from Supabase:', error);
      throw error;
    }
  },
};
