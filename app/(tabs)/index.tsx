import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import DraggableEdukasiFab from "@/components/DraggableEdukasiFab";
import TransactionSwipeRow from "@/components/TransactionSwipeRow";
import CerdikLogo from "@/components/ui/CerdikLogo";
import SummaryCard from "@/components/ui/SummaryCard";
import { useEarlyWarning } from "@/hooks/useEarlyWarning";
import { userSettingsService } from "@/services/userSettingsService";
import { CERDIK_COLORS } from "../../constants/colors";
import { useAuthStore } from "../../stores/useAuthStore";
import { useGoalStore } from "../../stores/useGoalStore";
import { Transaction, useTransactionStore } from "../../stores/useTransactionStore";
import { transactionService } from "@/services/transactionService";
import { goalService } from "@/services/goalService";

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
  if (category === "Menabung") return "save-outline";
  if (category === "Beasiswa") return "school-outline";
  if (category === "Uang Saku") return "cash-outline";
  if (category === "Hadiah") return "gift-outline";
  return "ellipsis-horizontal-circle-outline";
};

export default function HomeScreen() {
  const [showBalance, setShowBalance] = useState(true);
  const [dismissedWarningIds, setDismissedWarningIds] = useState<string[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyExpenseLimit, setWeeklyExpenseLimit] = useState(0);
  const { user } = useAuthStore();
  const { transactions, loadTransactions, loadSummary, isLoading: txLoading, summary, removeTransaction } =
    useTransactionStore();
  const { goals, loadGoals } = useGoalStore();

  const activeGoals = goals.filter((goal) => !goal.isCompleted);
  const warnings = useEarlyWarning();
  const visibleWarnings = warnings.filter((w) => !dismissedWarningIds.includes(w.id));
  const topWarning = visibleWarnings[0] ?? null;
  const hiddenWarningCount = Math.max(0, visibleWarnings.length - 1);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const warningStorageKey = useMemo(() => `cerdik:ews:dismissed:${todayKey}`, [todayKey]);

  const dismissWarning = useCallback(
    async (id: string) => {
      setDismissedWarningIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        AsyncStorage.setItem(warningStorageKey, JSON.stringify(next)).catch(() => undefined);
        return next;
      });
    },
    [warningStorageKey],
  );

  const loadDismissedWarnings = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(warningStorageKey);
      if (!raw) {
        setDismissedWarningIds([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setDismissedWarningIds(parsed.filter((item) => typeof item === "string"));
      } else {
        setDismissedWarningIds([]);
      }
    } catch {
      setDismissedWarningIds([]);
    }
  }, [warningStorageKey]);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const list = await transactionService.getRecentTransactions(5);
      setRecentTransactions(list);
    } catch {
      setRecentTransactions([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  const loadWeeklyLimit = useCallback(async () => {
    try {
      const settings = await userSettingsService.getSettings();
      setWeeklyExpenseLimit(settings.weeklyExpenseLimit);
    } catch {
      setWeeklyExpenseLimit(0);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadTransactions();
      await loadSummary();
      await loadRecent();
      await loadGoals();
      await loadWeeklyLimit();
    } finally {
      setRefreshing(false);
    }
  }, [loadGoals, loadRecent, loadSummary, loadTransactions, loadWeeklyLimit]);

  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        await loadDismissedWarnings();
        await loadTransactions();
        await loadSummary();
        await loadGoals();
        await loadRecent();
        await loadWeeklyLimit();
      };
      run().catch(() => undefined);
    }, [loadDismissedWarnings, loadGoals, loadRecent, loadSummary, loadTransactions, loadWeeklyLimit]),
  );

  useEffect(() => {
    if (topWarning?.severity === "high" || topWarning?.severity === "medium") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topWarning?.id, topWarning?.severity]);

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const totalSavings = summary?.totalSaving ?? 0;
  const netBalance = summary?.net ?? 0;

  /** Persentase dari pemasukan bulan ini saja (sumber: summary = transaksi periode yang sama dengan nominal kartu). */
  const monthShareTrend = useMemo(() => {
    const inc = summary?.totalIncome ?? 0;
    const exp = summary?.totalExpense ?? 0;
    const sav = summary?.totalSaving ?? 0;
    if (inc <= 0) {
      return {
        incomeLabel: "—",
        expenseLabel: "—",
        savingLabel: "—",
        neutral: true,
      };
    }
    return {
      incomeLabel: "100%",
      expenseLabel: `${Math.round((exp / inc) * 100)}%`,
      savingLabel: `${Math.round((sav / inc) * 100)}%`,
      neutral: false,
    };
  }, [summary]);
  const latestTransactions = recentTransactions;
  const studentName = user?.name ?? "Siswa";
  const studentInitial = studentName.charAt(0).toUpperCase();
  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const weeklyExpense = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const nextMonday = new Date(monday);
    nextMonday.setDate(nextMonday.getDate() + 7);

    return transactions
      .filter((tx) => {
        if (tx.type !== "expense") return false;
        const d = new Date(tx.date);
        return d >= monday && d < nextMonday;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const weeklyUsagePct = weeklyExpenseLimit > 0 ? Math.min(100, Math.round((weeklyExpense / weeklyExpenseLimit) * 100)) : 0;
  const weeklyRemaining = Math.max(0, weeklyExpenseLimit - weeklyExpense);
  const weeklyExceeded = Math.max(0, weeklyExpense - weeklyExpenseLimit);

  return (
    <View style={{ flex: 1, position: "relative" }}>
    <ScrollView
      style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
    >
      <View style={{ marginBottom: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 }}>
          <CerdikLogo size={44} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 26, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
            Halo, {studentName}!
          </Text>
          <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary }}>{todayLabel}</Text>
          </View>
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

      {topWarning ? (
        <View
          style={{
            marginBottom: 12,
            borderRadius: 16,
            padding: 14,
            backgroundColor:
              topWarning.severity === "high"
                ? CERDIK_COLORS.surfaceDanger
                : topWarning.severity === "medium"
                  ? CERDIK_COLORS.surfaceWarning
                  : CERDIK_COLORS.surfaceSuccess,
            borderColor:
              topWarning.severity === "high"
                ? CERDIK_COLORS.danger
                : topWarning.severity === "medium"
                  ? CERDIK_COLORS.warning
                  : CERDIK_COLORS.success,
            borderWidth: 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "800" }}>{topWarning.title}</Text>
              <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary }}>{topWarning.message}</Text>
              {topWarning.actionLabel && topWarning.actionRoute ? (
                <Pressable onPress={() => router.push(topWarning.actionRoute as any)} style={{ marginTop: 8 }}>
                  <Text style={{ color: CERDIK_COLORS.primary, fontWeight: "700" }}>{topWarning.actionLabel}</Text>
                </Pressable>
              ) : null}
              {hiddenWarningCount > 0 ? (
                <Pressable onPress={() => router.push("/(tabs)/evaluasi" as any)} style={{ marginTop: 8 }}>
                  <Text style={{ color: CERDIK_COLORS.primary, fontWeight: "700" }}>
                    + {hiddenWarningCount} peringatan lainnya
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable onPress={() => dismissWarning(topWarning.id)}>
              <Ionicons name="close" size={18} color={CERDIK_COLORS.textSecondary} />
            </Pressable>
          </View>
        </View>
      ) : null}

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
          <SummaryCard
            title="Pemasukan"
            amountValue={totalIncome}
            icon="arrow-up-circle"
            color={CERDIK_COLORS.income}
            trend={monthShareTrend.incomeLabel}
            trendUp
            trendNeutral={monthShareTrend.neutral}
          />
        </View>
        <View style={{ width: 175 }}>
          <SummaryCard
            title="Pengeluaran"
            amountValue={totalExpense}
            icon="arrow-down-circle"
            color={CERDIK_COLORS.expense}
            trend={monthShareTrend.expenseLabel}
            trendUp={false}
            trendNeutral={monthShareTrend.neutral}
          />
        </View>
        <View style={{ width: 175 }}>
          <SummaryCard
            title="Tabungan"
            amountValue={totalSavings}
            icon="wallet"
            color={CERDIK_COLORS.accent}
            trend={monthShareTrend.savingLabel}
            trendUp
            trendNeutral={monthShareTrend.neutral}
          />
        </View>
      </ScrollView>

      <Text
        style={{
          fontSize: 11,
          color: CERDIK_COLORS.textSecondary,
          marginTop: -6,
          marginBottom: 12,
          paddingHorizontal: 2,
        }}
      >
        Persentase di bawah nominal: porsi dari pemasukan bulan ini (data transaksi yang sama dengan angka di atas).
      </Text>

      <View
        style={{
          backgroundColor: CERDIK_COLORS.card,
          borderRadius: 16,
          padding: 14,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: "#E2E8F0",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "800" }}>Batas Mingguan</Text>
          <Pressable onPress={() => router.push("/profile")}>
            <Text style={{ color: CERDIK_COLORS.primary, fontWeight: "700", fontSize: 12 }}>Atur</Text>
          </Pressable>
        </View>

        {weeklyExpenseLimit > 0 ? (
          <>
            <Text style={{ marginTop: 8, color: CERDIK_COLORS.textSecondary }}>
              Minggu ini: {formatRupiah(weeklyExpense)} / {formatRupiah(weeklyExpenseLimit)}
            </Text>
            <Text style={{ marginTop: 4, color: weeklyExceeded > 0 ? CERDIK_COLORS.danger : CERDIK_COLORS.textSecondary, fontSize: 12, fontWeight: "600" }}>
              {weeklyExceeded > 0 ? `Melebihi limit: ${formatRupiah(weeklyExceeded)}` : `Sisa limit: ${formatRupiah(weeklyRemaining)}`}
            </Text>
            <View style={{ marginTop: 10, height: 10, borderRadius: 999, backgroundColor: "#E2E8F0" }}>
              <View
                style={{
                  width: `${weeklyUsagePct}%`,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor:
                    weeklyUsagePct >= 100 ? CERDIK_COLORS.danger : weeklyUsagePct >= 80 ? CERDIK_COLORS.warning : CERDIK_COLORS.success,
                }}
              />
            </View>
            <Text style={{ marginTop: 6, color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
              Terpakai {weeklyUsagePct}% dari batas pengeluaran mingguan.
            </Text>
          </>
        ) : (
          <Text style={{ marginTop: 8, color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
            Batas mingguan belum diatur. Tap "Atur" untuk mengaktifkan pengingat.
          </Text>
        )}
      </View>

      <View style={{ marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Transaksi Terakhir</Text>
        <Pressable onPress={() => router.push("/transactions" as any)}>
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
        {txLoading || recentLoading || refreshing ? (
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
          latestTransactions.map((tx, idx) => {
          const isExpense = tx.type === "expense";
          const isLast = idx === latestTransactions.length - 1;
          return (
            <TransactionSwipeRow
              key={tx.id}
              onEdit={() =>
                router.push({ pathname: "/edit-transaction", params: { transactionId: tx.id } } as any)
              }
              onDelete={() =>
                Alert.alert("Hapus Transaksi", "Yakin mau hapus transaksi ini?", [
                  { text: "Batal", style: "cancel" },
                  {
                    text: "Hapus",
                    style: "destructive",
                    onPress: () => {
                      removeTransaction(tx.id)
                        .then(() => {
                          loadRecent().catch(() => undefined);
                        })
                        .catch(() => undefined);
                    },
                  },
                ])
              }
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderBottomWidth: isLast ? 0 : 1,
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
                      backgroundColor: isExpense ? CERDIK_COLORS.surfaceDanger : CERDIK_COLORS.surfaceSuccess,
                    }}
                  >
                    <Ionicons
                      name={mapCategoryIcon(tx.category)}
                      size={16}
                      color={isExpense ? CERDIK_COLORS.expense : CERDIK_COLORS.income}
                    />
                  </View>
                  <View>
                    <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "600" }}>
                      {tx.note || tx.category}
                    </Text>
                    <Text style={{ color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>{formatDate(tx.createdAt)}</Text>
                  </View>
                </View>
                <Text style={{ color: isExpense ? CERDIK_COLORS.expense : CERDIK_COLORS.income, fontWeight: "700" }}>
                  {isExpense ? "-" : "+"}
                  {formatRupiah(tx.amount).replace("Rp ", "Rp ")}
                </Text>
              </View>
            </TransactionSwipeRow>
          );
        })
        )}
      </View>

      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Target Aktif</Text>

          {activeGoals.length > 0 ? (
            <Pressable onPress={() => router.push("/(tabs)/rencanakan" as any)}>
              <Text style={{ color: CERDIK_COLORS.primary, fontWeight: "700" }}>Lihat Semua Target</Text>
            </Pressable>
          ) : null}
        </View>

        {activeGoals.length === 0 ? (
          <View
            style={{
              backgroundColor: CERDIK_COLORS.card,
              borderRadius: 16,
              padding: 16,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 44, textAlign: "center", marginBottom: 10 }}>🎯</Text>
            <Text style={{ textAlign: "center", fontWeight: "800", color: CERDIK_COLORS.textPrimary }}>Belum punya target? Buat sekarang!</Text>
            <Text style={{ marginTop: 6, textAlign: "center", color: CERDIK_COLORS.textSecondary }}>
              Mulai dari goal kecil dulu, nanti terus berkembang.
            </Text>

            <View style={{ marginTop: 12 }}>
              <Pressable
                onPress={() => router.push("/(tabs)/rencanakan" as any)}
                style={{
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: CERDIK_COLORS.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>Buat Target</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          activeGoals.slice(0, 2).map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
            const progressInfo = goalService.getGoalProgress(goal);
            const dailyNeeded = Math.ceil(progressInfo.dailyNeeded);

            return (
              <View
                key={goal.id}
                style={{
                  backgroundColor: CERDIK_COLORS.card,
                  borderRadius: 16,
                  padding: 14,
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "700" }}>
                    {goal.emoji} {goal.name}
                  </Text>
                  <Text style={{ color: CERDIK_COLORS.primary, fontWeight: "700" }}>{pct}%</Text>
                </View>

                <Text style={{ marginTop: 6, color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
                  {formatRupiah(goal.currentAmount)} / {formatRupiah(goal.targetAmount)}
                </Text>

                <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
                  Butuh {formatRupiah(dailyNeeded)}/hari
                </Text>

                <View style={{ marginTop: 10, height: 10, borderRadius: 999, backgroundColor: "#E2E8F0" }}>
                  <View
                    style={{
                      width: `${pct}%`,
                      height: 10,
                      borderRadius: 999,
                      backgroundColor: CERDIK_COLORS.primary,
                    }}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>

    <DraggableEdukasiFab />
    </View>
  );
}
