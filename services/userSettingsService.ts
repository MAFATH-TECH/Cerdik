import AsyncStorage from "@react-native-async-storage/async-storage";

import { getActiveUserId, scopedKey } from "./accountStorage";

export const SETTINGS_STORAGE_KEY = "cerdik_settings_v1";

export type UserLocalSettings = {
  dailyNotificationsEnabled: boolean;
  weeklyExpenseLimit: number;
};

const DEFAULT_SETTINGS: UserLocalSettings = {
  dailyNotificationsEnabled: true,
  weeklyExpenseLimit: 0,
};

/** Pengaturan disimpan per akun; null jika belum ada akun yang login. */
const getStorageKey = async () => {
  const userId = await getActiveUserId();
  return userId ? scopedKey(SETTINGS_STORAGE_KEY, userId) : null;
};

export const userSettingsService = {
  async getSettings(): Promise<UserLocalSettings> {
    try {
      const storageKey = await getStorageKey();
      const raw = storageKey ? await AsyncStorage.getItem(storageKey) : null;
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw) as Partial<UserLocalSettings>;
      return {
        dailyNotificationsEnabled:
          typeof parsed.dailyNotificationsEnabled === "boolean"
            ? parsed.dailyNotificationsEnabled
            : DEFAULT_SETTINGS.dailyNotificationsEnabled,
        weeklyExpenseLimit:
          typeof parsed.weeklyExpenseLimit === "number" && Number.isFinite(parsed.weeklyExpenseLimit)
            ? Math.max(0, Math.round(parsed.weeklyExpenseLimit))
            : DEFAULT_SETTINGS.weeklyExpenseLimit,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(next: Partial<UserLocalSettings>): Promise<UserLocalSettings> {
    const current = await this.getSettings();
    const merged: UserLocalSettings = {
      ...current,
      ...next,
      weeklyExpenseLimit:
        typeof next.weeklyExpenseLimit === "number"
          ? Math.max(0, Math.round(next.weeklyExpenseLimit))
          : current.weeklyExpenseLimit,
    };
    const storageKey = await getStorageKey();
    if (storageKey) {
      await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
    }
    return merged;
  },
};
