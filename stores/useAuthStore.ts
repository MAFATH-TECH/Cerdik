import { Session } from "@supabase/supabase-js";
import { create } from "zustand";

import { getAuthCallbackUrl, supabase } from "@/services/supabase";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  kelas: string;
  sekolah: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  kelas: string;
  sekolah: string;
};

type AuthState = {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: { name: string; kelas: string; sekolah: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  syncSession: (session: Session | null) => Promise<void>;
};

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  kelas: string;
  sekolah: string;
};

const mapProfileToUser = (profile: ProfileRow): AuthUser => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  kelas: profile.kelas,
  sekolah: profile.sekolah,
});

const getProfileByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, kelas, sekolah")
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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        set({ user: null, session: null, isHydrated: true, isLoading: false });
        return;
      }

      const profile = await getProfileByUserId(session.user.id);
      set({ user: mapProfileToUser(profile), session, isHydrated: true, isLoading: false });
    } catch {
      set({ user: null, session: null, isHydrated: true, isLoading: false });
    }
  },

  syncSession: async (session) => {
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

  login: async ({ email, password }) => {
    set({ isLoading: true });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
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

  register: async ({ name, email, password, kelas, sekolah }) => {
    set({ isLoading: true });

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            name,
            kelas,
            sekolah,
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Sesi login tidak ditemukan. Silakan masuk kembali.");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({ name, kelas, sekolah })
        .eq("id", user.id)
        .select("id, email, name, kelas, sekolah")
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
    await supabase.auth.signOut();
    set({ user: null, session: null, isLoading: false, isHydrated: true });
  },
}));
