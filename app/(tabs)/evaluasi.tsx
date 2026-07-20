import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import TransactionSwipeRow from "@/components/TransactionSwipeRow";
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
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true }),
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
          backgroundColor: CERDIK_COLORS.muted,
          borderRadius: 12,
          opacity,
        },
        style,
      ]}
    />
  );
}

export default function EvaluasiScreen() {
  const transactions = useTransactionStore((s) => s.transactions);
  const loadMonthData = useTransactionStore((s) => s.loadMonthData);
  const setSelectedPeriod = useTransactionStore((s) => s.setSelectedPeriod);
  const isLoading = useTransactionStore((s) => s.isLoading);
  const error = useTransactionStore((s) => s.error);
  const storeSummary = useTransactionStore((s) => s.summary);
  const selectedMonth = useTransactionStore((s) => s.selectedMonth);
  const selectedYear = useTransactionStore((s) => s.selectedYear);
  const removeTransaction = useTransactionStore((s) => s.removeTransaction);
  const goals = useGoalStore((s) => s.goals);
  const loadGoals = useGoalStore((s) => s.loadGoals);

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
      void Promise.all([loadMonthData(), loadGoals()]);
    }, [loadGoals, loadMonthData]),
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
    let totalSaving = 0;
    const byCategoryMap = new Map<string, number>();

    for (const tx of periodTransactions) {
      const cat = tx.category || "Lainnya";
      if (cat === "Tabungan" || cat === "Menabung") {
        totalSaving += tx.amount;
      }
      if (tx.type === "income") {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        if (cat !== "Menabung") {
          byCategoryMap.set(cat, (byCategoryMap.get(cat) ?? 0) + tx.amount);
        }
      }
    }

    const byCategory = [...byCategoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => ({ category, total }));

    const net = totalIncome - totalExpense;
    const savingsPercentage = totalIncome > 0 ? (net / totalIncome) * 100 : 0;

    return { totalIncome, totalExpense, net, totalSaving, byCategory, savingsPercentage };
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

        data.push({ value: totals.income, label, frontColor: CERDIK_COLORS.income, spacing: 2 });
        data.push({ value: totals.expense, label: "", frontColor: CERDIK_COLORS.expense, spacing: 12 });
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

        data.push({ value: incomeSum, label: `W${w + 1}`, frontColor: CERDIK_COLORS.income, spacing: 2 });
        data.push({ value: expenseSum, label: "", frontColor: CERDIK_COLORS.expense, spacing: 12 });
      }
    }

    if (data.length > maxBars) return data.slice(0, maxBars);
    return data;
  }, [period, periodTransactions, selectedMonth, selectedYear]);

  const SAVING_SLICE_COLOR = CERDIK_COLORS.secondary;

  const pieData = useMemo(() => {
    const slices: { value: number; color: string; text: string }[] = summary.byCategory.map((item) => ({
      value: item.total,
      color: CATEGORY_COLORS[item.category] ?? "#888888",
      text: item.category,
    }));
    if (summary.totalSaving > 0) {
      slices.push({ value: summary.totalSaving, color: SAVING_SLICE_COLOR, text: "Tabungan" });
    }
    return slices;
  }, [summary.byCategory, summary.totalSaving]);

  const donutCenterText = useMemo(() => {
    if (pieData.length === 0) return "0%\nData";
    const totalPie = pieData.reduce((s, x) => s + x.value, 0);
    if (totalPie <= 0) return "0%\nData";
    const top = [...pieData].sort((a, b) => b.value - a.value)[0];
    const pct = (top.value / totalPie) * 100;
    return `${pct.toFixed(0)}%\n${top.text}`;
  }, [pieData]);

  const savingSharePct =
    summary.totalIncome > 0 ? (summary.totalSaving / summary.totalIncome) * 100 : 0;

  const savingCardColors = useMemo(() => {
    if (savingSharePct <= 0) {
      return {
        border: CERDIK_COLORS.border,
        accent: CERDIK_COLORS.textSecondary,
        message: "Belum ada tabungan bulan ini",
      };
    }
    if (savingSharePct >= 20) {
      return {
        border: `${CERDIK_COLORS.success}55`,
        accent: CERDIK_COLORS.primary,
        message: "Tabunganmu sudah ideal! 🎉",
      };
    }
    if (savingSharePct >= 10) {
      return {
        border: `${CERDIK_COLORS.warning}44`,
        accent: CERDIK_COLORS.warning,
        message: "Lumayan! Coba tingkatkan ke 20% ya",
      };
    }
    return {
      border: `${CERDIK_COLORS.danger}44`,
      accent: CERDIK_COLORS.danger,
      message: "Yuk tingkatkan tabunganmu!",
    };
  }, [savingSharePct]);

  const insights = useMemo(() => {
    const computed: string[] = [];

    if (summary.totalIncome <= 0) {
      computed.push("Belum ada pemasukan. Yuk mulai catat transaksi pemasukan dulu ya!");
      return computed;
    }

    if (summary.net < 0) {
      computed.push("Pengeluaranmu melebihi pemasukan pada periode ini. Yuk evaluasi!");
    }

    const savingRateRecorded =
      summary.totalIncome > 0 ? (summary.totalSaving / summary.totalIncome) * 100 : 0;

    if (summary.net >= 0) {
      if (savingRateRecorded >= 20) {
        computed.push("Keren! Tabungan tercatat sudah di atas 20% dari pemasukan — pertahankan!");
      } else if (savingRateRecorded > 0) {
        computed.push(
          `Tabungan tercatat ${savingRateRecorded.toFixed(0)}% dari pemasukan (kategori Tabungan/Menabung). Target minimal 20% ya!`,
        );
      } else {
        computed.push(
          "Belum ada tabungan tercatat lewat kategori Tabungan atau Menabung. Yuk sisihkan dan catat!",
        );
      }
    }

    if (summary.byCategory.length > 0 && summary.totalExpense > 0) {
      const top = summary.byCategory[0];
      const pct = Math.round((top.total / summary.totalExpense) * 100);
      computed.push(`Pengeluaran terbesar kamu di kategori ${top.category} (${pct}% dari total pengeluaran).`);
    }

    const activeGoals = goals.filter((g) => !g.isCompleted);
    if (activeGoals.length > 0) {
      const nearest = activeGoals[0];
      const progress = nearest.targetAmount > 0 ? Math.round((nearest.currentAmount / nearest.targetAmount) * 100) : 0;
      computed.push(`Progress target "${nearest.name}" sudah ${progress}%. Semangat!`);
    }

    return computed;
  }, [goals, summary.byCategory, summary.net, summary.totalExpense, summary.totalIncome, summary.totalSaving]);

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

        <View style={{ backgroundColor: CERDIK_COLORS.card, borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <PulseBlock height={16} width="55%" style={{ marginBottom: 10 }} />
          <PulseBlock height={12} width="80%" style={{ marginBottom: 8 }} />
          <PulseBlock height={12} width="45%" />
        </View>

        <View style={{ backgroundColor: CERDIK_COLORS.card, borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <PulseBlock height={16} width="45%" style={{ marginBottom: 12 }} />
          <PulseBlock height={220} width="100%" />
        </View>

        <View style={{ backgroundColor: CERDIK_COLORS.card, borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <PulseBlock height={16} width="60%" style={{ marginBottom: 12 }} />
          <PulseBlock height={170} width={170} style={{ borderRadius: 85, alignSelf: "center" }} />
          <PulseBlock height={12} width="70%" style={{ marginTop: 12, alignSelf: "center" }} />
          <PulseBlock height={12} width="90%" style={{ marginTop: 8, alignSelf: "center" }} />
        </View>

        <View style={{ backgroundColor: CERDIK_COLORS.card, borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <PulseBlock height={16} width="60%" style={{ marginBottom: 12 }} />
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 14 }}>
              <PulseBlock height={14} width="80%" style={{ marginBottom: 8 }} />
              <PulseBlock height={10} width="100%" />
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: CERDIK_COLORS.card, borderRadius: 16, padding: 14 }}>
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
          loadMonthData();
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}
      >
        {[
          { key: "minggu" as const, label: "Minggu Ini" },
          { key: "bulan" as const, label: "Bulan Ini" },
          { key: "3bulan" as const, label: "3 Bulan" },
        ].map((option, index, arr) => {
          const active = option.key === period;
          const label = option.label?.trim() || "Periode";
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                setPeriod(option.key);
                setSelectedPeriod(selectedMonth, selectedYear).catch(() => undefined);
              }}
              style={{
                flexShrink: 0,
                marginRight: index < arr.length - 1 ? 8 : 0,
                paddingHorizontal: 14,
                paddingVertical: 8,
                minHeight: 36,
                justifyContent: "center",
                borderRadius: 999,
                backgroundColor: active ? CERDIK_COLORS.primary : CERDIK_COLORS.card,
                borderWidth: 1,
                borderColor: active ? CERDIK_COLORS.primary : CERDIK_COLORS.border,
              }}
            >
              <Text
                style={{
                  color: active ? "#FFFFFF" : CERDIK_COLORS.textSecondary,
                  fontWeight: "700",
                  fontSize: 12,
                  includeFontPadding: false,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        style={{
          backgroundColor: CERDIK_COLORS.card,
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
              <Ionicons name="arrow-up" size={14} color={CERDIK_COLORS.income} />
              <Text style={{ marginLeft: 4, color: CERDIK_COLORS.income, fontWeight: "700" }}>{formatCurrency(summary.totalIncome)}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: CERDIK_COLORS.textSecondary }}>Pengeluaran</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <Ionicons name="arrow-down" size={14} color={CERDIK_COLORS.expense} />
              <Text style={{ marginLeft: 4, color: CERDIK_COLORS.expense, fontWeight: "700" }}>{formatCurrency(summary.totalExpense)}</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: CERDIK_COLORS.textSecondary }}>Net</Text>
          <Text style={{ color: summary.net >= 0 ? CERDIK_COLORS.income : CERDIK_COLORS.expense, fontWeight: "700" }}>
            {formatCurrency(summary.net)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ color: CERDIK_COLORS.textSecondary }}>% Tabungan</Text>
          <Text style={{ color: summary.savingsPercentage >= 0 ? CERDIK_COLORS.income : CERDIK_COLORS.expense, fontWeight: "700" }}>
            {summary.savingsPercentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: CERDIK_COLORS.card,
          borderRadius: 16,
          padding: 14,
          marginBottom: 14,
          borderWidth: 2,
          borderColor: savingCardColors.border,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text style={{ fontSize: 12, color: CERDIK_COLORS.textSecondary, marginBottom: 4 }}>Ringkasan Tabungan</Text>
        <Text style={{ fontSize: 14, fontWeight: "700", color: CERDIK_COLORS.textPrimary, marginBottom: 10 }}>
          Total {periodLabel.toLowerCase()}
        </Text>
        <Text style={{ fontSize: 22, fontWeight: "800", color: CERDIK_COLORS.textPrimary, marginBottom: 6 }}>
          {formatCurrency(summary.totalSaving)}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "700", color: savingCardColors.accent, marginBottom: 8 }}>
          {savingSharePct.toFixed(1)}% dari pemasukan
        </Text>
        <Text style={{ fontSize: 13, color: savingCardColors.accent, lineHeight: 20 }}>{savingCardColors.message}</Text>
      </View>

      <View style={{ backgroundColor: CERDIK_COLORS.card, borderRadius: 16, padding: 14, marginBottom: 14 }}>
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

      <View style={{ backgroundColor: CERDIK_COLORS.card, borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Pengeluaran per Kategori</Text>
        <Text style={{ marginBottom: 10, fontSize: 12, color: CERDIK_COLORS.textSecondary }}>
          Diagram ini membandingkan nominal antar irisan: kategori pengeluaran lain + satu slice hijau untuk total tabungan
          yang kamu catat (Tabungan + Menabung). Kategori pemasukan (mis. Uang Saku, Beasiswa) tidak masuk diagram ini.
        </Text>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          {pieData.length === 0 ? (
            <Text style={{ color: CERDIK_COLORS.textSecondary }}>Belum ada data untuk diagram.</Text>
          ) : (
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
          )}
        </View>
      </View>

      <View style={{ backgroundColor: CERDIK_COLORS.card, borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Tabel Kategori Pengeluaran</Text>

        {summary.byCategory.length === 0 && summary.totalSaving <= 0 ? (
          <Text style={{ color: CERDIK_COLORS.textSecondary }}>Tidak ada data pengeluaran.</Text>
        ) : (
          <>
            {summary.totalSaving > 0 ? (
              <View key="table-tabungan" style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "600" }}>Tabungan</Text>
                  <Text style={{ color: CERDIK_COLORS.textSecondary }}>
                    {formatCurrency(summary.totalSaving)} | {savingSharePct.toFixed(1)}% pemasukan
                  </Text>
                </View>
                <View style={{ marginTop: 6, height: 8, borderRadius: 999, backgroundColor: CERDIK_COLORS.border }}>
                  <View
                    style={{
                      width: progressBarWidth(Math.min(100, savingSharePct)) as any,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: SAVING_SLICE_COLOR,
                    }}
                  />
                </View>
              </View>
            ) : null}
            {summary.byCategory.map((item) => {
              const pct =
                summary.totalExpense > 0 ? (item.total / summary.totalExpense) * 100 : 0;
              const color = CATEGORY_COLORS[item.category] ?? "#888888";
              return (
                <View key={`table-${item.category}`} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "600" }}>{item.category}</Text>
                    <Text style={{ color: CERDIK_COLORS.textSecondary }}>
                      {formatCurrency(item.total)} | {pct.toFixed(1)}% pengeluaran
                    </Text>
                  </View>
                  <View style={{ marginTop: 6, height: 8, borderRadius: 999, backgroundColor: CERDIK_COLORS.border }}>
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
            })}
          </>
        )}
      </View>

      <View style={{ backgroundColor: CERDIK_COLORS.card, borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          Daftar Transaksi (periode)
        </Text>
        {periodTransactions.length === 0 ? (
          <Text style={{ color: CERDIK_COLORS.textSecondary }}>Tidak ada transaksi di periode ini.</Text>
        ) : (
          periodTransactions.map((tx, idx) => {
            const isExpense = tx.type === "expense";
            const isLast = idx === periodTransactions.length - 1;
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
                            fetchPeriodTransactions().catch(() => undefined);
                            loadMonthData().catch(() => undefined);
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
                    borderBottomColor: CERDIK_COLORS.muted,
                    backgroundColor: CERDIK_COLORS.card,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 10 }}>
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
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "600" }}>{tx.note || tx.category}</Text>
                      <Text style={{ color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
                        {tx.category} •{" "}
                        {new Date(tx.date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: isExpense ? CERDIK_COLORS.expense : CERDIK_COLORS.income, fontWeight: "700" }}>
                    {isExpense ? "-" : "+"}
                    {formatCurrency(tx.amount)}
                  </Text>
                </View>
              </TransactionSwipeRow>
            );
          })
        )}
      </View>

      <View style={{ backgroundColor: CERDIK_COLORS.card, borderRadius: 16, padding: 14 }}>
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
              borderColor: CERDIK_COLORS.muted,
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
