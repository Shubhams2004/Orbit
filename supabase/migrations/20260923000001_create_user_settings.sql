-- Orbit Migration: S6.1 Settings Architecture + Data Model
-- Timestamp: 20260923000001
-- Description: Creates the 'user_settings' table, enables RLS, establishes user-scoped preferences data model, and sets up security policies.

-- 1. Create 'user_settings' table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Account Preferences
  display_name text,
  timezone text NOT NULL DEFAULT 'UTC',

  -- Task Preferences
  default_task_priority text NOT NULL DEFAULT 'Medium priority' CHECK (default_task_priority IN ('High priority', 'Medium priority', 'Low priority')),
  default_task_view text NOT NULL DEFAULT 'all' CHECK (default_task_view IN ('all', 'today', 'upcoming', 'completed')),
  default_task_sort text NOT NULL DEFAULT 'due_date' CHECK (default_task_sort IN ('due_date', 'priority', 'title')),
  show_completed_tasks boolean NOT NULL DEFAULT true,
  auto_archive_tasks boolean NOT NULL DEFAULT false,

  -- Application Preferences
  time_format text NOT NULL DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  week_start text NOT NULL DEFAULT 'monday' CHECK (week_start IN ('monday', 'sunday')),
  default_landing_view text NOT NULL DEFAULT 'home' CHECK (default_landing_view IN ('home', 'tasks', 'projects', 'assistant')),

  -- Notification Preferences
  in_app_alerts boolean NOT NULL DEFAULT true,
  email_digest text NOT NULL DEFAULT 'never' CHECK (email_digest IN ('never', 'daily', 'weekly')),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 2. Row Level Security (RLS) for 'user_settings'
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own settings
CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own settings
CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own settings
CREATE POLICY "Users can delete their own settings"
ON public.user_settings
FOR DELETE
USING (auth.uid() = user_id);

-- 3. Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
