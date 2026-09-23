import { useState, useEffect, useCallback } from 'react';
import type { OrbitSettings } from '../types';
import {
  defaultOrbitSettings,
  getStoredLocalSettings,
  supabaseSettingsService,
} from '../lib/supabase';

export interface UseSettingsReturn {
  settings: OrbitSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (partial: Partial<OrbitSettings>) => Promise<OrbitSettings>;
  resetSettings: () => Promise<OrbitSettings>;
  refreshSettings: () => Promise<void>;
}

/**
 * React hook to manage Orbit user settings across all 8 logical areas:
 * - Account (User profile, timezone)
 * - Appearance (Theme, compact mode, reduced motion)
 * - Task Preferences (Default priority, filter view, sort, show completed)
 * - Application Preferences (Time format, week start, landing view, sidebar)
 * - Data (Backup status, storage usage estimate)
 * - Notifications (In-app alerts, email digest)
 * - Security (Session status, last sign in)
 * - About (Static version and app metadata)
 */
export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<OrbitSettings>(getStoredLocalSettings);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await supabaseSettingsService.fetchSettings();
      setSettings(fetched);
    } catch (err) {
      console.warn('Settings load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback(
    async (partial: Partial<OrbitSettings>): Promise<OrbitSettings> => {
      // Optimistic state update
      setSettings((prev) => ({
        ...prev,
        account: { ...prev.account, ...(partial.account || {}) },
        appearance: { ...prev.appearance, ...(partial.appearance || {}) },
        tasks: { ...prev.tasks, ...(partial.tasks || {}) },
        app: { ...prev.app, ...(partial.app || {}) },
        data: { ...prev.data, ...(partial.data || {}) },
        notifications: { ...prev.notifications, ...(partial.notifications || {}) },
        security: { ...prev.security, ...(partial.security || {}) },
        about: prev.about,
      }));

      try {
        const saved = await supabaseSettingsService.updateSettings(partial);
        setSettings(saved);
        return saved;
      } catch (err) {
        console.warn('Settings update error:', err);
        setError(err instanceof Error ? err.message : 'Failed to persist settings');
        throw err;
      }
    },
    []
  );

  const resetSettings = useCallback(async (): Promise<OrbitSettings> => {
    setSettings(defaultOrbitSettings);
    try {
      const reset = await supabaseSettingsService.resetSettings();
      setSettings(reset);
      return reset;
    } catch (err) {
      console.warn('Settings reset error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      throw err;
    }
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    resetSettings,
    refreshSettings,
  };
};
