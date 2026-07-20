import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/useAuthStore";

export default function IndexScreen() {
  const [target, setTarget] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        // Hydrasi auth hanya dari root layout — di sini cukup tunggu isHydrated
        if (!isHydrated) return;

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
  }, [isHydrated, user]);

  if (!target) return null;
  return <Redirect href={target as any} />;
}
