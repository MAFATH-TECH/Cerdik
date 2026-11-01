import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, AppState, AppStateStatus, StatusBar, View, Text, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Updates from "expo-updates";

import { CERDIK_COLORS } from "../constants/colors";
import { syncDailyRemindersFromSettings } from "../services/dailyReminderNotifications";
import { getSessionOrClear, isRefreshTokenError } from "../services/authSession";
import { isSupabaseConfigured, supabase } from "../services/supabase";
import { useAccountStore } from "../stores/useAccountStore";
import { useAuthStore } from "../stores/useAuthStore";

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

export const unstable_settings = { initialRouteName: "index" };

export default function RootLayout() {
  const [isUpdating, setIsUpdating] = useState(false); // <--- Tambahkan ini
  const backgroundAtRef = useRef<number | null>(null);
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  const syncSession = useAuthStore((s) => s.syncSession);
  const hydrateAccounts = useAccountStore((s) => s.hydrate);
  const upsertAccountFromSession = useAccountStore((s) => s.upsertFromSession);
  const logoutActiveAccount = useAccountStore((s) => s.logoutActive);
  const restoreFromSaved = useAccountStore((s) => s.restoreFromSaved);

    useEffect(() => {
      const checkForUpdates = async () => {
        // Proteksi agar tidak berjalan saat coding di lokal
        if (__DEV__) return;
  
        try {
          const update = await Updates.checkForUpdateAsync();
          if (!update.isAvailable) return;
  
          // Munculkan konfirmasi terlebih dahulu demi kenyamanan pengguna
          Alert.alert(
            "Pembaruan Tersedia! 🎉", 
            "Versi terbaru CERDIK siap dipasang untuk performa lebih baik. Restart sekarang?", 
            [
              { text: "Nanti Saja", style: "cancel" },
              { 
                text: "Restart Sekarang", 
                onPress: async () => {
                  try {
                    setIsUpdating(true); // Tampilkan layar loading hijau CERDIK
                    await Updates.fetchUpdateAsync(); // Unduh bundel baru
                    await Updates.reloadAsync(); // Restart aplikasi instan
                  } catch (err) {
                    console.log("Gagal mengunduh update:", err);
                    setIsUpdating(false);
                  }
                } 
              },
            ]
          );
        } catch {
          // ignore error pengecekan jaringan
        }
      };
  
      // Jangan bersaing dengan first paint / navigasi awal
      const task = setTimeout(() => {
        checkForUpdates().catch(() => undefined);
      }, 0);

      const bootstrap = async () => {
        await hydrateAccounts();
        await loadStoredAuth();

        const { session } = useAuthStore.getState();
        if (session) {
          // Sesi yang sudah ada sebelum fitur ganti akun otomatis masuk ke daftar akun.
          await upsertAccountFromSession(session);
        } else {
          // Sesi aktif sudah tidak valid, tapi mungkin masih ada akun lain yang tersimpan.
          await restoreFromSaved();
        }
        // Pengingat harian mengikuti pengaturan akun yang aktif.
        await syncDailyRemindersFromSettings();
      };
      bootstrap().catch(() => undefined);

      const subscription = isSupabaseConfigured
        ? supabase.auth
            .onAuthStateChange((event, session) => {
              if (event === "SIGNED_OUT" || !session) {
                syncSession(null).catch(() => undefined);
                return;
              }
              // Token berputar saat di-refresh — salinan di daftar akun harus selalu yang terbaru.
              upsertAccountFromSession(session).catch(() => undefined);
              syncSession(session).catch(async (error) => {
                if (isRefreshTokenError(error)) {
                  await logoutActiveAccount();
                }
              });
            })
            .data.subscription
        : null;
  
      const onAppStateChange = (state: AppStateStatus) => {
        if (!isSupabaseConfigured) return;
  
        if (state === "background" || state === "inactive") {
          backgroundAtRef.current = Date.now();
          supabase.auth.stopAutoRefresh().catch(() => undefined);
          return;
        }
  
        if (state === "active") {
          checkForUpdates().catch(() => undefined); // <--- Jalankan cek update setiap app dibuka dari background
  
          void (async () => {
            const { session, error } = await getSessionOrClear();
            if (error && isRefreshTokenError(error)) {
              await logoutActiveAccount();
              return;
            }
  
            if (session) {
              await syncSession(session).catch(() => undefined);
              await supabase.auth.startAutoRefresh();
            }
  
            if (!backgroundAtRef.current) return;
            const elapsed = Date.now() - backgroundAtRef.current;
            backgroundAtRef.current = null;
            if (elapsed > SESSION_TIMEOUT_MS) {
              await logoutActiveAccount();
            }
          })();
        }
      };

      const sub = AppState.addEventListener("change", onAppStateChange);
      return () => {
        clearTimeout(task);
        sub.remove();
        subscription?.unsubscribe();
      };
    }, [
      hydrateAccounts,
      loadStoredAuth,
      logoutActiveAccount,
      restoreFromSaved,
      syncSession,
      upsertAccountFromSession,
    ]);
  
  // Jika pengguna menekan "Restart Sekarang", kunci layar dengan animasi loading ini
  if (isUpdating) {
    return (
      <View 
        style={{
          flex: 1,
          backgroundColor: "#0E5230",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", marginTop: 20, fontWeight: "bold", fontSize: 16 }}>
          Memperbarui Aplikasi CERDIK...
        </Text>
        <Text style={{ color: "#E0E0E0", marginTop: 8, fontSize: 13 }}>
          Mohon tunggu, kode versi baru sedang diterapkan.
        </Text>
      </View>
    );
  }

  return (
    
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: CERDIK_COLORS.card },
            headerTintColor: CERDIK_COLORS.textPrimary,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: CERDIK_COLORS.background },
            freezeOnBlur: true,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(auth)/login"
            options={{  
              title: "Masuk",
              headerBackVisible: false,
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="(auth)/register" options={{ title: "Daftar" }} />
          <Stack.Screen name="(auth)/verify-email" options={{ title: "Cek Email" }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ title: "Pengaturan" }} />
          <Stack.Screen name="add-account" options={{ title: "Tambah Akun" }} />
          <Stack.Screen name="transactions" options={{ title: "Semua Transaksi" }} />
          <Stack.Screen name="saldo-bulanan" options={{ title: "Riwayat Saldo" }} />
          <Stack.Screen name="edit-transaction" options={{ title: "Edit Transaksi" }} />
          <Stack.Screen name="edukasi/index" options={{ headerShown: false }} />
          <Stack.Screen name="edukasi/pengetahuan" options={{ headerShown: false }} />
          <Stack.Screen name="edukasi/pengetahuan/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="edukasi/tips" options={{ headerShown: false }} />
          <Stack.Screen name="edukasi/kuis" options={{ headerShown: false }} />
          <Stack.Screen name="edukasi/kuis/[id]" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
