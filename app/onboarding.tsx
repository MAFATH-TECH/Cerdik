import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CerdikLogo from "@/components/ui/CerdikLogo";
import { CERDIK_COLORS } from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Slide = {
  key: string;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    key: "s1",
    title: "Catat setiap transaksi",
    description: "Biar kamu tahu uangmu lari ke mana. Mulai dari yang kecil: jajan, pulsa, transport.",
  },
  {
    key: "s2",
    title: "Pantau keuanganmu",
    description: "Lihat ringkasan & grafik supaya kamu makin paham pola pemasukan dan pengeluaran.",
  },
  {
    key: "s3",
    title: "Raih target impianmu",
    description: "Buat goal, isi tabungan pelan-pelan, dan lihat progress-nya naik setiap hari.",
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const isLast = index === SLIDES.length - 1;

  const dots = useMemo(
    () =>
      SLIDES.map((s, i) => (
        <View
          key={s.key}
          style={{
            width: i === index ? 18 : 8,
            height: 8,
            borderRadius: 99,
            marginHorizontal: 4,
            backgroundColor: i === index ? "#FFFFFF" : "rgba(255,255,255,0.45)",
          }}
        />
      )),
    [index],
  );

  const goNext = () => {
    const next = Math.min(SLIDES.length - 1, index + 1);
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, y: 0, animated: true });
    setIndex(next);
  };

  const finish = async () => {
    await AsyncStorage.setItem("CERDIK_ONBOARDED_V1", "1");
    router.dismissAll();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: CERDIK_COLORS.primary }}>
      <View style={{ paddingTop: Math.max(16, insets.top + 6), paddingHorizontal: 18, alignItems: "flex-end" }}>
        {!isLast ? (
          <Pressable onPress={finish} style={{ paddingVertical: 10, paddingHorizontal: 10 }}>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: "800" }}>Lewati</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        ref={(r) => {
          scrollRef.current = r;
        }}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setIndex(Math.max(0, Math.min(SLIDES.length - 1, newIndex)));
        }}
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.key}
            style={{
              width: SCREEN_WIDTH,
              paddingHorizontal: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 220,
                height: 220,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.16)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 26,
              }}
            >
              <CerdikLogo size={160} />
            </View>

            <Text style={{ fontSize: 28, fontWeight: "900", color: "#FFFFFF", textAlign: "center" }}>
              {slide.title}
            </Text>
            <Text
              style={{
                marginTop: 12,
                color: "rgba(255,255,255,0.9)",
                fontSize: 15,
                lineHeight: 22,
                textAlign: "center",
                maxWidth: 320,
              }}
            >
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: Math.max(16, insets.bottom + 12),
          zIndex: 30,
          elevation: 30,
        }}
        pointerEvents="box-none"
      >
        <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 14 }}>{dots}</View>

        <Pressable
          onPress={isLast ? finish : goNext}
          hitSlop={12}
          style={{
            height: 52,
            borderRadius: 16,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: CERDIK_COLORS.primary, fontWeight: "900", fontSize: 16 }}>
            {isLast ? "Mulai CERDIK" : "Lanjut"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

