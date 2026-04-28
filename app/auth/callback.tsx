import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import * as Linking from "expo-linking";

import { CERDIK_COLORS } from "@/constants/colors";
import { restoreSessionFromUrl } from "@/services/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AuthCallbackScreen() {
  const [message, setMessage] = useState("Sedang memverifikasi akun...");
  const { loadStoredAuth } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const handleUrl = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (!url) {
          throw new Error("Link verifikasi tidak ditemukan.");
        }

        await restoreSessionFromUrl(url);
        await loadStoredAuth();
        if (!isMounted) return;

        setMessage("Verifikasi berhasil. Mengarahkan ke aplikasi...");
        router.dismissAll();
        router.replace("/(tabs)");
      } catch (error) {
        if (!isMounted) return;

        setMessage(error instanceof Error ? error.message : "Verifikasi gagal. Silakan login kembali.");
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 1500);
      }
    };

    handleUrl();

    return () => {
      isMounted = false;
    };
  }, [loadStoredAuth]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: CERDIK_COLORS.background,
        paddingHorizontal: 24,
      }}
    >
      <ActivityIndicator size="large" color={CERDIK_COLORS.primary} />
      <Text
        style={{
          marginTop: 16,
          fontSize: 16,
          lineHeight: 24,
          color: CERDIK_COLORS.textPrimary,
          textAlign: "center",
        }}
      >
        {message}
      </Text>
    </View>
  );
}
