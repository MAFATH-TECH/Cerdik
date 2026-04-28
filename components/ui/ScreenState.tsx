import { Pressable, Text, View } from "react-native";

import { CERDIK_COLORS } from "@/constants/colors";

export function ScreenLoading({ lines = 6 }: { lines?: number }) {
  return (
    <View style={{ padding: 20 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <View
          key={i}
          style={{
            height: i === 0 ? 28 : 18,
            borderRadius: 12,
            backgroundColor: "#EEF2F7",
            marginBottom: 12,
            width: i === 0 ? "55%" : i % 3 === 0 ? "90%" : "100%",
          }}
        />
      ))}
      <View style={{ height: 160, borderRadius: 16, backgroundColor: "#EEF2F7", marginTop: 10 }} />
      <View style={{ height: 160, borderRadius: 16, backgroundColor: "#EEF2F7", marginTop: 12 }} />
    </View>
  );
}

export function ScreenEmpty({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}: {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 56 }}>{emoji}</Text>
      <Text style={{ marginTop: 12, fontSize: 18, fontWeight: "900", color: CERDIK_COLORS.textPrimary, textAlign: "center" }}>
        {title}
      </Text>
      <Text style={{ marginTop: 8, color: CERDIK_COLORS.textSecondary, textAlign: "center", lineHeight: 20 }}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={{
            marginTop: 16,
            height: 48,
            paddingHorizontal: 16,
            borderRadius: 16,
            backgroundColor: CERDIK_COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ScreenError({
  title = "Ada kendala",
  description = "Coba lagi ya. Kalau masih gagal, tutup dan buka ulang aplikasinya.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 56 }}>🧯</Text>
      <Text style={{ marginTop: 12, fontSize: 18, fontWeight: "900", color: CERDIK_COLORS.textPrimary, textAlign: "center" }}>
        {title}
      </Text>
      <Text style={{ marginTop: 8, color: CERDIK_COLORS.textSecondary, textAlign: "center", lineHeight: 20 }}>
        {description}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={{
            marginTop: 16,
            height: 48,
            paddingHorizontal: 16,
            borderRadius: 16,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "900" }}>Coba Lagi</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

