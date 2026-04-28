import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_STORAGE_KEY = "cerdik_auth_v1";
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

type AuthUser = {
  id: string;
  name: string;
  email: string;
  kelas: string;
  sekolah: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    kelas: string;
    sekolah: string;
  }) => Promise<void>;
  updateProfile: (payload: { name: string; kelas: string; sekolah: string }) => Promise<void>;
  touchSession: () => Promise<void>;
  isSessionValid: () => Promise<boolean>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const rawAuth = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!rawAuth) {
        set({ user: null, token: null, isLoading: false });
        return;
      }

      const parsed = JSON.parse(rawAuth) as { user?: AuthUser; token?: string; lastActiveAt?: number };
      const lastActiveAt = parsed.lastActiveAt ?? 0;
      const expired = Date.now() - lastActiveAt > SESSION_TIMEOUT_MS;
      if (!parsed.user || !parsed.token || expired) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        set({ user: null, token: null, isLoading: false });
        return;
      }

      set({ user: parsed.user, token: parsed.token, isLoading: false });
    } catch {
      set({ user: null, token: null, isLoading: false });
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 900));

    if (!email || !password) {
      set({ isLoading: false });
      throw new Error("Email dan password wajib diisi.");
    }

    if (password.length < 6) {
      set({ isLoading: false });
      throw new Error("Password minimal 6 karakter.");
    }

    // Simulasi login demo.
    if (email.toLowerCase().includes("gagal")) {
      set({ isLoading: false });
      throw new Error("Login gagal. Cek kembali akunmu.");
    }

    const user: AuthUser = {
      id: `usr-${Date.now()}`,
      name: "Siswa CERDIK",
      email,
      kelas: "XI",
      sekolah: "MAN 1 Kendari",
    };
    const token = `token-${Date.now()}`;

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ user, token, lastActiveAt: Date.now() }),
    );
    set({ user, token, isLoading: false });
  },

  register: async ({ name, email, password, kelas, sekolah }) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!name || !email || !password || !kelas || !sekolah) {
      set({ isLoading: false });
      throw new Error("Semua field wajib diisi.");
    }

    const user: AuthUser = {
      id: `usr-${Date.now()}`,
      name,
      email,
      kelas,
      sekolah,
    };
    const token = `token-${Date.now()}`;

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ user, token, lastActiveAt: Date.now() }),
    );
    set({ user, token, isLoading: false });
  },

  updateProfile: async ({ name, kelas, sekolah }) => {
    set({ isLoading: true });
    try {
      const rawAuth = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!rawAuth) {
        set({ isLoading: false });
        return;
      }
      const parsed = JSON.parse(rawAuth) as { user: AuthUser; token: string; lastActiveAt?: number };
      const updatedUser: AuthUser = { ...parsed.user, name, kelas, sekolah };
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: updatedUser, token: parsed.token, lastActiveAt: Date.now() }),
      );
      set({ user: updatedUser, token: parsed.token, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  touchSession: async () => {
    try {
      const rawAuth = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!rawAuth) return;
      const parsed = JSON.parse(rawAuth) as { user?: AuthUser; token?: string; lastActiveAt?: number };
      if (!parsed.user || !parsed.token) return;
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: parsed.user, token: parsed.token, lastActiveAt: Date.now() }),
      );
    } catch {
      // ignore session touch failures
    }
  },

  isSessionValid: async () => {
    try {
      const rawAuth = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!rawAuth) return false;
      const parsed = JSON.parse(rawAuth) as { user?: AuthUser; token?: string; lastActiveAt?: number };
      const lastActiveAt = parsed.lastActiveAt ?? 0;
      const valid = Boolean(parsed.user && parsed.token) && Date.now() - lastActiveAt <= SESSION_TIMEOUT_MS;
      if (!valid) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        set({ user: null, token: null, isLoading: false });
      }
      return valid;
    } catch {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => undefined);
      set({ user: null, token: null, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    set({ user: null, token: null, isLoading: false });
  },
}));
