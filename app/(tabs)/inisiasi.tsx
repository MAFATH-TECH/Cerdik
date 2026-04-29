import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { ScreenError } from "@/components/ui/ScreenState";
import { CERDIK_COLORS } from "../../constants/colors";
import { useGoalStore } from "../../stores/useGoalStore";
import { Transaction, useTransactionStore } from "../../stores/useTransactionStore";
import { sendMessageToAI, type ChatMessage as AIChatMessage } from "../../services/aiService";

type ChatMessage = {
  id: string;
  sender: "user" | "ai";
  text: string;
};

type Recommendation = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  badge: string;
};

const QUICK_QUESTIONS = [
  "Bagaimana kondisi keuanganku?",
  "Tips hemat untuk pelajar",
  "Bantu buat rencana menabung",
  "Apa pengeluaran terborosku?",
];

const formatRupiah = (value: number) => `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
const getTxDateValue = (tx: Partial<Transaction>) => tx.date ?? tx.createdAt ?? new Date().toISOString();

export default function InisiasiScreen() {
  const { transactions, loadTransactions, loadSummary, isLoading: txLoading, error: txError } = useTransactionStore();
  const { goals, loadGoals, isLoading: goalLoading, error: goalError } = useGoalStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    loadTransactions();
    loadSummary();
    loadGoals();
  }, [loadGoals, loadSummary, loadTransactions]);

  useEffect(() => {
    if (!isTyping) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(typingOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(typingOpacity, { toValue: 0.35, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isTyping, typingOpacity]);

  const sourceTransactions = transactions;
  const activeGoal = goals.find((goal) => !goal.isCompleted) ?? null;

  const blockingError = txError || goalError;
  const retry = () => {
    loadTransactions();
    loadSummary();
    loadGoals();
  };

  const recommendations = useMemo<Recommendation[]>(() => {
    if (txLoading || goalLoading) return [];
    const expenseTransactions = sourceTransactions.filter((tx) => tx.type === "expense");
    const totalExpense = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const jajanExpense = expenseTransactions
      .filter((tx) => tx.category.toLowerCase().includes("jajan"))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const result: Recommendation[] = [];
    if (totalExpense > 0 && jajanExpense / totalExpense > 0.4) {
      result.push({
        id: "jajan-warning",
        icon: "fast-food-outline",
        title: "Kurangi jajan, coba bawa bekal",
        description:
          "Pengeluaran jajanmu sudah lebih dari 40% total pengeluaran. Bekal dari rumah bisa hemat banyak.",
        badge: "Hemat",
      });
    }

    const latestDate = sourceTransactions
      .map((tx) => new Date(getTxDateValue(tx)).getTime())
      .sort((a, b) => b - a)[0];
    if (!latestDate || Date.now() - latestDate > 3 * 24 * 60 * 60 * 1000) {
      result.push({
        id: "streak-warning",
        icon: "calendar-clear-outline",
        title: "Jangan lupa catat transaksimu!",
        description: "Sudah 3 hari belum ada catatan transaksi. Coba input lagi biar evaluasi tetap akurat.",
        badge: "Kebiasaan",
      });
    }

    if (activeGoal && !activeGoal.isCompleted) {
      const remaining = Math.max(0, activeGoal.targetAmount - activeGoal.currentAmount);
      result.push({
        id: "goal-reminder",
        icon: "flag-outline",
        title: `Lanjutkan goal ${activeGoal.name}`,
        description: `Kamu butuh menabung ${formatRupiah(remaining)} lagi untuk capai target ini.`,
        badge: "Goal",
      });
    }

    if (result.length === 0) {
      result.push({
        id: "default-tip",
        icon: "sparkles-outline",
        title: "Kondisi keuanganmu cukup stabil",
        description: "Pertahankan kebiasaan mencatat transaksi harian agar insight makin akurat.",
        badge: "Motivasi",
      });
    }

    return result.slice(0, 5);
  }, [sourceTransactions, activeGoal, txLoading, goalLoading]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleSend = async (messageText = inputText) => {
    const trimmed = messageText.trim();
    if (!trimmed || isTyping || blockingError) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText("");
    setIsTyping(true);
    scrollToBottom();

    try {
      const historyForAI: AIChatMessage[] = nextMessages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const aiText = await sendMessageToAI(trimmed, historyForAI);
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiText,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text:
          error instanceof Error
            ? `Maaf, CERDIK AI sedang bermasalah: ${error.message}`
            : "Maaf, CERDIK AI sedang sibuk. Coba lagi sebentar ya.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const showQuickReplies = messages.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 20, paddingBottom: 14 }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          Inisiasi AI Saran
        </Text>
        <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary }}>
          Rekomendasi otomatis dan asisten AI untuk bantu strategi finansialmu.
        </Text>

        <Text style={{ marginTop: 18, marginBottom: 10, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          Rekomendasi Harian
        </Text>
        {blockingError ? (
          <View style={{ height: 260 }}>
            <ScreenError description={blockingError} onRetry={retry} />
          </View>
        ) : txLoading || goalLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  height: 84,
                  borderRadius: 16,
                  backgroundColor: "#EEF2F7",
                }}
              />
            ))}
          </View>
        ) : sourceTransactions.length === 0 && goals.length === 0 ? (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 44, textAlign: "center", marginBottom: 10 }}>✨</Text>
            <Text style={{ textAlign: "center", fontWeight: "800", color: CERDIK_COLORS.textPrimary }}>
              Belum ada rekomendasi
            </Text>
            <Text style={{ marginTop: 6, textAlign: "center", color: CERDIK_COLORS.textSecondary }}>
              Catat transaksi dan buat goal dulu ya, biar rekomendasinya makin relevan.
            </Text>
          </View>
        ) : (
          recommendations.map((recommendation) => (
            <View
              key={recommendation.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flexDirection: "row", flex: 1, marginRight: 8 }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${CERDIK_COLORS.primary}22`,
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name={recommendation.icon} size={18} color={CERDIK_COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "700" }}>
                      {recommendation.title}
                    </Text>
                    <Text style={{ marginTop: 3, color: CERDIK_COLORS.textSecondary, lineHeight: 18 }}>
                      {recommendation.description}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: `${CERDIK_COLORS.secondary}33`,
                  }}
                >
                  <Text style={{ color: "#0F766E", fontSize: 11, fontWeight: "700" }}>{recommendation.badge}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <Text style={{ marginTop: 14, marginBottom: 10, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          CERDIK AI Assistant
        </Text>
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 12,
            minHeight: 260,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {messages.length === 0 ? (
            <Text style={{ color: CERDIK_COLORS.textSecondary, marginBottom: 8 }}>
              Tanyakan apa saja tentang kondisi keuanganmu. CERDIK AI siap bantu!
            </Text>
          ) : null}

          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <View
                key={msg.id}
                style={{
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  marginBottom: 8,
                  maxWidth: "84%",
                  flexDirection: "row",
                  alignItems: "flex-end",
                }}
              >
                {!isUser ? (
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: CERDIK_COLORS.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 6,
                    }}
                  >
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                  </View>
                ) : null}
                <View
                  style={{
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    backgroundColor: isUser ? CERDIK_COLORS.primary : "#F1F5F9",
                  }}
                >
                  <Text style={{ color: isUser ? "#FFFFFF" : CERDIK_COLORS.textPrimary, lineHeight: 18 }}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {isTyping ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: CERDIK_COLORS.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 6,
                }}
              >
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              </View>
              <Animated.View
                style={{
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  backgroundColor: "#F1F5F9",
                  opacity: typingOpacity,
                }}
              >
                <Text style={{ color: CERDIK_COLORS.textSecondary }}>• • •</Text>
              </Animated.View>
            </View>
          ) : null}

          {showQuickReplies ? (
            <View style={{ marginTop: 10 }}>
              {QUICK_QUESTIONS.map((question) => (
                <Pressable
                  key={question}
                  onPress={() => handleSend(question)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginBottom: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ color: CERDIK_COLORS.textSecondary }}>{question}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Tulis pertanyaanmu..."
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: "#FFFFFF",
              }}
            />
            <Pressable
              onPress={() => handleSend(inputText)}
              style={{
                marginLeft: 8,
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: CERDIK_COLORS.primary,
                opacity: blockingError ? 0.5 : 1,
              }}
              disabled={Boolean(blockingError)}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
