import { router, Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, StatusBar } from "react-native";

import { CERDIK_COLORS } from "../constants/colors";
import { useAuthStore } from "../stores/useAuthStore";

export default function RootLayout() {
  const backgroundAtRef = useRef<number | null>(null);
  const { logout, touchSession } = useAuthStore();
  const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

  useEffect(() => {
    const onAppStateChange = async (state: AppStateStatus) => {
      if (state === "background" || state === "inactive") {
        backgroundAtRef.current = Date.now();
        await touchSession();
        return;
      }

      if (state === "active" && backgroundAtRef.current) {
        const elapsed = Date.now() - backgroundAtRef.current;
        backgroundAtRef.current = null;
        if (elapsed > SESSION_TIMEOUT_MS) {
          await logout();
          router.dismissAll();
          router.replace("/(auth)/login");
        }
      }
    };

    const sub = AppState.addEventListener("change", onAppStateChange);
    return () => sub.remove();
  }, [logout, touchSession]);

  return (
    <>
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
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: "Pengaturan" }} />
      </Stack>
    </>
  );
}
