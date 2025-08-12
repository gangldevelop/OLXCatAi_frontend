import { useState, useCallback } from 'react';
import { UserSettings } from '../types';

const mockSettings: UserSettings = {
  autoCategorize: true,
  notifications: true,
  batchProcessing: false,
  privacyMode: false,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(mockSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleSetting = useCallback((key: keyof UserSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(mockSettings);
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    toggleSetting,
    resetSettings,
  };
}; 