import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "./supabase";

/** Total akun di satu perangkat: 1 akun utama + 3 akun tambahan. */
export const MAX_ACCOUNTS = 4;

const ACCOUNTS_KEY = "cerdik:accounts:v1";

/** Key data lokal lama (sebelum dipisah per akun). Dimigrasi sekali ke akun pertama yang tersimpan. */
const LEGACY_LOCAL_KEYS = ["cerdik_settings_v1", "cerdik_kuis_skor", "cerdik_kuis_status"] as const;

export type SavedAccount = {
  userId: string;
  phone: string;
  name: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  /** Token tidak bisa dipakai lagi — pengguna harus memasukkan password. */
  needsReauth?: boolean;
};

export type AccountsData = {
  activeUserId: string | null;
  accounts: SavedAccount[];
};

const EMPTY: AccountsData = { activeUserId: null, accounts: [] };

const isSavedAccount = (value: unknown): value is SavedAccount => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.userId === "string" &&
    typeof v.accessToken === "string" &&
    typeof v.refreshToken === "string" &&
    typeof v.phone === "string" &&
    typeof v.name === "string" &&
    typeof v.email === "string"
  );
};

export async function loadAccountsData(): Promise<AccountsData> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<AccountsData>;
    const accounts = Array.isArray(parsed.accounts) ? parsed.accounts.filter(isSavedAccount) : [];
    return {
      activeUserId: typeof parsed.activeUserId === "string" ? parsed.activeUserId : null,
      accounts: accounts.slice(0, MAX_ACCOUNTS),
    };
  } catch {
    return EMPTY;
  }
}

/** Semua tulis ke daftar akun diantrikan supaya event auth yang beruntun tidak saling menimpa. */
let writeQueue: Promise<unknown> = Promise.resolve();

export function updateAccountsData(mutator: (current: AccountsData) => AccountsData): Promise<AccountsData> {
  const run = writeQueue.then(async () => {
    const current = await loadAccountsData();
    const next = mutator(current);
    if (next !== current) {
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
    }
    return next;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

export async function clearAccountsData(): Promise<void> {
  await updateAccountsData(() => ({ ...EMPTY }));
}

/** Key AsyncStorage yang terpisah per akun. */
export const scopedKey = (baseKey: string, userId: string) => `${baseKey}:${userId}`;

/** ID akun yang sedang aktif di client Supabase (sumber kebenaran), atau null jika belum login. */
export async function getActiveUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

/** Pindahkan data lokal lama (tanpa penanda akun) ke akun `userId`, lalu hapus key lamanya. */
export async function migrateLegacyLocalData(userId: string): Promise<void> {
  try {
    for (const baseKey of LEGACY_LOCAL_KEYS) {
      const legacy = await AsyncStorage.getItem(baseKey);
      if (legacy === null) continue;
      const target = scopedKey(baseKey, userId);
      if ((await AsyncStorage.getItem(target)) === null) {
        await AsyncStorage.setItem(target, legacy);
      }
      await AsyncStorage.removeItem(baseKey);
    }
  } catch {
    // migrasi gagal tidak boleh menghalangi login
  }
}
