import { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { clearLocalAuthSession, getSessionOrClear, isRefreshTokenError } from "@/services/authSession";
import { ensureSupabaseConfigured, getAuthCallbackUrl, isSupabaseConfigured, supabase } from "@/services/supabase";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  kelas: string;
  sekolah: string;
  phone?: string;
};

type RegisterPayload = {
  name: string;
  phone: string;
  email: string;
  password: string;
  kelas: string;
};

type AuthState = {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (payload: { email: string; password: string; rememberMe: boolean }) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: { name: string; kelas: string; sekolah: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  syncSession: (session: Session | null) => Promise<void>;
};

type ProfileRow = {
  id: string;
  email?: string | null;
  name?: string | null;
  full_name?: string | null;
  kelas: string;
  sekolah: string;
  phone?: string;
};

const mapProfileToUser = (profile: ProfileRow): AuthUser => ({
  id: profile.id,
  email: profile.email ?? "",
  name: profile.full_name ?? profile.name ?? "Pengguna CERDIK",
  kelas: profile.kelas,
  sekolah: profile.sekolah,
  phone: profile.phone,
});

const REMEMBER_ME_KEY = "cerdik:remember-me";

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: string }).message ?? "");
  }
  return String(error ?? "");
};

const sanitizeText = (value: string) => value.replace(/[<>"'`]/g, "").trim();
const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
};

const getProfileByUserId = async (userId: string) => {
  ensureSupabaseConfigured();
  const attemptFullName = await supabase
    .from("profiles")
    .select("id, email, full_name, kelas, sekolah, phone")
    .eq("id", userId)
    .single();

  if (!attemptFullName.error && attemptFullName.data) {
    return attemptFullName.data as ProfileRow;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, kelas, sekolah, phone")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data as ProfileRow;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  isHydrated: false,

  loadStoredAuth: async () => {
    try {
      if (!isSupabaseConfigured) {
        set({ user: null, session: null, isHydrated: true, isLoading: false });
        return;
      }

      const rememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      if (rememberMe === "false") {
        await clearLocalAuthSession();
        set({ user: null, session: null, isHydrated: true, isLoading: false });
        return;
      }

      const { session, error: sessionError } = await getSessionOrClear();

      if (sessionError && !isRefreshTokenError(sessionError)) {
        console.warn("[auth] getSession:", getErrorMessage(sessionError));
      }

      if (!session?.user) {
        set({ user: null, session: null, isHydrated: true, isLoading: false });
        return;
      }

      const profile = await getProfileByUserId(session.user.id);
      set({ user: mapProfileToUser(profile), session, isHydrated: true, isLoading: false });
    } catch (error) {
      if (isRefreshTokenError(error)) {
        await clearLocalAuthSession();
      }
      set({ user: null, session: null, isHydrated: true, isLoading: false });
    }
  },

  syncSession: async (session) => {
    if (!isSupabaseConfigured) {
      set({ user: null, session: null, isHydrated: true, isLoading: false });
      return;
    }

    if (!session?.user) {
      set({ user: null, session: null, isHydrated: true, isLoading: false });
      return;
    }

    try {
      const profile = await getProfileByUserId(session.user.id);
      set({ user: mapProfileToUser(profile), session, isHydrated: true, isLoading: false });
    } catch {
      set({ user: null, session, isHydrated: true, isLoading: false });
    }
  },

  login: async ({ email, password, rememberMe }) => {
    set({ isLoading: true });

    try {
      ensureSupabaseConfigured();
      await AsyncStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "true" : "false");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizeText(email).toLowerCase(),
        password,
      });

      if (error) throw error;
      if (!data.session || !data.user) {
        throw new Error("Login belum berhasil. Pastikan email kamu sudah diverifikasi.");
      }

      const profile = await getProfileByUserId(data.user.id);
      set({
        user: mapProfileToUser(profile),
        session: data.session,
        isLoading: false,
        isHydrated: true,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async ({ name, phone, email, password, kelas }) => {
    set({ isLoading: true });

    try {
      ensureSupabaseConfigured();
      const normalizedEmail = sanitizeText(email).toLowerCase();
      const normalizedPhone = normalizePhone(phone);

      const { data: availability, error: availabilityError } = await supabase.rpc("check_registration_availability", {
        p_email: normalizedEmail,
        p_phone: normalizedPhone,
      });

      if (availabilityError) throw availabilityError;
      const availabilityResult = Array.isArray(availability) ? availability[0] : availability;
      if (availabilityResult?.email_taken) {
        throw new Error("EMAIL_ALREADY_USED");
      }
      if (availabilityResult?.phone_taken) {
        throw new Error("PHONE_ALREADY_USED");
      }

      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            name: sanitizeText(name),
            phone: normalizedPhone,
            kelas: sanitizeText(kelas),
          },
        },
      });

      if (error) throw error;

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateProfile: async ({ name, kelas, sekolah }) => {
    set({ isLoading: true });

    try {
      ensureSupabaseConfigured();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Sesi login tidak ditemukan. Silakan masuk kembali.");
      }

      const fullNameAttempt = await supabase
        .from("profiles")
        .update({ full_name: name, kelas, sekolah })
        .eq("id", user.id)
        .select("id, email, full_name, kelas, sekolah, phone")
        .single();

      if (!fullNameAttempt.error && fullNameAttempt.data) {
        set({
          user: mapProfileToUser(fullNameAttempt.data as ProfileRow),
          isLoading: false,
        });
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({ name, kelas, sekolah })
        .eq("id", user.id)
        .select("id, email, name, kelas, sekolah, phone")
        .single();

      if (error) throw error;

      set({
        user: mapProfileToUser(data as ProfileRow),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await clearLocalAuthSession();
    set({ user: null, session: null, isLoading: false, isHydrated: true });
  },
}));
