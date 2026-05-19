import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getTipPreview, TIPS_HARIAN } from "@/constants/edukasiData";
import { EDUKASI_COLORS } from "@/constants/edukasiTheme";

const dayOfYear = Math.floor(
  (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
);
const tipHariIni = TIPS_HARIAN[dayOfYear % TIPS_HARIAN.length];

type MenuCardProps = {
  backgroundColor: string;
  borderColor: string;
  circleBg: string;
  emoji: string;
  title: string;
  titleColor: string;
  subtitle: string;
  chevronColor: string;
  onPress: () => void;
};

function MenuCard({
  backgroundColor,
  borderColor,
  circleBg,
  emoji,
  title,
  titleColor,
  subtitle,
  chevronColor,
  onPress,
}: MenuCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginHorizontal: 16,
        marginVertical: 8,
        height: 110,
        borderRadius: 16,
        backgroundColor,
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: circleBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: titleColor }}>{title}</Text>
        <Text style={{ marginTop: 4, fontSize: 12, color: EDUKASI_COLORS.textMuted, lineHeight: 18 }} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={chevronColor} />
    </Pressable>
  );
}

export default function EdukasiScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: EDUKASI_COLORS.bodyBg }}>
      <View style={{ backgroundColor: EDUKASI_COLORS.primary, paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 40 }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>Edukasi</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 30, marginRight: 10 }}>🏅</Text>
            <Text style={{ flex: 1, fontSize: 13, fontStyle: "italic", color: "#444444", lineHeight: 20 }}>
              Unlock financial freedom: Master finance and take control of your future!
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <MenuCard
          backgroundColor="#E8F5E9"
          borderColor={EDUKASI_COLORS.primary}
          circleBg={EDUKASI_COLORS.primary}
          emoji="📚"
          title="Pengetahuan Ekonomi"
          titleColor={EDUKASI_COLORS.primary}
          subtitle="Pelajari konsep dasar ekonomi & keuangan wajib pelajar"
          chevronColor={EDUKASI_COLORS.primary}
          onPress={() => router.push("/edukasi/pengetahuan")}
        />

        <MenuCard
          backgroundColor="#FFFDE7"
          borderColor={EDUKASI_COLORS.accent}
          circleBg={EDUKASI_COLORS.accent}
          emoji="💡"
          title="Tips Keuangan"
          titleColor={EDUKASI_COLORS.tipsTitle}
          subtitle="Tips harian mengatur uang saku agar tidak boros"
          chevronColor={EDUKASI_COLORS.accent}
          onPress={() => router.push("/edukasi/tips")}
        />

        <MenuCard
          backgroundColor="#E8F5E9"
          borderColor={EDUKASI_COLORS.secondary}
          circleBg={EDUKASI_COLORS.secondary}
          emoji="🎯"
          title="Kuis Finansial"
          titleColor={EDUKASI_COLORS.primary}
          subtitle="Uji pengetahuanmu & kumpulkan poin reward!"
          chevronColor={EDUKASI_COLORS.secondary}
          onPress={() => router.push("/edukasi/kuis")}
        />

        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: EDUKASI_COLORS.primary, marginBottom: 8 }}>
            💡 Tip Hari Ini
          </Text>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1.5,
              borderColor: EDUKASI_COLORS.secondary,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>{tipHariIni.emoji}</Text>
              <Text
                style={{ flex: 1, fontSize: 13, color: EDUKASI_COLORS.textDark, lineHeight: 20 }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {getTipPreview(tipHariIni)}
              </Text>
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
              <Text style={{ fontSize: 11, color: EDUKASI_COLORS.primary, fontWeight: "600" }}>{tipHariIni.kategori}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/edukasi/tips")} style={{ marginTop: 8, alignSelf: "flex-end" }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: EDUKASI_COLORS.secondary }}>Lihat Semua Tips →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
