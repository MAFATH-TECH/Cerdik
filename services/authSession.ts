import AsyncStorage from "@react-native-async-storage/async-storage";

import { isSupabaseConfigured, supabase } from "./supabase";

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: string }).message ?? "");
  }
  return String(error ?? "");
};

/** Sesi lokal ada refresh token yang sudah tidak valid di server Supabase */
export const isRefreshTokenError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("refresh token") ||
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found")
  );
};

/** Hapus sesi auth dari perangkat (tanpa memanggil API revoke jika token sudah mati) */
export const clearLocalAuthSession = async () => {
  if (!isSupabaseConfigured) return;

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Token sudah invalid — signOut server bisa gagal; tetap bersihkan storage.
  }

  try {
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter((key) => key.includes("auth-token") || key.includes("supabase.auth"));
    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
    }
  } catch {
    // ignore
  }
};

/** Ambil sesi; jika refresh token rusak, bersihkan storage dan kembalikan null */
export const getSessionOrClear = async () => {
  if (!isSupabaseConfigured) {
    return { session: null, error: null as unknown };
  }

  const { data, error } = await supabase.auth.getSession();

  if (error && isRefreshTokenError(error)) {
    await clearLocalAuthSession();
    return { session: null, error };
  }

  return { session: data.session, error };
};
