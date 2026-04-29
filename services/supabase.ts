import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { createClient, processLock } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Supabase client seharusnya memakai `anon public key`.
// Kadang project menamai variabelnya berbeda-beda, jadi kita dukung beberapa nama env.
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const SUPABASE_CONFIG_ERROR =
  "Konfigurasi Supabase belum diisi. Tambahkan EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY (anon public key) di .env lalu restart Expo.";

const isLikelyJwt = (value: string | undefined) => {
  if (!value) return false;
  // anon public key Supabase umumnya berbentuk JWT: base64url.base64url.base64url
  const parts = value.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
};

const supabaseKeyErrorHint = () => {
  if (!supabaseAnonKey) return null;
  if (supabaseAnonKey.startsWith("sb_publishable_")) {
    return "Key yang dipakai saat ini terlihat seperti `sb_publishable_...`. Harap ganti dengan `anon public` key dari Supabase Dashboard (Project Settings -> API).";
  }
  if (!isLikelyJwt(supabaseAnonKey)) {
    return "Key Supabase tidak terlihat seperti `anon public` JWT. Pastikan pakai `anon public key` (bukan service role key dan bukan publishable key generik).";
  }
  return null;
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && isLikelyJwt(supabaseAnonKey));

export const ensureSupabaseConfigured = () => {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }
  const keyHint = supabaseKeyErrorHint();
  if (keyHint) throw new Error(keyHint);
};

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
  {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

export const getAuthCallbackUrl = () => Linking.createURL("/auth/callback");

export const restoreSessionFromUrl = async (url: string) => {
  ensureSupabaseConfigured();
  const normalizedUrl = url.replace("#", "?");
  const parsedUrl = new URL(normalizedUrl);

  const code = parsedUrl.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const accessToken = parsedUrl.searchParams.get("access_token");
  const refreshToken = parsedUrl.searchParams.get("refresh_token");

  if (!accessToken || !refreshToken) return;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;
};
