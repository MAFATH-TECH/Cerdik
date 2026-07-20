import "react-native-gesture-handler";

import { router, Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert, AppState, AppStateStatus, InteractionManager, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Updates from "expo-updates";

import { CERDIK_COLORS } from "../constants/colors";
import { syncDailyRemindersFromSettings } from "../services/dailyReminderNotifications";
import { clearLocalAuthSession, getSessionOrClear, isRefreshTokenError } from "../services/authSession";
import { isSupabaseConfigured, supabase } from "../services/supabase";
import { useAuthStore } from "../stores/useAuthStore";
import { useGoalStore } from "../stores/useGoalStore";
import { useTransactionStore } from "../stores/useTransactionStore";

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

export default function RootLayout() {
  const backgroundAtRef = useRef<number | null>(null);
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  const logout = useAuthStore((s) => s.logout);
  const syncSession = useAuthStore((s) => s.syncSession);
  const resetTransactionState = useTransactionStore((s) => s.resetState);
  const resetGoalState = useGoalStore((s) => s.resetState);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {  
        if (!Updates.isEmbeddedLaunch) return;
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable) return;
        await Updates.fetchUpdateAsync();
        Alert.alert("Update Tersedia! 🎉", "CERDIK telah diperbarui. Restart sekarang?", [
          { text: "Nanti", style: "cancel" },
          { text: "Restart", onPress: () => Updates.reloadAsync() },
        ]);
      } catch {
        // ignore
      }
    };

    // Jangan bersaing dengan first paint / navigasi awal
    const task = InteractionManager.runAfterInteractions(() => {
      checkForUpdates().catch(() => undefined);
      syncDailyRemindersFromSettings().catch(() => undefined);
    });
    loadStoredAuth();

    const subscription = isSupabaseConfigured
      ? supabase.auth
          .onAuthStateChange((event, session) => {
            if (event === "SIGNED_OUT" || !session) {
              syncSession(null).catch(() => undefined);
              return;
            }
            syncSession(session).catch(async (error) => {
              if (isRefreshTokenError(error)) {
                await clearLocalAuthSession();
                await logout();
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
        // Fire-and-forget: jangan blok UI saat app kembali aktif
        void (async () => {
          const { session, error } = await getSessionOrClear();
          if (error && isRefreshTokenError(error)) {
            await logout();
            resetTransactionState();
            resetGoalState();
            router.dismissAll();
            router.replace("/(auth)/login");
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
            await logout();
            resetTransactionState();
            resetGoalState();
            router.dismissAll();
            router.replace("/(auth)/login");
          }
        })();
      }
    };

    const sub = AppState.addEventListener("change", onAppStateChange);
    return () => {
      task.cancel();
      sub.remove();
      subscription?.unsubscribe();
    };
  }, [loadStoredAuth, logout, resetGoalState, resetTransactionState, syncSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <Stack
          initialRouteName="index"
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
          <Stack.Screen name="transactions" options={{ title: "Semua Transaksi" }} />
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
