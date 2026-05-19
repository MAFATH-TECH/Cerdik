import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ARTIKEL_EKONOMI, type ArtikelBlock } from "@/constants/edukasiData";
import { getTagBadgeStyle } from "@/constants/edukasiPengetahuan";
import { EDUKASI_COLORS } from "@/constants/edukasiTheme";

function ArtikelContent({ blocks }: { blocks: ArtikelBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <Text
              key={`p-${index}`}
              style={{ fontSize: 14, color: EDUKASI_COLORS.textDark, lineHeight: 22, marginBottom: 10 }}
            >
              {block.text}
            </Text>
          );
        }

        if (block.type === "heading") {
          return (
            <Text
              key={`h-${index}`}
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: EDUKASI_COLORS.primary,
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              {block.text}
            </Text>
          );
        }

        if (block.type === "bullet") {
          return (
            <View key={`b-${index}`} style={{ marginBottom: 10 }}>
              {block.items.map((item, itemIndex) => (
                <View key={itemIndex} style={{ flexDirection: "row", marginBottom: 6, paddingRight: 8 }}>
                  <Text style={{ color: EDUKASI_COLORS.secondary, fontSize: 16, lineHeight: 22, marginRight: 8 }}>•</Text>
                  <Text style={{ flex: 1, fontSize: 14, color: EDUKASI_COLORS.textDark, lineHeight: 22 }}>{item}</Text>
                </View>
              ))}
            </View>
          );
        }

        return (
          <View
            key={`hl-${index}`}
            style={{
              backgroundColor: "#E8F5E9",
              borderLeftWidth: 4,
              borderLeftColor: EDUKASI_COLORS.accent,
              borderRadius: 8,
              padding: 14,
              marginVertical: 10,
            }}
          >
            <Text style={{ fontSize: 14, color: EDUKASI_COLORS.primary, fontStyle: "italic", lineHeight: 22 }}>
              {block.text}
            </Text>
          </View>
        );
      })}
    </>
  );
}

export default function PengetahuanDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { artikel, nextArtikel } = useMemo(() => {
    const index = ARTIKEL_EKONOMI.findIndex((item) => item.id === id);
    if (index < 0) return { artikel: null, nextArtikel: null };
    const nextIndex = (index + 1) % ARTIKEL_EKONOMI.length;
    return {
      artikel: ARTIKEL_EKONOMI[index],
      nextArtikel: ARTIKEL_EKONOMI[nextIndex],
    };
  }, [id]);

  if (!artikel) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: EDUKASI_COLORS.bodyBg, padding: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: EDUKASI_COLORS.primary }}>Artikel tidak ditemukan</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: EDUKASI_COLORS.secondary, fontWeight: "700" }}>← Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const badge = getTagBadgeStyle(artikel.tag);

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
          <Text
            style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {artikel.judul}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: EDUKASI_COLORS.cardBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 40 }}>{artikel.emoji}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 14, gap: 8 }}>
          <View
            style={{
              backgroundColor: badge.bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: badge.text }}>{artikel.tag}</Text>
          </View>
          <Text style={{ fontSize: 12, color: EDUKASI_COLORS.secondary, fontWeight: "600" }}>⏱ {artikel.durasi}</Text>
        </View>

        <Text
          style={{
            marginTop: 16,
            fontSize: 20,
            fontWeight: "800",
            color: EDUKASI_COLORS.primary,
            textAlign: "center",
            lineHeight: 28,
          }}
        >
          {artikel.judul}
        </Text>

        <View
          style={{
            height: 2,
            backgroundColor: EDUKASI_COLORS.secondary,
            opacity: 0.35,
            marginVertical: 20,
            borderRadius: 1,
          }}
        />

        <ArtikelContent blocks={artikel.isi} />

        {nextArtikel ? (
          <Pressable
            onPress={() => router.replace(`/edukasi/pengetahuan/${nextArtikel.id}`)}
            style={{
              marginTop: 24,
              backgroundColor: EDUKASI_COLORS.primary,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Artikel Selanjutnya →</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
