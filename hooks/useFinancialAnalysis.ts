import { useEffect, useMemo, useState } from "react";

import { transactionService } from "@/services/transactionService";
import { Transaction, useTransactionStore } from "@/stores/useTransactionStore";

export type FinancialPeriod = "week" | "month" | "threeMonths";

export type CategoryExpense = {
  category: string;
  amount: number;
  percentage: number;
};

const CHART_COLORS = [
  "#6C63FF",
  "#43D9AD",
  "#FF6B6B",
  "#FFB347",
  "#3B82F6",
  "#A855F7",
  "#14B8A6",
  "#F97316",
];

export const formatCurrency = (value: number) =>
  `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(value))}`;

export const filterTransactionsByPeriod = (
  transactions: Transaction[],
  period: FinancialPeriod,
  now = new Date(),
) => {
  const startDate = new Date(now);
  if (period === "week") {
    startDate.setDate(now.getDate() - 6);
  } else if (period === "month") {
    startDate.setDate(now.getDate() - 29);
  } else {
    startDate.setDate(now.getDate() - 89);
  }
  startDate.setHours(0, 0, 0, 0);

  return transactions.filter((tx) => new Date(tx.date) >= startDate);
};

export const calculateSummary = (transactions: Transaction[]) => {
  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const net = totalIncome - totalExpense;
  const savingsPercentage = totalIncome > 0 ? (net / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    net,
    savingsPercentage,
  };
};

export const buildWeeklyBarData = (transactions: Transaction[], now = new Date()) => {
  const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const data: Array<{ value: number; label: string; frontColor: string; spacing: number }> = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dayKey = date.toISOString().slice(0, 10);

    const dayTransactions = transactions.filter((tx) => tx.date.slice(0, 10) === dayKey);
    const income = dayTransactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = dayTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);

    data.push({
      value: income,
      label: dayLabels[date.getDay()],
      frontColor: "#22C55E",
      spacing: 2,
    });
    data.push({
      value: expense,
      label: "",
      frontColor: "#EF4444",
      spacing: 12,
    });
  }

  return data;
};

export const buildCategoryExpenseData = (transactions: Transaction[]) => {
  const expenseTransactions = transactions.filter((tx) => tx.type === "expense");
  const totalExpense = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  if (totalExpense <= 0) {
    return [];
  }

  const categoryMap = new Map<string, number>();
  expenseTransactions.forEach((tx) => {
    categoryMap.set(tx.category, (categoryMap.get(tx.category) ?? 0) + tx.amount);
  });

  const sorted = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.map(([category, amount], index) => ({
    category,
    amount,
    percentage: (amount / totalExpense) * 100,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
};

export function useTrend() {
  const storeTransactions = useTransactionStore((s) => s.transactions);
  const [pairMonthTx, setPairMonthTx] = useState<Transaction[]>([]);

  const txFingerprint = useMemo(
    () => storeTransactions.map((t) => `${t.id}:${t.amount}:${t.category}:${t.type}:${t.date}`).join("|"),
    [storeTransactions],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const now = new Date();
        const curM = now.getMonth() + 1;
        const curY = now.getFullYear();
        const prevCal = new Date(curY, now.getMonth() - 1, 1);
        const prevM = prevCal.getMonth() + 1;
        const prevY = prevCal.getFullYear();
        const [cur, prev] = await Promise.all([
          transactionService.getTransactions({ month: curM, year: curY }),
          transactionService.getTransactions({ month: prevM, year: prevY }),
        ]);
        if (!cancelled) setPairMonthTx([...cur, ...prev]);
      } catch {
        if (!cancelled) setPairMonthTx([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [txFingerprint]);

  return useMemo(() => {
    const now = new Date();

    const thisMonth = pairMonthTx.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = pairMonthTx.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    });

    const calc = (txList: Transaction[]) => ({
      income: txList.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0),
      expense: txList.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0),
      saving: txList
        .filter((tx) => tx.category === "Tabungan" || tx.category === "Menabung")
        .reduce((s, tx) => s + tx.amount, 0),
    });

    const current = calc(thisMonth);
    const previous = calc(lastMonth);

    const noBaselineLastMonth = lastMonth.length === 0;

    function getTrend(curr: number, prev: number): string {
      if (prev === 0) return curr > 0 ? "+100%" : "0%";
      const change = ((curr - prev) / prev) * 100;
      const rounded = Math.round(change);
      return rounded >= 0 ? `+${rounded}%` : `${rounded}%`;
    }

    const incomeTrend = noBaselineLastMonth ? "Data baru" : getTrend(current.income, previous.income);
    const expenseTrend = noBaselineLastMonth ? "Data baru" : getTrend(current.expense, previous.expense);
    const savingTrend = noBaselineLastMonth ? "Data baru" : getTrend(current.saving, previous.saving);

    const incomeIsUp = current.income >= previous.income;
    const expenseIsUp = current.expense >= previous.expense;
    const savingIsUp = current.saving >= previous.saving;

    /** Untuk warna/panah: pemasukan & tabungan naik = bagus; pengeluaran turun = bagus */
    const incomeTrendPositive = current.income >= previous.income;
    const expenseTrendPositive = current.expense <= previous.expense;
    const savingTrendPositive = current.saving >= previous.saving;

    return {
      incomeTrend,
      expenseTrend,
      savingTrend,
      incomeIsUp,
      expenseIsUp,
      savingIsUp,
      incomeTrendPositive,
      expenseTrendPositive,
      savingTrendPositive,
      trendIsNewData: noBaselineLastMonth,
    };
  }, [pairMonthTx]);
}

export const generateAnalysisTexts = (
  summary: { totalIncome: number; totalExpense: number; net: number },
  topCategory: CategoryExpense | null,
) => {
  const lines: string[] = [];
  if (summary.totalIncome > 0) {
    const expenseRatio = (summary.totalExpense / summary.totalIncome) * 100;
    if (expenseRatio > 70) {
      lines.push(`⚠️ Pengeluaranmu sudah mencapai ${expenseRatio.toFixed(1)}% dari uang saku!`);
    }
  }

  if (topCategory) {
    lines.push(
      `Pengeluaran terbesar kamu di ${topCategory.category} sebesar ${formatCurrency(
        topCategory.amount,
      )}.`,
    );
  }

  if (summary.net > 0) {
    lines.push(`Hebat! Kamu berhasil menabung ${formatCurrency(summary.net)} pada periode ini.`);
  }

  if (lines.length === 0) {
    lines.push("Keuanganmu cukup stabil. Pertahankan kebiasaan baik ini!");
  }

  return lines;
};
