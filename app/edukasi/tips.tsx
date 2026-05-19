import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CategoryFilterChips from "@/components/edukasi/CategoryFilterChips";
import { getTipPreview, TIPS_HARIAN, type TipHarian } from "@/constants/edukasiData";
import type { FilterChipItem } from "@/constants/edukasiPengetahuan";
import { EDUKASI_COLORS } from "@/constants/edukasiTheme";

const TIP_CATEGORY_ITEMS: FilterChipItem[] = [
  { key: "Semua", label: "Semua" },
  { key: "Mindset", label: "Mindset" },
  { key: "Menabung", label: "Menabung" },
  { key: "Hemat", label: "Hemat" },
  { key: "Pencatatan", label: "Pencatatan" },
  { key: "Cerdas", label: "Cerdas" },
  { key: "Evaluasi", label: "Evaluasi" },
  { key: "Sosial", label: "Sosial" },
];

type TipCategory = (typeof TIP_CATEGORY_ITEMS)[number]["key"];

const GRID_GAP = 14;
/** Padding horizontal layar — lebih lega agar tidak terasa sempit */
const SCREEN_PADDING = 22;

const dayOfYear = Math.floor(
  (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
);
const tipHariIni = TIPS_HARIAN[dayOfYear % TIPS_HARIAN.length];

function chunkTips<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/** Aksen netral untuk chevron “buka detail” */
const TIP_CHEVRON_COLOR = "#8A9590";

/** Kotak emoji konsisten (kartu / ikon tidak “melayang”) */
function TipEmojiTile({ emoji, size = "md" }: { emoji: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? 38 : 48;
  const font = size === "sm" ? 24 : 28;
  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2EBE5",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: font, lineHeight: font + 2, textAlign: "center" }}>{emoji}</Text>
    </View>
  );
}

function TipGridCard({ tip, onPress }: { tip: TipHarian; onPress: (tip: TipHarian) => void }) {
  return (
    <Pressable
      onPress={() => onPress(tip)}
      accessibilityRole="button"
      accessibilityLabel={`Tips ${tip.kategori}. Ketuk untuk baca lengkap.`}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#E4EBE6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        opacity: pressed ? 0.94 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TipEmojiTile emoji={tip.emoji} size="sm" />

        <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#E8F5E9",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              marginBottom: 8,
              maxWidth: "100%",
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: EDUKASI_COLORS.secondary }} numberOfLines={1}>
              {tip.kategori}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 13,
                color: EDUKASI_COLORS.textDark,
                lineHeight: 18,
                fontWeight: "500",
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {getTipPreview(tip)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={TIP_CHEVRON_COLOR} style={{ marginLeft: 4 }} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function TipsScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState<TipCategory>("Semua");
  const [tipModal, setTipModal] = useState<TipHarian | null>(null);

  const filteredTips = useMemo(() => {
    if (activeCategory === "Semua") return TIPS_HARIAN;
    return TIPS_HARIAN.filter((tip) => tip.kategori === activeCategory);
  }, [activeCategory]);

  const tipRows = useMemo(() => chunkTips(filteredTips, 2), [filteredTips]);

  const modalMaxHeight = Math.min(windowHeight * 0.82, 560);
  const scrollMaxHeight = Math.min(modalMaxHeight - 200, 380);
  const modalCardWidth = Math.min(windowWidth - SCREEN_PADDING * 2, 440);

  const openTipDetail = (tip: TipHarian | null | undefined) => {
    if (!tip || !String(tip.tips ?? "").trim()) return;
    setTipModal(tip);
  };

  return (
    <View style={{ flex: 1, backgroundColor: EDUKASI_COLORS.bodyBg }}>
      {/* Header */}
      <View style={{ backgroundColor: EDUKASI_COLORS.primary, paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: SCREEN_PADDING,
            paddingVertical: 14,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 40 }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 18,
              fontWeight: "700",
              color: "#FFFFFF",
            }}
            numberOfLines={1}
          >
            Tips Keuangan
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 32,
          paddingTop: 6,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tip hari ini — satu baris pratinjau + ellipsis; isi penuh di modal */}
        <Pressable
          onPress={() => openTipDetail(tipHariIni)}
          accessibilityRole="button"
          accessibilityLabel="Buka tips hari ini lengkap"
          style={({ pressed }) => ({
            marginHorizontal: SCREEN_PADDING,
            marginTop: 18,
            marginBottom: 8,
            backgroundColor: "#FFFFFF",
            borderWidth: 2,
            borderColor: EDUKASI_COLORS.accent,
            borderRadius: 18,
            paddingTop: 14,
            paddingHorizontal: 16,
            paddingBottom: 16,
            opacity: pressed ? 0.96 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          })}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                backgroundColor: "#FFF8E1",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: EDUKASI_COLORS.tipsTitle }}>✨ Tip Hari Ini</Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: EDUKASI_COLORS.cardBg,
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: "#DCE8E0",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TipEmojiTile emoji={tipHariIni.emoji} size="md" />

              <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 15,
                      fontWeight: "600",
                      color: EDUKASI_COLORS.primary,
                      lineHeight: 21,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getTipPreview(tipHariIni)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={TIP_CHEVRON_COLOR} style={{ marginLeft: 8 }} />
                </View>

                <View
                  style={{
                    alignSelf: "flex-start",
                    marginTop: 10,
                    backgroundColor: "#E8F5E9",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: EDUKASI_COLORS.secondary }}>
                    {tipHariIni.kategori}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Judul section + filter */}
        <View style={{ marginHorizontal: SCREEN_PADDING, marginTop: 26, marginBottom: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: EDUKASI_COLORS.primary }}>
            📋 Semua Tips ({TIPS_HARIAN.length})
          </Text>
        </View>

        <View style={{ marginBottom: 10 }}>
          <CategoryFilterChips
            items={TIP_CATEGORY_ITEMS}
            activeKey={activeCategory}
            onSelect={setActiveCategory}
            contentPaddingHorizontal={SCREEN_PADDING}
          />
        </View>

        {/* Grid 2 kolom — baris per pasang agar rapi */}
        <View style={{ paddingHorizontal: SCREEN_PADDING }}>
          {filteredTips.length === 0 ? (
            <View
              style={{
                paddingVertical: 40,
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E8EDE9",
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🔍</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: EDUKASI_COLORS.primary }}>Tidak ada tips</Text>
              <Text style={{ marginTop: 6, fontSize: 13, color: EDUKASI_COLORS.textMuted, textAlign: "center", paddingHorizontal: 24 }}>
                Coba pilih kategori lain.
              </Text>
            </View>
          ) : (
            tipRows.map((row, rowIndex) => (
              <View
                key={`row-${rowIndex}`}
                style={{
                  flexDirection: "row",
                  alignItems: "stretch",
                  marginBottom: rowIndex < tipRows.length - 1 ? GRID_GAP : 0,
                }}
              >
                {row.map((tip, colIndex) => (
                  <View
                    key={tip.id}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      marginRight: colIndex === 0 && row.length > 1 ? GRID_GAP : 0,
                    }}
                  >
                    <TipGridCard tip={tip} onPress={openTipDetail} />
                  </View>
                ))}
                {row.length === 1 ? <View style={{ flex: 1, minWidth: 0 }} /> : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={tipModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTipModal(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 12,
          }}
          onPress={() => setTipModal(null)}
        >
          <Pressable
            onPress={() => undefined}
            style={{
              width: modalCardWidth,
              maxHeight: modalMaxHeight,
            }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 18,
                paddingVertical: 22,
                paddingHorizontal: 22,
                borderWidth: 2,
                borderColor: EDUKASI_COLORS.accent,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {tipModal ? (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <TipEmojiTile emoji={tipModal.emoji} size="md" />
                    <Pressable
                      onPress={() => setTipModal(null)}
                      hitSlop={12}
                      accessibilityLabel="Tutup"
                      style={{
                        width: 44,
                        height: 44,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="close-circle" size={30} color={EDUKASI_COLORS.textMuted} />
                    </Pressable>
                  </View>

                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: "#E8F5E9",
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 999,
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: EDUKASI_COLORS.secondary }}>
                      {tipModal.kategori || "Tips"}
                    </Text>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator
                    style={{ maxHeight: scrollMaxHeight }}
                    contentContainerStyle={{ paddingBottom: 4 }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: EDUKASI_COLORS.primary,
                        lineHeight: 24,
                      }}
                    >
                      {tipModal.tips || "—"}
                    </Text>
                  </ScrollView>

                  <Pressable
                    onPress={() => setTipModal(null)}
                    style={{
                      marginTop: 16,
                      backgroundColor: EDUKASI_COLORS.primary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Tutup</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
