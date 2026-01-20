import { useState, useEffect } from 'react';

interface NotificationSettings {
  emailNotifications: boolean;
  reportUpdates: boolean;
  newPatients: boolean;
}

const STORAGE_KEY = 'notification-settings';

const defaultSettings: NotificationSettings = {
  emailNotifications: true,
  reportUpdates: true,
  newPatients: false,
};

export function useNotificationSettings() {
  const [settings, setSettingsState] = useState<NotificationSettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettingsState((prev) => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
  };

  return { settings, updateSetting };
}
