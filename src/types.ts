import type { ComponentType } from 'react';

export type NavItemId =
  | 'home'
  | 'tasks'
  | 'projects'
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
  projectId?: string | null;
  title: string;
  description?: string;
  dueDate: string; // e.g., 'Today', 'Tomorrow'
  time: string;
  priority: TaskPriority;
  category: string;
  completed: boolean;
}

export type ProjectStatus = 'active' | 'completed' | 'archived';

export type ProjectPriority = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  userId?: string | null;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  createdAt: string;
  updatedAt: string;
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

// ==========================================
// S6.1 Settings Architecture & Data Models
// ==========================================

export type SettingsAreaId =
  | 'account'
  | 'appearance'
  | 'tasks'
  | 'app'
  | 'data'
  | 'notifications'
  | 'security'
  | 'about';

// 1. Account Settings (User identity & localization)
export interface AccountSettings {
  displayName: string;
  email: string;
  timezone: string;
  avatarUrl?: string;
}

// 2. Appearance Settings (Client/Device local preferences)
export type AppTheme = 'system' | 'light' | 'dark';

export interface AppearanceSettings {
  theme: AppTheme;
  compactMode: boolean;
  reducedMotion: boolean;
}

// 3. Task Preferences (Persistent user-specific workflow preferences)
export interface TaskPreferencesSettings {
  defaultPriority: TaskPriority;
  defaultView: TaskFilter;
  defaultSort: TaskSortOption;
  showCompleted: boolean;
  autoArchive: boolean;
}

// 4. Application Preferences (Persistent defaults with local layout state)
export type WeekStartDay = 'monday' | 'sunday';
export type TimeFormat = '12h' | '24h';
export type LandingView = 'home' | 'tasks' | 'projects' | 'assistant';

export interface ApplicationPreferencesSettings {
  timeFormat: TimeFormat;
  weekStart: WeekStartDay;
  defaultLandingView: LandingView;
  sidebarCollapsed: boolean;
}

// 5. Data Settings (Operational actions & storage stats)
export interface DataSettings {
  lastBackupDate?: string | null;
  storageUsageEstimate?: string;
}

// 6. Notification Preferences (Persistent notification preferences)
export type EmailDigestFrequency = 'never' | 'daily' | 'weekly';

export interface NotificationPreferencesSettings {
  inAppAlerts: boolean;
  emailDigest: EmailDigestFrequency;
}

// 7. Security Settings (Session & auth state overview, zero credential storage)
export interface SecuritySettings {
  sessionActive: boolean;
  lastSignInAt?: string | null;
  provider?: string;
}

// 8. About Information (Static application metadata)
export interface AboutSettings {
  appName: string;
  version: string;
  environment: string;
  buildDate: string;
  docsUrl: string;
  license: string;
}

// Unified Combined Settings Object
export interface OrbitSettings {
  account: AccountSettings;
  appearance: AppearanceSettings;
  tasks: TaskPreferencesSettings;
  app: ApplicationPreferencesSettings;
  data: DataSettings;
  notifications: NotificationPreferencesSettings;
  security: SecuritySettings;
  about: AboutSettings;
}

