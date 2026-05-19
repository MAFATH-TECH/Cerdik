import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TOPIK_KUIS, type TopikKuis } from "@/constants/edukasiData";
import { EDUKASI_COLORS } from "@/constants/edukasiTheme";
import { getKuisSkor, getKuisStatus, type KuisStatusMap } from "@/services/edukasiKuisStorage";

function TopikKuisCard({ topik, selesai }: { topik: TopikKuis; selesai: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(`/edukasi/kuis/${topik.id}`)}
      style={{
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: EDUKASI_COLORS.cardBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 28 }}>{topik.emoji}</Text>
      </View>

      <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: EDUKASI_COLORS.primary }}>{topik.judul}</Text>
        <Text style={{ marginTop: 4, fontSize: 12, color: EDUKASI_COLORS.textMuted }}>
          {topik.jumlahSoal} soal • {topik.poin} poin
        </Text>
      </View>

      {selesai ? (
        <View
          style={{
            backgroundColor: "#E8F5E9",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: EDUKASI_COLORS.primary }}>✓ Selesai</Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: EDUKASI_COLORS.primary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}>Mulai</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function KuisScreen() {
  const insets = useSafeAreaInsets();
  const [skor, setSkor] = useState(0);
  const [status, setStatus] = useState<KuisStatusMap>({});

  const loadProgress = useCallback(async () => {
    const [skorBaru, statusBaru] = await Promise.all([getKuisSkor(), getKuisStatus()]);
    setSkor(skorBaru);
    setStatus(statusBaru);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress().catch(() => undefined);
    }, [loadProgress]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: EDUKASI_COLORS.bodyBg }}>
      <View style={{ backgroundColor: EDUKASI_COLORS.primary, paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 40 }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>
            Kuis Finansial
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[EDUKASI_COLORS.primary, "#2D8C4E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Total Poin Kamu</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <Text style={{ fontSize: 36, fontWeight: "800", color: "#FFFFFF" }}>{skor}</Text>
            <Text style={{ fontSize: 28, marginLeft: 10 }}>🏆</Text>
          </View>
          <Text style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.9)" }}>
            Selesaikan semua kuis untuk poin maksimal!
          </Text>
        </LinearGradient>

        {TOPIK_KUIS.map((topik) => (
          <TopikKuisCard key={topik.id} topik={topik} selesai={Boolean(status[topik.id])} />
        ))}
      </ScrollView>
    </View>
  );
}
