import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";

import { ScreenEmpty, ScreenError } from "@/components/ui/ScreenState";
import { formatCurrency } from "@/hooks/useFinancialAnalysis";
import { CATEGORY_COLORS } from "@/constants/categories";
import { CERDIK_COLORS } from "@/constants/colors";
import { transactionService, type Transaction } from "@/services/transactionService";
import { useGoalStore } from "@/stores/useGoalStore";
import { useTransactionStore } from "@/stores/useTransactionStore";

type PeriodKey = "minggu" | "bulan" | "3bulan";

function toDateOnlyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function atStartOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function getRangeForPeriod({
  period,
  selectedMonth,
  selectedYear,
}: {
  period: PeriodKey;
  selectedMonth: number; // 1-12
  selectedYear: number;
}) {
  const now = new Date();
  if (period === "minggu") {
    const from = atStartOfDay(addDays(now, -6));
    const to = atStartOfDay(addDays(now, 1)); // exclusive
    return { from, to };
  }

  if (period === "bulan") {
    const from = new Date(selectedYear, selectedMonth - 1, 1);
    const to = new Date(selectedYear, selectedMonth, 1); // exclusive
    return { from, to };
  }

  // 3 bulan terakhir (masuk akal sebagai 3 bulan kalender: [bulan-2 .. bulan])
  const from = new Date(selectedYear, selectedMonth - 3, 1);
  const to = new Date(selectedYear, selectedMonth, 1); // exclusive
  return { from, to };
}

function PulseBlock({
  height,
  width,
  style,
}: {
  height: number;
  width?: number | any;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  const pulse = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    pulse.current = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: false }),
      ]),
    );
    pulse.current.start();
    return () => pulse.current?.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          height,
          width: width ?? "100%",
          backgroundColor: "#EEF2F7",
          borderRadius: 12,
          opacity,
        },
        style,
      ]}
    />
  );
}

export default function EvaluasiScreen() {
  const {
    transactions,
    loadTransactions,
    loadSummary,
    setSelectedPeriod,
    isLoading,
    error,
    summary: storeSummary,
    selectedMonth,
    selectedYear,
  } = useTransactionStore();
  const { goals, loadGoals } = useGoalStore();

  const [period, setPeriod] = useState<PeriodKey>("bulan");

  const [periodTransactions, setPeriodTransactions] = useState<Transaction[]>([]);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fetchSeqRef = useRef(0);

  const fetchPeriodTransactions = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    setPeriodLoading(true);
    setPeriodError(null);

    try {
      const { from, to } = getRangeForPeriod({ period, selectedMonth, selectedYear });
      const list = await transactionService.getTransactionsInRange({ from, to });

      // Pastikan data beneran ada di range (date dari server sudah DATE-only, tapi tetap jaga konsistensi).
      const fromStr = toDateOnlyLocal(from);
      const toStr = toDateOnlyLocal(to);
      const normalized = list
        .filter((tx) => tx.date >= fromStr && tx.date < toStr)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

      if (fetchSeqRef.current === seq) {
        setPeriodTransactions(normalized);
      }
    } catch (e) {
      if (fetchSeqRef.current === seq) {
        setPeriodError(e instanceof Error ? e.message : "Gagal memuat transaksi evaluasi.");
        setPeriodTransactions([]);
      }
    } finally {
      if (fetchSeqRef.current === seq) {
        setPeriodLoading(false);
      }
    }
  }, [period, selectedMonth, selectedYear]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      loadSummary();
      loadGoals();
    }, [loadGoals, loadSummary, loadTransactions]),
  );

  useEffect(() => {
    if (period === "bulan") {
      setPeriodTransactions(transactions);
      setPeriodError(null);
      setPeriodLoading(false);
      return;
    }

    fetchPeriodTransactions().catch(() => undefined);
  }, [period, fetchPeriodTransactions, transactions]);

  const isBusy = isLoading || periodLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await setSelectedPeriod(selectedMonth, selectedYear);
      await loadGoals();
      if (period !== "bulan") {
        await fetchPeriodTransactions();
      }
    } finally {
      setRefreshing(false);
    }
  }, [fetchPeriodTransactions, loadGoals, period, selectedMonth, selectedYear, setSelectedPeriod]);

  const summary = useMemo(() => {
    // Untuk period bulan, summary dari store sudah sesuai filter bulan ini.
    if (period === "bulan" && storeSummary) {
      const savingsPercentage = storeSummary.totalIncome > 0 ? (storeSummary.net / storeSummary.totalIncome) * 100 : 0;
      return { ...storeSummary, savingsPercentage };
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const byCategoryMap = new Map<string, number>();

    for (const tx of periodTransactions) {
      if (tx.type === "income") {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        const key = tx.category || "Lainnya";
        byCategoryMap.set(key, (byCategoryMap.get(key) ?? 0) + tx.amount);
      }
    }

    const byCategory = [...byCategoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => ({ category, total }));

    const net = totalIncome - totalExpense;
    const savingsPercentage = totalIncome > 0 ? (net / totalIncome) * 100 : 0;

    return { totalIncome, totalExpense, net, byCategory, savingsPercentage };
  }, [period, periodTransactions, storeSummary]);

  const barData = useMemo(() => {
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    // Map per tanggal: agar missing day -> 0.
    const totalsByDate = new Map<string, { income: number; expense: number }>();
    for (const tx of periodTransactions) {
      const cur = totalsByDate.get(tx.date) ?? { income: 0, expense: 0 };
      if (tx.type === "income") cur.income += tx.amount;
      else cur.expense += tx.amount;
      totalsByDate.set(tx.date, cur);
    }

    const { from, to } = getRangeForPeriod({ period, selectedMonth, selectedYear });

    // Untuk 3 bulan, batasi kompleksitas chart dengan bucket per minggu.
    const bucketMode: "day" | "week" = period === "3bulan" ? "week" : "day";
    const maxBars = bucketMode === "day" ? 62 : 26; // guard kecil

    const data: { value: number; label: string; frontColor: string; spacing?: number }[] = [];

    if (bucketMode === "day") {
      const totalDays = Math.max(0, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
      const safeDays = Math.min(totalDays, 31); // UI guard agar tidak terlalu berat

      for (let i = 0; i < safeDays; i++) {
        const d = addDays(from, i);
        const iso = toDateOnlyLocal(d);
        const totals = totalsByDate.get(iso) ?? { income: 0, expense: 0 };

        const label = period === "minggu" ? dayNames[d.getDay()] : String(d.getDate());

        data.push({ value: totals.income, label, frontColor: "#43D9AD", spacing: 2 });
        data.push({ value: totals.expense, label: "", frontColor: "#FF6B6B", spacing: 12 });
      }
    } else {
      // week bucket
      const totalDays = Math.max(0, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
      const totalWeeks = Math.ceil(totalDays / 7);
      const safeWeeks = Math.min(totalWeeks, 13);

      for (let w = 0; w < safeWeeks; w++) {
        const start = addDays(from, w * 7);

        let incomeSum = 0;
        let expenseSum = 0;

        for (let i = 0; i < 7; i++) {
          const d = addDays(start, i);
          if (d >= to) break;
          const iso = toDateOnlyLocal(d);
          const totals = totalsByDate.get(iso) ?? { income: 0, expense: 0 };
          incomeSum += totals.income;
          expenseSum += totals.expense;
        }

        data.push({ value: incomeSum, label: `W${w + 1}`, frontColor: "#43D9AD", spacing: 2 });
        data.push({ value: expenseSum, label: "", frontColor: "#FF6B6B", spacing: 12 });
      }
    }

    if (data.length > maxBars) return data.slice(0, maxBars);
    return data;
  }, [period, periodTransactions, selectedMonth, selectedYear]);

  const pieData = useMemo(() => {
    const totalExpense = summary.totalExpense;
    if (totalExpense <= 0) return [];

    return summary.byCategory.map((item) => ({
      value: item.total,
      color: CATEGORY_COLORS[item.category] ?? "#888888",
      text: item.category,
    }));
  }, [summary.totalExpense, summary.byCategory]);

  const donutCenterText = useMemo(() => {
    if (summary.totalExpense <= 0 || summary.byCategory.length === 0) return "0%\nData";
    const top = summary.byCategory[0];
    const pct = (top.total / summary.totalExpense) * 100;
    return `${pct.toFixed(0)}%\nTerbesar`;
  }, [summary.totalExpense, summary.byCategory]);

  const insights = useMemo(() => {
    const computed: string[] = [];

    if (summary.totalIncome <= 0) {
      computed.push("Belum ada pemasukan. Yuk mulai catat transaksi pemasukan dulu ya!");
      return computed;
    }

    const savingRate = (summary.net / summary.totalIncome) * 100;

    if (savingRate >= 20) computed.push("Keren! Tabunganmu sudah di atas 20% — pertahankan!");
    else if (savingRate > 0) computed.push(`Tabunganmu ${savingRate.toFixed(0)}% dari pemasukan. Target minimal 20% ya!`);
    else if (savingRate === 0) computed.push("Pengeluaranmu sama persis dengan pemasukan. Coba sisihkan sedikit!");
    else computed.push("Pengeluaranmu melebihi pemasukan bulan ini. Yuk evaluasi!");

    if (summary.byCategory.length > 0 && summary.totalExpense > 0) {
      const top = summary.byCategory[0];
      const pct = Math.round((top.total / summary.totalExpense) * 100);
      computed.push(`Pengeluaran terbesar kamu di kategori ${top.category} (${pct}% dari total).`);
    }

    const activeGoals = goals.filter((g) => !g.isCompleted);
    if (activeGoals.length > 0) {
      const nearest = activeGoals[0];
      const progress = nearest.targetAmount > 0 ? Math.round((nearest.currentAmount / nearest.targetAmount) * 100) : 0;
      computed.push(`Progress target "${nearest.name}" sudah ${progress}%. Semangat!`);
    }

    return computed;
  }, [goals, summary.byCategory, summary.net, summary.totalExpense, summary.totalIncome]);

  const progressBarWidth = (pct: number) => `${Math.max(0, Math.min(100, pct))}%`;

  if (isBusy) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }} contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
        <Text style={{ marginBottom: 12, fontSize: 24, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Evaluasi Keuangan</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
          {[{ key: "minggu" }, { key: "bulan" }, { key: "3bulan" }].map((opt) => (
            <PulseBlock key={opt.key} height={36} width={110} style={{ borderRadius: 999 }} />
          ))}
        </ScrollView>

        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <PulseBlock height={16} width="55%" style={{ marginBottom: 10 }} />
          <PulseBlock height={12} width="80%" style={{ marginBottom: 8 }} />
          <PulseBlock height={12} width="45%" />
        </View>

        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <PulseBlock height={16} width="45%" style={{ marginBottom: 12 }} />
          <PulseBlock height={220} width="100%" />
        </View>

        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <PulseBlock height={16} width="60%" style={{ marginBottom: 12 }} />
          <PulseBlock height={170} width={170} style={{ borderRadius: 85, alignSelf: "center" }} />
          <PulseBlock height={12} width="70%" style={{ marginTop: 12, alignSelf: "center" }} />
          <PulseBlock height={12} width="90%" style={{ marginTop: 8, alignSelf: "center" }} />
        </View>

        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <PulseBlock height={16} width="60%" style={{ marginBottom: 12 }} />
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 14 }}>
              <PulseBlock height={14} width="80%" style={{ marginBottom: 8 }} />
              <PulseBlock height={10} width="100%" />
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14 }}>
          <PulseBlock height={16} width="70%" style={{ marginBottom: 12 }} />
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <PulseBlock height={22} width={22} style={{ borderRadius: 11 }} />
              <View style={{ flex: 1 }}>
                <PulseBlock height={12} width="95%" style={{ marginBottom: 6 }} />
                <PulseBlock height={12} width="85%" />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (periodError || error)
    return (
      <ScreenError
        description={periodError ?? error ?? "Terjadi error saat memuat evaluasi."}
        onRetry={() => {
          loadTransactions();
          loadSummary();
          loadGoals();
          fetchPeriodTransactions().catch(() => undefined);
        }}
      />
    );

  if (periodTransactions.length === 0)
    return (
      <ScreenEmpty
        emoji="📉"
        title="Belum ada transaksi"
        description="Belum ada transaksi. Yuk mulai catat keuanganmu!"
        actionLabel="Catat Keuangan"
        onAction={() => router.push("/(tabs)/catat" as any)}
      />
    );

  const periodLabel = period === "minggu" ? "Mingguan" : period === "bulan" ? "Bulanan" : "3 Bulan";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
    >
      <Text style={{ marginBottom: 12, fontSize: 24, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Evaluasi Keuangan</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
        {[
          { key: "minggu" as const, label: "Minggu Ini" },
          { key: "bulan" as const, label: "Bulan Ini" },
          { key: "3bulan" as const, label: "3 Bulan" },
        ].map((option) => {
          const active = option.key === period;
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                setPeriod(option.key);
                setSelectedPeriod(selectedMonth, selectedYear).catch(() => undefined);
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? CERDIK_COLORS.primary : "#FFFFFF",
                borderWidth: 1,
                borderColor: active ? CERDIK_COLORS.primary : "#E2E8F0",
              }}
            >
              <Text style={{ color: active ? "#FFFFFF" : CERDIK_COLORS.textSecondary, fontWeight: "700" }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 14,
          marginBottom: 14,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: CERDIK_COLORS.textSecondary }}>Pemasukan</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <Ionicons name="arrow-up" size={14} color="#16A34A" />
              <Text style={{ marginLeft: 4, color: "#16A34A", fontWeight: "700" }}>{formatCurrency(summary.totalIncome)}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: CERDIK_COLORS.textSecondary }}>Pengeluaran</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <Ionicons name="arrow-down" size={14} color="#DC2626" />
              <Text style={{ marginLeft: 4, color: "#DC2626", fontWeight: "700" }}>{formatCurrency(summary.totalExpense)}</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: CERDIK_COLORS.textSecondary }}>Net</Text>
          <Text style={{ color: summary.net >= 0 ? "#16A34A" : "#DC2626", fontWeight: "700" }}>{formatCurrency(summary.net)}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ color: CERDIK_COLORS.textSecondary }}>% Tabungan</Text>
          <Text style={{ color: summary.savingsPercentage >= 0 ? "#16A34A" : "#DC2626", fontWeight: "700" }}>
            {summary.savingsPercentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          Grafik {periodLabel}
        </Text>
        <BarChart
          data={barData}
          barWidth={10}
          spacing={12}
          roundedTop
          hideRules
          yAxisTextStyle={{ color: CERDIK_COLORS.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: CERDIK_COLORS.textSecondary, fontSize: 10 }}
          showValuesAsTopLabel
          topLabelTextStyle={{ color: CERDIK_COLORS.textSecondary, fontSize: 9 }}
          maxValue={Math.max(100000, ...barData.map((item) => item.value))}
        />
      </View>

      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Pengeluaran per Kategori</Text>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <PieChart
            data={pieData}
            donut
            radius={86}
            innerRadius={58}
            textColor={CERDIK_COLORS.textPrimary}
            centerLabelComponent={() => (
              <Text style={{ textAlign: "center", fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>{donutCenterText}</Text>
            )}
          />
        </View>
      </View>

      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Tabel Kategori Pengeluaran</Text>

        {summary.byCategory.length === 0 ? (
          <Text style={{ color: CERDIK_COLORS.textSecondary }}>Tidak ada data pengeluaran.</Text>
        ) : (
          summary.byCategory.map((item) => {
            const pct = summary.totalExpense > 0 ? (item.total / summary.totalExpense) * 100 : 0;
            const color = CATEGORY_COLORS[item.category] ?? "#888888";
            return (
              <View key={`table-${item.category}`} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "600" }}>{item.category}</Text>
                  <Text style={{ color: CERDIK_COLORS.textSecondary }}>
                    {formatCurrency(item.total)} | {pct.toFixed(1)}%
                  </Text>
                </View>
                <View style={{ marginTop: 6, height: 8, borderRadius: 999, backgroundColor: "#E2E8F0" }}>
                  <View
                    style={{
                      width: progressBarWidth(pct) as any,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: color,
                    }}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14 }}>
        <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Ringkasan Keuanganmu</Text>
        {insights.map((line) => (
          <View
            key={line}
            style={{
              flexDirection: "row",
              gap: 10,
              padding: 12,
              borderRadius: 14,
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#EEF2F7",
              marginBottom: 10,
            }}
          >
            <Ionicons name="bulb-outline" size={18} color={CERDIK_COLORS.primary} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, color: CERDIK_COLORS.textSecondary, lineHeight: 20 }}>{line}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
