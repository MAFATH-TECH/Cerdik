import { isAuthRetryableFetchError, Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import { create } from "zustand";

import {
  AccountsData,
  clearAccountsData,
  loadAccountsData,
  MAX_ACCOUNTS,
  migrateLegacyLocalData,
  SavedAccount,
  updateAccountsData,
} from "@/services/accountStorage";
import { loginWithPhone } from "@/services/authService";
import { clearLocalAuthSession } from "@/services/authSession";
import { syncDailyRemindersFromSettings } from "@/services/dailyReminderNotifications";
import { createIsolatedClient, supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGoalStore } from "@/stores/useGoalStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { formatPhone } from "@/utils/phoneValidator";

export type AccountActionResult = {
  ok: boolean;
  error?: string;
  /** Token akun sudah tidak berlaku — minta pengguna memasukkan password lagi. */
  needsReauth?: boolean;
};

type AccountState = {
  accounts: SavedAccount[];
  activeUserId: string | null;
  /** Naik setiap kali akun aktif berganti; layar memakainya untuk memuat ulang state lokalnya. */
  switchEpoch: number;
  isSwitching: boolean;
  hydrate: () => Promise<void>;
  upsertFromSession: (session: Session) => Promise<void>;
  switchTo: (userId: string) => Promise<AccountActionResult>;
  addAccount: (phone: string, password: string) => Promise<AccountActionResult>;
  removeAccount: (userId: string) => Promise<void>;
  logoutActive: () => Promise<void>;
  logoutAll: () => Promise<void>;
  /** Dipakai saat buka app tanpa sesi aktif: coba masuk ke salah satu akun tersimpan. */
  restoreFromSaved: () => Promise<boolean>;
};

const NETWORK_ERROR = "Tidak ada koneksi internet. Coba lagi.";
const REAUTH_ERROR = "Sesi akun ini sudah berakhir. Masukkan password lagi.";

const buildAccount = (session: Session, existing?: SavedAccount): SavedAccount => {
  const { user } = session;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metaName =
    typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : undefined;
  const emailLocal = (user.email ?? "").split("@")[0] ?? "";
  const rawPhone =
    (typeof meta.phone === "string" && meta.phone) || (/^\d+$/.test(emailLocal) ? emailLocal : existing?.phone) || "";
  const authUser = useAuthStore.getState().user;

  return {
    userId: user.id,
    phone: rawPhone ? formatPhone(rawPhone) : "",
    name: (authUser?.id === user.id ? authUser.name : undefined) ?? existing?.name ?? metaName ?? "Pengguna CERDIK",
    email: user.email ?? existing?.email ?? "",
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
};

/** Cabut sesi server milik akun tersimpan lewat client terpisah (best effort, tidak mengganggu akun aktif). */
const revokeSavedAccount = async (account: SavedAccount) => {
  try {
    const client = createIsolatedClient();
    const { error } = await client.auth.setSession({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });
    if (!error) await client.auth.signOut({ scope: "local" });
  } catch {
    // token sudah mati atau offline — tetap hapus dari perangkat
  }
};

const resetUserData = () => {
  useTransactionStore.getState().resetState();
  useGoalStore.getState().resetState();
};

const goTo = (href: "/(tabs)" | "/(auth)/login") => {
  try {
    router.dismissAll();
  } catch {
    // tidak ada layar yang perlu ditutup
  }
  try {
    router.replace(href);
  } catch {
    // navigator belum siap (mis. saat buka app) — app/index.tsx akan mengarahkan sesuai status login
  }
};

export const useAccountStore = create<AccountState>((set, get) => {
  const applyData = (data: AccountsData) => set({ accounts: data.accounts, activeUserId: data.activeUserId });

  /** Sesi `session` kini menjadi sesi client utama: bersihkan data akun lama lalu muat akun baru. */
  const finalizeSwitch = async (session: Session) => {
    await get().upsertFromSession(session);
    resetUserData();
    await useAuthStore.getState().syncSession(session);
    set((s) => ({ switchEpoch: s.switchEpoch + 1 }));
    syncDailyRemindersFromSettings().catch(() => undefined);
    goTo("/(tabs)");
  };

  let authStoreBound = false;
  /** Jaga nama akun tersimpan tetap sama dengan profil (mis. setelah nama diubah di Pengaturan). */
  const bindAuthStore = () => {
    if (authStoreBound) return;
    authStoreBound = true;
    useAuthStore.subscribe((state, prev) => {
      const user = state.user;
      if (!user || user.name === prev.user?.name) return;
      updateAccountsData((d) => {
        const target = d.accounts.find((a) => a.userId === user.id);
        if (!target || target.name === user.name) return d;
        return { ...d, accounts: d.accounts.map((a) => (a.userId === user.id ? { ...a, name: user.name } : a)) };
      })
        .then(applyData)
        .catch(() => undefined);
    });
  };

  return {
    accounts: [],
    activeUserId: null,
    switchEpoch: 0,
    isSwitching: false,

    hydrate: async () => {
      bindAuthStore();
      applyData(await loadAccountsData());
    },

    upsertFromSession: async (session) => {
      let wasEmpty = false;
      const data = await updateAccountsData((d) => {
        const index = d.accounts.findIndex((a) => a.userId === session.user.id);
        if (index === -1 && d.accounts.length >= MAX_ACCOUNTS) return d;
        wasEmpty = d.accounts.length === 0;
        const next = buildAccount(session, d.accounts[index]);
        const accounts = index === -1 ? [...d.accounts, next] : d.accounts.map((a, i) => (i === index ? next : a));
        return { activeUserId: session.user.id, accounts };
      });
      applyData(data);
      // Pertama kali fitur ini jalan: data lokal lama menjadi milik akun yang sedang login.
      if (wasEmpty) await migrateLegacyLocalData(session.user.id);
    },

    switchTo: async (userId) => {
      if (get().isSwitching) return { ok: false, error: "Sedang berpindah akun. Tunggu sebentar." };
      set({ isSwitching: true });

      try {
        const target = get().accounts.find((a) => a.userId === userId);
        if (!target) return { ok: false, error: "Akun tidak ditemukan di perangkat ini." };

        const {
          data: { session: current },
        } = await supabase.auth.getSession();
        if (current?.user.id === userId) return { ok: true };

        // Simpan token terbaru akun yang sedang aktif sebelum ditinggalkan (tanpa signOut agar sesinya tetap hidup).
        if (current) await get().upsertFromSession(current);

        // Validasi/refresh token tujuan di client terpisah: jika gagal, akun aktif tidak ikut terganggu.
        const probe = createIsolatedClient();
        const { data: probed, error: probeError } = await probe.auth.setSession({
          access_token: target.accessToken,
          refresh_token: target.refreshToken,
        });
        if (probeError || !probed.session) {
          if (probeError && isAuthRetryableFetchError(probeError)) return { ok: false, error: NETWORK_ERROR };
          applyData(
            await updateAccountsData((d) => ({
              ...d,
              accounts: d.accounts.map((a) => (a.userId === userId ? { ...a, needsReauth: true } : a)),
            })),
          );
          return { ok: false, needsReauth: true, error: REAUTH_ERROR };
        }

        // Refresh token berputar: simpan yang baru dulu sebelum dipakai client utama.
        const fresh = probed.session;
        applyData(
          await updateAccountsData((d) => ({
            ...d,
            accounts: d.accounts.map((a) =>
              a.userId === userId
                ? { ...a, accessToken: fresh.access_token, refreshToken: fresh.refresh_token, needsReauth: undefined }
                : a,
            ),
          })),
        );

        const { data: applied, error } = await supabase.auth.setSession({
          access_token: fresh.access_token,
          refresh_token: fresh.refresh_token,
        });
        if (error || !applied.session) {
          return {
            ok: false,
            error: error && isAuthRetryableFetchError(error) ? NETWORK_ERROR : "Gagal berpindah akun. Coba lagi.",
          };
        }

        await finalizeSwitch(applied.session);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Gagal berpindah akun. Coba lagi." };
      } finally {
        set({ isSwitching: false });
      }
    },

    addAccount: async (phone, password) => {
      if (get().isSwitching) return { ok: false, error: "Sedang berpindah akun. Tunggu sebentar." };

      const formattedPhone = formatPhone(phone);
      const existing = get().accounts.find((a) => a.phone === formattedPhone);
      if (existing && !existing.needsReauth) {
        return { ok: false, error: "Akun ini sudah ada di perangkat ini. Pilih dari daftar akun untuk berpindah." };
      }
      if (!existing && get().accounts.length >= MAX_ACCOUNTS) {
        return { ok: false, error: `Maksimal ${MAX_ACCOUNTS} akun di satu perangkat.` };
      }

      set({ isSwitching: true });
      try {
        // Simpan token akun aktif sekarang; login akun baru akan menggantikan sesi di client utama.
        const {
          data: { session: current },
        } = await supabase.auth.getSession();
        if (current) await get().upsertFromSession(current);

        const result = await loginWithPhone(phone, password);
        if (!result.success) return { ok: false, error: result.error ?? "Login gagal. Coba lagi." };

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return { ok: false, error: "Login gagal. Coba lagi." };

        await finalizeSwitch(session);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Login gagal. Coba lagi." };
      } finally {
        set({ isSwitching: false });
      }
    },

    removeAccount: async (userId) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user.id === userId) {
        await get().logoutActive();
        return;
      }

      const target = get().accounts.find((a) => a.userId === userId);
      if (target) await revokeSavedAccount(target);
      applyData(
        await updateAccountsData((d) => ({ ...d, accounts: d.accounts.filter((a) => a.userId !== userId) })),
      );
    },

    logoutActive: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const activeId = session?.user.id ?? get().activeUserId;

      const data = await updateAccountsData((d) => ({
        activeUserId: null,
        accounts: d.accounts.filter((a) => a.userId !== activeId),
      }));
      applyData(data);

      await clearLocalAuthSession();
      resetUserData();
      set((s) => ({ switchEpoch: s.switchEpoch + 1 }));

      if (await get().restoreFromSaved()) return;
      goTo("/(auth)/login");
    },

    logoutAll: async () => {
      // Akun aktif dicabut lewat clearLocalAuthSession di bawah; sisanya lewat token tersimpan.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const activeId = session?.user.id ?? get().activeUserId;
      const others = get().accounts.filter((a) => a.userId !== activeId);
      await Promise.all(others.map(revokeSavedAccount));
      await clearAccountsData();
      applyData({ activeUserId: null, accounts: [] });

      await clearLocalAuthSession();
      resetUserData();
      set((s) => ({ switchEpoch: s.switchEpoch + 1 }));
      goTo("/(auth)/login");
    },

    restoreFromSaved: async () => {
      const candidates = get().accounts.filter((a) => !a.needsReauth);
      for (const account of candidates) {
        const result = await get().switchTo(account.userId);
        if (result.ok) return true;
      }
      return false;
    },
  };
});
