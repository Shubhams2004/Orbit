import type { ComponentType } from 'react';

export type NavItemId =
  | 'home'
  | 'tasks'
  | 'automations'
  | 'assistant'
  | 'activity'
  | 'integrations'
  | 'settings';

export interface NavItem {
  id: NavItemId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  initials: string;
}

export type TaskPriority = 'High priority' | 'Medium priority' | 'Low priority';

export type TaskFilter = 'all' | 'today' | 'upcoming' | 'completed';

export type TaskSortOption = 'due_date' | 'priority' | 'title';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // e.g., 'Today', 'Tomorrow'
  time: string;
  priority: TaskPriority;
  category: string;
  completed: boolean;
}

export type ActivityType = 'created' | 'completed' | 'automation';

export interface Activity {
  id: string;
  text: string;
  timestamp: string;
  type: ActivityType;
}

export interface OverviewMetric {
  id: string;
  label: string;
  count: number;
  icon: ComponentType<{ className?: string }>;
}

export interface AssistantMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
}
