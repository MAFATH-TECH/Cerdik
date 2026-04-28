import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

export default function IndexScreen() {
  const [target, setTarget] = useState<string | null>(null);
  const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      try {
        const [onboarded, rawAuth] = await Promise.all([
          AsyncStorage.getItem("CERDIK_ONBOARDED_V1"),
          AsyncStorage.getItem("cerdik_auth_v1"),
        ]);

        let hasValidSession = false;
        if (rawAuth) {
          try {
            const parsed = JSON.parse(rawAuth) as { token?: string; user?: unknown; lastActiveAt?: number };
            hasValidSession =
              Boolean(parsed.token && parsed.user) &&
              Date.now() - (parsed.lastActiveAt ?? 0) <= SESSION_TIMEOUT_MS;
            if (!hasValidSession) {
              await AsyncStorage.removeItem("cerdik_auth_v1");
            }
          } catch {
            await AsyncStorage.removeItem("cerdik_auth_v1");
          }
        }

        if (!mounted) return;
        if (!onboarded) setTarget("/onboarding");
        else if (hasValidSession) setTarget("/(tabs)");
        else setTarget("/(auth)/login");
      } catch {
        if (mounted) setTarget("/(auth)/login");
      }
    };
    boot();
    return () => {
      mounted = false;
    };
  }, []);

  if (!target) return null;
  return <Redirect href={target as any} />;
}
