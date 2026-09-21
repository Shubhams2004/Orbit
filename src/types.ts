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
