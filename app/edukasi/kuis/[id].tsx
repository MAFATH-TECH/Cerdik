import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SOAL_KUIS, TOPIK_KUIS } from "@/constants/edukasiData";
import { EDUKASI_COLORS } from "@/constants/edukasiTheme";
import { getKuisSkor, resetStatusTopikKuis, simpanHasilKuis } from "@/services/edukasiKuisStorage";

const OPTION_LABELS = ["A", "B", "C", "D"];
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [EDUKASI_COLORS.primary, EDUKASI_COLORS.secondary, EDUKASI_COLORS.accent];

type HasilInfo = { emoji: string; judul: string };

function getHasilInfo(correct: number, total: number): HasilInfo {
  if (correct === total && total > 0) return { emoji: "🏆", judul: "Sempurna!" };
  if (correct >= 4) return { emoji: "⭐", judul: "Luar Biasa!" };
  if (correct >= 3) return { emoji: "👍", judul: "Bagus!" };
  return { emoji: "💪", judul: "Terus Belajar!" };
}

function ConfettiCelebration() {
  const pieces = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: (SCREEN_WIDTH / 18) * i + 8,
      anim: new Animated.Value(0),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: (i % 6) * 80,
      size: 8 + (i % 4) * 3,
    })),
  ).current;

  useEffect(() => {
    const animations = pieces.map((piece) =>
      Animated.timing(piece.anim, {
        toValue: 1,
        duration: 2200 + piece.delay,
        delay: piece.delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    Animated.stagger(40, animations).start();
  }, [pieces]);

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
      {pieces.map((piece, index) => {
        const translateY = piece.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, SCREEN_HEIGHT * 0.55],
        });
        const opacity = piece.anim.interpolate({
          inputRange: [0, 0.1, 0.85, 1],
          outputRange: [0, 1, 1, 0],
        });
        const rotate = piece.anim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", `${(index % 2 === 0 ? 1 : -1) * 360}deg`],
        });

        return (
          <Animated.View
            key={index}
            style={{
              position: "absolute",
              left: piece.x,
              width: piece.size,
              height: piece.size * 1.4,
              borderRadius: 2,
              backgroundColor: piece.color,
              opacity,
              transform: [{ translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}

function StarBurst() {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Animated.Text
      style={{
        fontSize: 28,
        marginBottom: 8,
        transform: [{ scale }],
        opacity: scale.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
      }}
    >
      ⭐⭐⭐
    </Animated.Text>
  );
}

export default function KuisDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topikId = id as string;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [totalSkor, setTotalSkor] = useState(0);
  const [poinSesi, setPoinSesi] = useState(0);

  const soalList = SOAL_KUIS[topikId] ?? [];
  const topik = TOPIK_KUIS.find((t) => t.id === topikId);
  const currentSoal = soalList[currentIndex];

  const progressAnim = useRef(new Animated.Value(0)).current;
  const explanationAnim = useRef(new Animated.Value(0)).current;

  const progressPct = soalList.length > 0 ? (currentIndex + 1) / soalList.length : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPct,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressPct, progressAnim]);

  useEffect(() => {
    if (!showExplanation) {
      explanationAnim.setValue(0);
      return;
    }
    Animated.timing(explanationAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [showExplanation, explanationAnim]);

  const resetQuizState = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setIsFinished(false);
    setShowExplanation(false);
    setPoinSesi(0);
    progressAnim.setValue(soalList.length > 0 ? 1 / soalList.length : 0);
    explanationAnim.setValue(0);
  }, [explanationAnim, progressAnim, soalList.length]);

  const handleKeluar = () => {
    Alert.alert("Keluar Kuis?", "Progress kuis ini tidak akan disimpan.", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: () => router.back() },
    ]);
  };

  const handlePilihJawaban = (index: number) => {
    if (isAnswered || !currentSoal) return;

    setSelectedAnswer(index);
    setIsAnswered(true);
    setShowExplanation(true);

    if (index === currentSoal.jawaban) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleLanjut = async () => {
    if (!isAnswered) return;

    if (currentIndex < soalList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
      return;
    }

    const poin = correctCount * 10;
    setPoinSesi(poin);

    try {
      const skorBaru = await simpanHasilKuis(topikId, poin);
      setTotalSkor(skorBaru);
    } catch {
      const skor = await getKuisSkor();
      setTotalSkor(skor);
    }

    setIsFinished(true);
  };

  const handleKerjakanUlang = async () => {
    await resetStatusTopikKuis(topikId).catch(() => undefined);
    resetQuizState();
  };

  if (!topik || soalList.length === 0 || !currentSoal) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: EDUKASI_COLORS.bodyBg,
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", color: EDUKASI_COLORS.primary }}>Kuis tidak ditemukan</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 20,
            backgroundColor: EDUKASI_COLORS.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const explanationTranslateY = explanationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  const hasil = getHasilInfo(correctCount, soalList.length);

  if (isFinished) {
    return (
      <View style={{ flex: 1, backgroundColor: EDUKASI_COLORS.bodyBg }}>
        <ConfettiCelebration />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, zIndex: 2 }}>
          <StarBurst />
          <Text style={{ fontSize: 60 }}>{hasil.emoji}</Text>
          <Text style={{ marginTop: 12, fontSize: 22, fontWeight: "800", color: EDUKASI_COLORS.primary }}>{hasil.judul}</Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: EDUKASI_COLORS.textMuted }}>
            {correctCount} dari {soalList.length} jawaban benar
          </Text>

          <View
            style={{
              marginTop: 20,
              backgroundColor: EDUKASI_COLORS.cardBg,
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 32,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "800", color: EDUKASI_COLORS.primary }}>
              +{poinSesi} Poin 🏅
            </Text>
          </View>

          <Text style={{ marginTop: 12, fontSize: 13, color: EDUKASI_COLORS.secondary, fontWeight: "600" }}>
            Total poin kamu: {totalSkor}
          </Text>

          <Pressable
            onPress={handleKerjakanUlang}
            style={{
              marginTop: 28,
              width: "100%",
              borderWidth: 1.5,
              borderColor: EDUKASI_COLORS.primary,
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: EDUKASI_COLORS.primary, fontWeight: "700", fontSize: 15 }}>Kerjakan Ulang 🔄</Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 12,
              width: "100%",
              backgroundColor: EDUKASI_COLORS.primary,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Kembali ke Kuis ✓</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
          <Pressable onPress={handleKeluar} hitSlop={12} style={{ width: 40 }}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
          <Text style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: "#FFFFFF" }} numberOfLines={1}>
            {topik.judul}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 13, color: EDUKASI_COLORS.textMuted, marginBottom: 8 }}>
          Soal {currentIndex + 1} dari {soalList.length}
        </Text>
        <View style={{ height: 6, backgroundColor: "#E0E0E0", borderRadius: 3, overflow: "hidden" }}>
          <Animated.View
            style={{
              height: 6,
              backgroundColor: EDUKASI_COLORS.accent,
              borderRadius: 3,
              width: progressWidth,
            }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: EDUKASI_COLORS.cardBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 32 }}>{topik.emoji}</Text>
          </View>
        </View>

        <Text
          style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 13,
            fontWeight: "600",
            color: EDUKASI_COLORS.secondary,
          }}
        >
          Soal {currentIndex + 1}
        </Text>

        <Text
          style={{
            marginTop: 10,
            paddingHorizontal: 20,
            textAlign: "center",
            fontSize: 17,
            fontWeight: "700",
            color: EDUKASI_COLORS.primary,
            lineHeight: 26,
          }}
        >
          {currentSoal.soal}
        </Text>

        <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
          {currentSoal.pilihan.map((pilihan, optionIndex) => {
            const isCorrect = optionIndex === currentSoal.jawaban;
            const isSelected = selectedAnswer === optionIndex;
            const label = OPTION_LABELS[optionIndex] ?? String(optionIndex + 1);

            let bg = "#FFFFFF";
            let borderColor = "#E0E0E0";
            let labelBg = EDUKASI_COLORS.cardBg;
            let labelColor = EDUKASI_COLORS.textDark;
            let opacity = 1;

            if (isAnswered) {
              if (isCorrect) {
                bg = "#E8F5E9";
                borderColor = EDUKASI_COLORS.secondary;
                labelBg = EDUKASI_COLORS.secondary;
                labelColor = "#FFFFFF";
              } else if (isSelected) {
                bg = "#FFEBEE";
                borderColor = "#F44336";
                labelBg = "#F44336";
                labelColor = "#FFFFFF";
              } else {
                opacity = 0.5;
              }
            }

            return (
              <Pressable
                key={optionIndex}
                onPress={() => handlePilihJawaban(optionIndex)}
                disabled={isAnswered}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 6,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor,
                  backgroundColor: bg,
                  opacity,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: labelBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: labelColor }}>{label}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: "#333333", lineHeight: 20 }}>{pilihan}</Text>
                {isAnswered && isCorrect ? (
                  <Ionicons name="checkmark-circle" size={22} color={EDUKASI_COLORS.secondary} />
                ) : null}
                {isAnswered && isSelected && !isCorrect ? (
                  <Ionicons name="close-circle" size={22} color="#F44336" />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {showExplanation ? (
          <Animated.View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              opacity: explanationAnim,
              transform: [{ translateY: explanationTranslateY }],
            }}
          >
            <View
              style={{
                backgroundColor: "#FFF8E1",
                borderWidth: 1.5,
                borderColor: EDUKASI_COLORS.accent,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: EDUKASI_COLORS.tipsTitle, marginBottom: 8 }}>
                💡 Penjelasan:
              </Text>
              <Text style={{ fontSize: 13, color: "#333333", lineHeight: 20 }}>{currentSoal.penjelasan}</Text>
            </View>
          </Animated.View>
        ) : null}

        {isAnswered ? (
          <Pressable
            onPress={handleLanjut}
            style={{
              marginHorizontal: 16,
              marginTop: 20,
              backgroundColor: EDUKASI_COLORS.primary,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
              {currentIndex < soalList.length - 1 ? "Lanjut →" : "Lihat Hasil 🎉"}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
