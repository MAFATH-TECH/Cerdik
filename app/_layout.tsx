import "react-native-gesture-handler";

import { router, Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert, AppState, AppStateStatus, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Updates from "expo-updates";

import { CERDIK_COLORS } from "../constants/colors";
import { isSupabaseConfigured, supabase } from "../services/supabase";
import { useAuthStore } from "../stores/useAuthStore";
import { useGoalStore } from "../stores/useGoalStore";
import { useTransactionStore } from "../stores/useTransactionStore";

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

export default function RootLayout() {
  const backgroundAtRef = useRef<number | null>(null);
  const { loadStoredAuth, logout, syncSession } = useAuthStore();
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

    checkForUpdates().catch(() => undefined);
    loadStoredAuth();

    const subscription = isSupabaseConfigured
      ? supabase.auth
          .onAuthStateChange((_event, session) => {
            syncSession(session).catch(() => undefined);
          })
          .data.subscription
      : null;

    const onAppStateChange = async (state: AppStateStatus) => {
      if (!isSupabaseConfigured) return;

      if (state === "background" || state === "inactive") {
        backgroundAtRef.current = Date.now();
        await supabase.auth.stopAutoRefresh();
        return;
      }

      if (state === "active") {
        await supabase.auth.startAutoRefresh();

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
      }
    };

    const sub = AppState.addEventListener("change", onAppStateChange);
    return () => {
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
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
