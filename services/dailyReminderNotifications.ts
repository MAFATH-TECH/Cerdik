import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { userSettingsService } from "@/services/userSettingsService";

export const DAILY_REMINDER_IDS = {
  afternoon: "cerdik-daily-afternoon",
  evening: "cerdik-daily-evening",
} as const;

const TEST_REMINDER_IDS = {
  first: "cerdik-test-1",
  second: "cerdik-test-2",
} as const;

const ANDROID_CHANNEL_ID = "cerdik-daily-reminders";

const REMINDER_MESSAGES = [
  { title: "CERDIK 💰", body: "Sudahkah kamu hitung pengeluaran hari ini?" },
  { title: "Pengingat CERDIK", body: "Jangan lupa cek keuanganmu hari ini!" },
  { title: "Yuk buka CERDIK", body: "Sebelum scroll sosmed, catat transaksi dulu yuk ✨" },
  { title: "CERDIK mengingatkan", body: "5 menit cek uang saku lebih berharga daripada doomscroll!" },
  { title: "Hai, siswa cerdas! 📚", body: "Sudah catat jajan & ongkos hari ini belum?" },
] as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function pickMessage(seed: number) {
  return REMINDER_MESSAGES[Math.abs(seed) % REMINDER_MESSAGES.length];
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Pengingat Harian CERDIK",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: "#1A5C2E",
    sound: "default",
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const asked = await Notifications.requestPermissionsAsync();
  return Boolean(
    asked.granted || asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
  );
}

export async function cancelDailyReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_IDS.afternoon),
    Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_IDS.evening),
  ]);
}

/** Jadwalkan 2 pengingat harian: 17:00 & 20:00 */
export async function scheduleDailyReminders(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const granted = await requestReminderPermission();
  if (!granted) return false;

  await ensureAndroidChannel();
  await cancelDailyReminders();

  const daySeed = Math.floor(Date.now() / 86_400_000);
  const afternoonMsg = pickMessage(daySeed);
  const eveningMsg = pickMessage(daySeed + 1);

  const androidChannel =
    Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {};

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_IDS.afternoon,
    content: {
      title: afternoonMsg.title,
      body: afternoonMsg.body,
      sound: "default",
      data: { type: "daily_reminder" },
      ...androidChannel,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 17,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_IDS.evening,
    content: {
      title: eveningMsg.title,
      body: eveningMsg.body,
      sound: "default",
      data: { type: "daily_reminder" },
      ...androidChannel,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });

  return true;
}

export async function syncDailyRemindersFromSettings(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const settings = await userSettingsService.getSettings();
    if (settings.dailyNotificationsEnabled) {
      await scheduleDailyReminders();
    } else {
      await cancelDailyReminders();
    }
  } catch {
    // jangan ganggu startup
  }
}

export async function setDailyRemindersEnabled(
  enabled: boolean,
): Promise<{ ok: boolean; reason?: string }> {
  if (Platform.OS === "web") {
    return { ok: false, reason: "Notifikasi belum tersedia di web." };
  }

  await userSettingsService.saveSettings({ dailyNotificationsEnabled: enabled });

  if (!enabled) {
    await cancelDailyReminders();
    return { ok: true };
  }

  const scheduled = await scheduleDailyReminders();
  if (!scheduled) {
    await userSettingsService.saveSettings({ dailyNotificationsEnabled: false });
    return {
      ok: false,
      reason: "Izin notifikasi belum diberikan. Aktifkan di pengaturan HP lalu coba lagi.",
    };
  }
  return { ok: true };
}

function formatJamMenit(d: Date): string {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/** Tes: 2 notifikasi ~1 menit & ~2 menit dari sekarang (tanpa mengubah jadwal harian). */
export async function scheduleTestReminders(): Promise<{
  ok: boolean;
  reason?: string;
  waktu1?: string;
  waktu2?: string;
}> {
  if (Platform.OS === "web") {
    return { ok: false, reason: "Notifikasi belum tersedia di web." };
  }

  const granted = await requestReminderPermission();
  if (!granted) {
    return {
      ok: false,
      reason: "Izin notifikasi belum diberikan. Aktifkan di pengaturan HP lalu coba lagi.",
    };
  }

  await ensureAndroidChannel();

  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(TEST_REMINDER_IDS.first),
    Notifications.cancelScheduledNotificationAsync(TEST_REMINDER_IDS.second),
  ]);

  const androidChannel =
    Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {};

  const at1 = new Date(Date.now() + 60 * 1000);
  const at2 = new Date(Date.now() + 2 * 60 * 1000);
  const msg1 = REMINDER_MESSAGES[0];
  const msg2 = REMINDER_MESSAGES[1];

  await Notifications.scheduleNotificationAsync({
    identifier: TEST_REMINDER_IDS.first,
    content: {
      title: msg1.title,
      body: msg1.body,
      sound: "default",
      data: { type: "test_reminder" },
      ...androidChannel,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at1,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: TEST_REMINDER_IDS.second,
    content: {
      title: msg2.title,
      body: msg2.body,
      sound: "default",
      data: { type: "test_reminder" },
      ...androidChannel,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at2,
    },
  });

  return { ok: true, waktu1: formatJamMenit(at1), waktu2: formatJamMenit(at2) };
}
