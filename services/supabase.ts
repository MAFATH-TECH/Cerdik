import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { createClient, processLock } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_CONFIG_ERROR =
  "Konfigurasi Supabase belum diisi. Tambahkan EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY di .env lalu restart Expo.";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const ensureSupabaseConfigured = () => {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }
};

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabasePublishableKey ?? "placeholder-anon-key",
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
