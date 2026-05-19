import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CategoryFilterChips from "@/components/edukasi/CategoryFilterChips";
import { ARTIKEL_EKONOMI, type ArtikelEkonomi } from "@/constants/edukasiData";
import { FILTER_CHIP_ITEMS, type FilterChip, getTagBadgeStyle } from "@/constants/edukasiPengetahuan";
import { EDUKASI_COLORS } from "@/constants/edukasiTheme";

function ArtikelCard({ artikel }: { artikel: ArtikelEkonomi }) {
  const badge = getTagBadgeStyle(artikel.tag);

  return (
    <Pressable
      onPress={() => router.push(`/edukasi/pengetahuan/${artikel.id}`)}
      style={{
        marginHorizontal: 12,
        marginVertical: 6,
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        padding: 14,
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
        <Text style={{ fontSize: 28 }}>{artikel.emoji}</Text>
      </View>

      <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: badge.bg,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "700", color: badge.text }}>{artikel.tag}</Text>
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: EDUKASI_COLORS.primary, lineHeight: 20 }} numberOfLines={2}>
          {artikel.judul}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 12, color: EDUKASI_COLORS.textMuted }} numberOfLines={1}>
          {artikel.ringkasan}
        </Text>
        <Text style={{ marginTop: 6, fontSize: 11, color: EDUKASI_COLORS.secondary, fontWeight: "600" }}>
          ⏱ {artikel.durasi}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={EDUKASI_COLORS.secondary} />
    </Pressable>
  );
}

export default function PengetahuanScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState<FilterChip>("Semua");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARTIKEL_EKONOMI.filter((artikel) => {
      const matchChip = activeChip === "Semua" || artikel.tag === activeChip;
      if (!matchChip) return false;
      if (!q) return true;
      return (
        artikel.judul.toLowerCase().includes(q) ||
        artikel.ringkasan.toLowerCase().includes(q) ||
        artikel.tag.toLowerCase().includes(q)
      );
    });
  }, [activeChip, query]);

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
            Pengetahuan Ekonomi
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 44,
            }}
          >
            <Ionicons name="search" size={20} color={EDUKASI_COLORS.secondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari artikel..."
              placeholderTextColor="#94A3B8"
              style={{ flex: 1, marginLeft: 8, fontSize: 14, color: EDUKASI_COLORS.textDark }}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <CategoryFilterChips
        items={FILTER_CHIP_ITEMS}
        activeKey={activeChip}
        onSelect={(key) => setActiveChip(key as FilterChip)}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🔍</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: EDUKASI_COLORS.primary }}>Artikel tidak ditemukan</Text>
            <Text style={{ marginTop: 6, fontSize: 13, color: EDUKASI_COLORS.textMuted, textAlign: "center" }}>
              Coba kata kunci atau filter lain
            </Text>
          </View>
        ) : (
          filtered.map((artikel) => <ArtikelCard key={artikel.id} artikel={artikel} />)
        )}
      </ScrollView>
    </View>
  );
}
