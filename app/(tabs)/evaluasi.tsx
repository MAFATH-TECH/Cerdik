import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";

import { ScreenEmpty, ScreenError, ScreenLoading } from "@/components/ui/ScreenState";
import {
  buildCategoryExpenseData,
  buildWeeklyBarData,
  calculateSummary,
  filterTransactionsByPeriod,
  FinancialPeriod,
  formatCurrency,
  generateAnalysisTexts,
} from "@/hooks/useFinancialAnalysis";
import { CERDIK_COLORS } from "../../constants/colors";
import { useTransactionStore } from "../../stores/useTransactionStore";

const PERIOD_OPTIONS: { key: FinancialPeriod; label: string }[] = [
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
  { key: "threeMonths", label: "3 Bulan" },
];

export default function EvaluasiScreen() {
  const { transactions, loadTransactions, isLoading, error } = useTransactionStore();
  const [period, setPeriod] = useState<FinancialPeriod>("month");

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filteredTransactions = useMemo(
    () => filterTransactionsByPeriod(transactions, period),
    [transactions, period],
  );

  const summary = useMemo(
    () => calculateSummary(filteredTransactions),
    [filteredTransactions],
  );

  const weeklyBarData = useMemo(
    () => buildWeeklyBarData(filteredTransactions),
    [filteredTransactions],
  );

  const categoryExpenseData = useMemo(
    () => buildCategoryExpenseData(filteredTransactions),
    [filteredTransactions],
  );

  const topCategory = useMemo(
    () =>
      categoryExpenseData[0]
        ? {
            category: categoryExpenseData[0].category,
            amount: categoryExpenseData[0].amount,
            percentage: categoryExpenseData[0].percentage,
          }
        : null,
    [categoryExpenseData],
  );

  const analysisLines = useMemo(
    () => generateAnalysisTexts(summary, topCategory),
    [summary, topCategory],
  );

  const donutData = categoryExpenseData.map((item) => ({
    value: item.amount,
    color: item.color,
    text: item.category,
  }));
  const donutCenterText =
    categoryExpenseData.length > 0
      ? `${categoryExpenseData[0].percentage.toFixed(0)}%\nTerbesar`
      : "0%\nData";

  if (isLoading) return <ScreenLoading />;
  if (error)
    return (
      <ScreenError
        description={error}
        onRetry={() => {
          loadTransactions();
        }}
      />
    );
  if (transactions.length === 0)
    return (
      <ScreenEmpty
        emoji="📉"
        title="Belum ada data evaluasi"
        description="Mulai catat transaksi dulu, nanti grafik & ringkasan akan muncul otomatis."
        actionLabel="Catat Transaksi"
        onAction={() => router.push("/(tabs)/catat" as any)}
      />
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
    >
      <Text style={{ marginBottom: 12, fontSize: 24, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
        Evaluasi Keuangan
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
        {PERIOD_OPTIONS.map((option) => {
          const active = option.key === period;
          return (
            <Pressable
              key={option.key}
              onPress={() => setPeriod(option.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? CERDIK_COLORS.primary : "#FFFFFF",
                borderWidth: 1,
                borderColor: active ? CERDIK_COLORS.primary : "#E2E8F0",
              }}
            >
              <Text style={{ color: active ? "#FFFFFF" : CERDIK_COLORS.textSecondary, fontWeight: "700" }}>
                {option.label}
              </Text>
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
              <Text style={{ marginLeft: 4, color: "#16A34A", fontWeight: "700" }}>
                {formatCurrency(summary.totalIncome)}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: CERDIK_COLORS.textSecondary }}>Pengeluaran</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <Ionicons name="arrow-down" size={14} color="#DC2626" />
              <Text style={{ marginLeft: 4, color: "#DC2626", fontWeight: "700" }}>
                {formatCurrency(summary.totalExpense)}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: CERDIK_COLORS.textSecondary }}>Net</Text>
          <Text style={{ color: summary.net >= 0 ? "#16A34A" : "#DC2626", fontWeight: "700" }}>
            {formatCurrency(summary.net)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ color: CERDIK_COLORS.textSecondary }}>% Tabungan</Text>
          <Text style={{ color: summary.savingsPercentage >= 0 ? "#16A34A" : "#DC2626", fontWeight: "700" }}>
            {summary.savingsPercentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 14,
          marginBottom: 14,
        }}
      >
        <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          Grafik Mingguan
        </Text>
        <BarChart
          data={weeklyBarData}
          barWidth={10}
          spacing={12}
          roundedTop
          hideRules
          yAxisTextStyle={{ color: CERDIK_COLORS.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: CERDIK_COLORS.textSecondary, fontSize: 10 }}
          showValuesAsTopLabel
          topLabelTextStyle={{ color: CERDIK_COLORS.textSecondary, fontSize: 9 }}
          maxValue={Math.max(100000, ...weeklyBarData.map((item) => item.value))}
        />
      </View>

      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          Pengeluaran per Kategori
        </Text>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <PieChart
            data={donutData}
            donut
            radius={86}
            innerRadius={58}
            textColor={CERDIK_COLORS.textPrimary}
            centerLabelComponent={() => (
              <Text style={{ textAlign: "center", fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
                {donutCenterText}
              </Text>
            )}
          />
        </View>
        {categoryExpenseData.map((item) => (
          <View key={item.category} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: item.color,
                marginRight: 8,
              }}
            />
            <Text style={{ color: CERDIK_COLORS.textSecondary }}>
              {item.category} ({item.percentage.toFixed(1)}%)
            </Text>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          Tabel Kategori Pengeluaran
        </Text>
        {categoryExpenseData.map((item) => (
          <View key={`table-${item.category}`} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "600" }}>{item.category}</Text>
              <Text style={{ color: CERDIK_COLORS.textSecondary }}>
                {formatCurrency(item.amount)} | {item.percentage.toFixed(1)}%
              </Text>
            </View>
            <View style={{ marginTop: 6, height: 8, borderRadius: 999, backgroundColor: "#E2E8F0" }}>
              <View
                style={{
                  width: `${item.percentage}%`,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: item.color,
                }}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14 }}>
        <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          Ringkasan Keuanganmu
        </Text>
        {analysisLines.map((line) => (
          <Text key={line} style={{ color: CERDIK_COLORS.textSecondary, marginBottom: 6, lineHeight: 20 }}>
            {line}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}
