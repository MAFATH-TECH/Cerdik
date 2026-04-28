import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/useAuthStore";

export default function IndexScreen() {
  const [target, setTarget] = useState<string | null>(null);
  const { user, isHydrated, loadStoredAuth } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        if (!isHydrated) {
          await loadStoredAuth();
        }

        if (!mounted) return;

        const onboarded = await AsyncStorage.getItem("CERDIK_ONBOARDED_V1");
        if (!mounted) return;

        if (!onboarded) {
          setTarget("/onboarding");
          return;
        }

        setTarget(user ? "/(tabs)" : "/(auth)/login");
      } catch {
        if (mounted) setTarget("/(auth)/login");
      }
    };

    boot();
    return () => {
      mounted = false;
    };
  }, [isHydrated, loadStoredAuth, user]);

  if (!target) return null;
  return <Redirect href={target as any} />;
}
