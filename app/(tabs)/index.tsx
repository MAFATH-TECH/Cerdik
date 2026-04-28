import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import SummaryCard from "@/components/ui/SummaryCard";
import { useEarlyWarning } from "@/hooks/useEarlyWarning";
import { CERDIK_COLORS } from "../../constants/colors";
import { useAuthStore } from "../../stores/useAuthStore";
import { Goal, useGoalStore } from "../../stores/useGoalStore";
import { Transaction, useTransactionStore } from "../../stores/useTransactionStore";

const rupiahFormatter = new Intl.NumberFormat("id-ID");

const formatRupiah = (amount: number) => `Rp ${rupiahFormatter.format(amount)}`;

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const mapCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  if (category === "Transportasi") return "car-outline";
  if (category === "Makan") return "restaurant-outline";
  if (category === "Tabungan") return "wallet-outline";
  if (category === "Beasiswa") return "school-outline";
  if (category === "Uang Saku") return "cash-outline";
  if (category === "Hadiah") return "gift-outline";
  return "ellipsis-horizontal-circle-outline";
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    type: "income",
    amount: 350000,
    category: "Uang Saku",
    note: "Uang saku mingguan",
    date: "2026-04-20T09:00:00.000Z",
    createdAt: "2026-04-20T09:00:00.000Z",
  },
  {
    id: "t2",
    type: "expense",
    amount: 25000,
    category: "Makan",
    note: "Makan siang kantin",
    date: "2026-04-21T05:00:00.000Z",
    createdAt: "2026-04-21T05:00:00.000Z",
  },
  {
    id: "t3",
    type: "expense",
    amount: 70000,
    category: "Tabungan",
    note: "Tabungan mingguan",
    date: "2026-04-21T07:00:00.000Z",
    createdAt: "2026-04-21T07:00:00.000Z",
  },
  {
    id: "t4",
    type: "expense",
    amount: 30000,
    category: "Transportasi",
    note: "Topup transport",
    date: "2026-04-22T02:30:00.000Z",
    createdAt: "2026-04-22T02:30:00.000Z",
  },
  {
    id: "t5",
    type: "income",
    amount: 100000,
    category: "Hadiah",
    note: "Reward lomba",
    date: "2026-04-22T04:20:00.000Z",
    createdAt: "2026-04-22T04:20:00.000Z",
  },
];

const MOCK_GOAL: Goal = {
  id: "g1",
  name: "Laptop Belajar",
  emoji: "💻",
  targetAmount: 3500000,
  currentAmount: 1400000,
  deadline: "2026-08-20T00:00:00.000Z",
  note: "Buat belajar coding",
  isCompleted: false,
  createdAt: "2026-04-01T00:00:00.000Z",
};

export default function HomeScreen() {
  const [showBalance, setShowBalance] = useState(true);
  const [dismissedWarningIds, setDismissedWarningIds] = useState<string[]>([]);
  const { user } = useAuthStore();
  const { transactions, loadTransactions, isLoading: txLoading } = useTransactionStore();
  const { goals, loadGoals } = useGoalStore();

  useEffect(() => {
    loadTransactions();
    loadGoals();
  }, [loadTransactions, loadGoals]);

  const finalTransactions = transactions.length > 0 ? transactions : MOCK_TRANSACTIONS;
  const activeGoal = goals.find((goal) => !goal.isCompleted) ?? MOCK_GOAL;
  const warnings = useEarlyWarning({ transactions: finalTransactions, goals });
  const visibleWarnings = warnings.filter((w) => !dismissedWarningIds.includes(w.id));
  const highWarnings = visibleWarnings.filter((w) => w.severity === "high");
  const mediumWarnings = visibleWarnings.filter((w) => w.severity === "medium");
  const lowWarnings = visibleWarnings.filter((w) => w.severity === "low");

  useEffect(() => {
    if (highWarnings.length > 0 || mediumWarnings.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highWarnings.length, mediumWarnings.length]);

  const thisMonthTransactions = useMemo(() => {
    const now = new Date();
    return finalTransactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });
  }, [finalTransactions]);

  const totalIncome = thisMonthTransactions
    .filter((tx) => tx.type === "income")
    .reduce((total, tx) => total + tx.amount, 0);
  const totalExpense = thisMonthTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((total, tx) => total + tx.amount, 0);
  const totalSavings = thisMonthTransactions
    .filter((tx) => tx.category === "Tabungan")
    .reduce((total, tx) => total + tx.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const latestTransactions = [...finalTransactions]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);
  const goalProgress = Math.min(100, Math.round((activeGoal.currentAmount / activeGoal.targetAmount) * 100));
  const studentName = user?.name ?? "Siswa";
  const studentInitial = studentName.charAt(0).toUpperCase();
  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      {[...highWarnings, ...mediumWarnings].slice(0, 2).map((w) => {
        const bg = w.severity === "high" ? "#FEE2E2" : "#FFF4D6";
        const border = w.severity === "high" ? "#FF6B6B" : "#FFB347";
        const text = w.severity === "high" ? "#991B1B" : "#9A5A00";
        return (
          <View
            key={w.id}
            style={{
              marginBottom: 12,
              borderRadius: 16,
              padding: 14,
              backgroundColor: bg,
              borderColor: border,
              borderWidth: 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
              <Text style={{ flex: 1, marginRight: 12, color: text, fontWeight: "700" }}>
                {w.message}
              </Text>
              <Pressable onPress={() => setDismissedWarningIds((prev) => [...prev, w.id])}>
                <Ionicons name="close" size={18} color={text} />
              </Pressable>
            </View>
          </View>
        );
      })}

      <View style={{ marginBottom: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View>
          <Text style={{ fontSize: 26, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
            Halo, {studentName}!
          </Text>
          <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary }}>{todayLabel}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/profile")}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${CERDIK_COLORS.primary}22`,
          }}
        >
          <Text style={{ color: CERDIK_COLORS.primary, fontWeight: "700", fontSize: 18 }}>{studentInitial}</Text>
        </Pressable>
      </View>

      <LinearGradient
        colors={[CERDIK_COLORS.primary, CERDIK_COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 18, marginBottom: 16 }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}>Saldo Bersih Bulan Ini</Text>
          <Pressable onPress={() => setShowBalance((prev) => !prev)}>
            <Ionicons name={showBalance ? "eye-outline" : "eye-off-outline"} size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={{ marginTop: 10, color: "#FFFFFF", fontSize: 28, fontWeight: "700" }}>
          {showBalance ? formatRupiah(netBalance) : "Rp •••••••"}
        </Text>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginBottom: 14 }}>
        <View style={{ width: 175 }}>
          <SummaryCard title="Pemasukan" amountValue={totalIncome} icon="arrow-up-circle" color="#16A34A" trend="+5%" />
        </View>
        <View style={{ width: 175 }}>
          <SummaryCard title="Pengeluaran" amountValue={totalExpense} icon="arrow-down-circle" color="#EF4444" trend="-3%" />
        </View>
        <View style={{ width: 175 }}>
          <SummaryCard title="Tabungan" amountValue={totalSavings} icon="wallet" color="#2563EB" trend="+8%" />
        </View>
      </ScrollView>

      {lowWarnings.length > 0 ? (
        <View style={{ marginBottom: 14 }}>
          <Text style={{ marginBottom: 8, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
            Perhatian
          </Text>
          {lowWarnings.slice(0, 2).map((w) => (
            <View
              key={w.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 12,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                <Text style={{ flex: 1, color: CERDIK_COLORS.textSecondary }}>
                  {w.message}
                </Text>
                <Pressable onPress={() => setDismissedWarningIds((prev) => [...prev, w.id])}>
                  <Ionicons name="close" size={16} color={CERDIK_COLORS.textSecondary} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Transaksi Terakhir</Text>
        <Pressable>
          <Text style={{ color: CERDIK_COLORS.primary, fontWeight: "700" }}>Lihat Semua</Text>
        </Pressable>
      </View>

      <View
        style={{
          backgroundColor: CERDIK_COLORS.card,
          borderRadius: 16,
          padding: 12,
          marginBottom: 14,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {txLoading ? (
          <View style={{ paddingVertical: 8 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: "#EEF2F7",
                  marginBottom: i === 2 ? 0 : 10,
                }}
              />
            ))}
          </View>
        ) : latestTransactions.length === 0 ? (
          <View style={{ paddingVertical: 18, alignItems: "center" }}>
            <Text style={{ fontSize: 44 }}>🧺</Text>
            <Text style={{ marginTop: 10, fontWeight: "800", color: CERDIK_COLORS.textPrimary }}>
              Belum ada transaksi
            </Text>
            <Text style={{ marginTop: 6, color: CERDIK_COLORS.textSecondary, textAlign: "center" }}>
              Yuk mulai catat transaksi pertama kamu hari ini.
            </Text>
          </View>
        ) : (
          latestTransactions.map((tx) => {
          const isExpense = tx.type === "expense";
          return (
            <View
              key={tx.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 10,
                borderBottomWidth: tx.id === latestTransactions[latestTransactions.length - 1].id ? 0 : 1,
                borderBottomColor: "#EEF2F7",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isExpense ? "#FEE2E2" : "#DCFCE7",
                  }}
                >
                  <Ionicons
                    name={mapCategoryIcon(tx.category)}
                    size={16}
                    color={isExpense ? "#B91C1C" : "#166534"}
                  />
                </View>
                <View>
                  <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "600" }}>
                    {tx.note || tx.category}
                  </Text>
                  <Text style={{ color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>{formatDate(tx.createdAt)}</Text>
                </View>
              </View>
              <Text style={{ color: isExpense ? "#DC2626" : "#16A34A", fontWeight: "700" }}>
                {isExpense ? "-" : "+"}
                {formatRupiah(tx.amount).replace("Rp ", "Rp ")}
              </Text>
            </View>
          );
        })
        )}
      </View>

      <Text style={{ fontSize: 18, fontWeight: "700", color: CERDIK_COLORS.textPrimary, marginBottom: 10 }}>
        Progress Goal Aktif
      </Text>
      <View
        style={{
          backgroundColor: CERDIK_COLORS.card,
          borderRadius: 16,
          padding: 14,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "700" }}>
            {activeGoal.emoji} {activeGoal.name}
          </Text>
          <Text style={{ color: CERDIK_COLORS.primary, fontWeight: "700" }}>{goalProgress}%</Text>
        </View>
        <Text style={{ marginTop: 6, color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
          {formatRupiah(activeGoal.currentAmount)} dari {formatRupiah(activeGoal.targetAmount)}
        </Text>
        <View style={{ marginTop: 10, height: 10, borderRadius: 999, backgroundColor: "#E2E8F0" }}>
          <View
            style={{
              width: `${goalProgress}%`,
              height: 10,
              borderRadius: 999,
              backgroundColor: CERDIK_COLORS.primary,
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
