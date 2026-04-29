import AsyncStorage from "@react-native-async-storage/async-storage";

export const SETTINGS_STORAGE_KEY = "cerdik_settings_v1";

export type UserLocalSettings = {
  dailyNotificationsEnabled: boolean;
  weeklyExpenseLimit: number;
};

const DEFAULT_SETTINGS: UserLocalSettings = {
  dailyNotificationsEnabled: true,
  weeklyExpenseLimit: 0,
};

export const userSettingsService = {
  async getSettings(): Promise<UserLocalSettings> {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
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
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  },
};
