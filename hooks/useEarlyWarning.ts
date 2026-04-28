import { useMemo } from "react";

import { Goal } from "@/stores/useGoalStore";
import { Transaction } from "@/stores/useTransactionStore";

export type WarningSeverity = "high" | "medium" | "low";

export type EarlyWarning = {
  id: string;
  type:
    | "OVERSPENDING_DAILY"
    | "BUDGET_80_PERCENT"
    | "CATEGORY_SPIKE"
    | "NO_SAVING"
    | "IMPULSE_PATTERN"
    | "GOAL_AT_RISK";
  message: string;
  severity: WarningSeverity;
  createdAt: string;
};

const formatRupiah = (value: number) => `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(value))}`;

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const daysAgo = (now: Date, days: number) => {
  const d = new Date(now);
  d.setDate(now.getDate() - days);
  return d;
};

const sameDay = (a: Date, b: Date) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);

const getTxDate = (tx: Partial<Transaction>) => tx.date ?? tx.createdAt ?? new Date().toISOString();

export function useEarlyWarning(params: {
  transactions: Transaction[];
  goals: Goal[];
  now?: Date;
}) {
  const { transactions, goals, now = new Date() } = params;

  return useMemo<EarlyWarning[]>(() => {
    const warnings: EarlyWarning[] = [];

    const monthKey = now.toISOString().slice(0, 7);
    const monthTransactions = transactions.filter((tx) => getTxDate(tx).slice(0, 7) === monthKey);
    const monthExpenses = monthTransactions.filter((tx) => tx.type === "expense");
    const monthIncomes = monthTransactions.filter((tx) => tx.type === "income");

    const totalExpenseMonth = monthExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncomeMonth = monthIncomes.reduce((sum, tx) => sum + tx.amount, 0);
    const netMonth = totalIncomeMonth - totalExpenseMonth;

    // 1) OVERSPENDING_DAILY
    const today = startOfDay(now);
    const todayExpense = monthExpenses
      .filter((tx) => sameDay(new Date(getTxDate(tx)), today))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const uniqueExpenseDays = new Set(
      monthExpenses.map((tx) => new Date(getTxDate(tx)).toISOString().slice(0, 10)),
    );
    const avgDailyExpense = uniqueExpenseDays.size > 0 ? totalExpenseMonth / uniqueExpenseDays.size : 0;

    if (avgDailyExpense > 0 && todayExpense > 2 * avgDailyExpense) {
      warnings.push({
        id: `OVERSPENDING_DAILY-${today.toISOString().slice(0, 10)}`,
        type: "OVERSPENDING_DAILY",
        message: `Pengeluaranmu hari ini ${formatRupiah(todayExpense)}, lebih dari 2x rata-rata harianmu!`,
        severity: "high",
        createdAt: new Date().toISOString(),
      });
    }

    // 2) BUDGET_80_PERCENT
    if (totalIncomeMonth > 0 && totalExpenseMonth > 0.8 * totalIncomeMonth) {
      const remaining = Math.max(0, totalIncomeMonth - totalExpenseMonth);
      warnings.push({
        id: `BUDGET_80_PERCENT-${monthKey}`,
        type: "BUDGET_80_PERCENT",
        message: `Kamu sudah memakai 80% uang sakumu. Sisa ${formatRupiah(remaining)} sampai akhir bulan.`,
        severity: "high",
        createdAt: new Date().toISOString(),
      });
    }

    // 3) CATEGORY_SPIKE (week: last 7 days)
    const weekStart = startOfDay(daysAgo(now, 6));
    const weekExpenses = transactions
      .filter((tx) => tx.type === "expense")
      .filter((tx) => new Date(getTxDate(tx)) >= weekStart);

    const totalWeekExpense = weekExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    if (totalWeekExpense > 0) {
      const byCategory = new Map<string, number>();
      weekExpenses.forEach((tx) => {
        byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + tx.amount);
      });
      const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
      if (top) {
        const percentage = (top[1] / totalWeekExpense) * 100;
        if (percentage > 50) {
          warnings.push({
            id: `CATEGORY_SPIKE-${weekStart.toISOString().slice(0, 10)}-${top[0]}`,
            type: "CATEGORY_SPIKE",
            message: `Pengeluaran ${top[0]} kamu sangat tinggi minggu ini (${percentage.toFixed(0)}% dari total).`,
            severity: "medium",
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // 4) NO_SAVING
    const savingWindowStart = startOfDay(daysAgo(now, 6));
    const savingLike = transactions.filter((tx) => {
      const category = (tx.category ?? "").toLowerCase();
      const inWindow = new Date(getTxDate(tx)) >= savingWindowStart;
      return inWindow && (category === "tabungan" || category.includes("tabung"));
    });
    if (savingLike.length === 0) {
      warnings.push({
        id: `NO_SAVING-${savingWindowStart.toISOString().slice(0, 10)}`,
        type: "NO_SAVING",
        message: "Kamu belum menabung 7 hari terakhir. Yuk mulai dari Rp 5.000!",
        severity: "medium",
        createdAt: new Date().toISOString(),
      });
    }

    // 5) IMPULSE_PATTERN
    const todayImpulseCount = transactions.filter((tx) => {
      const category = (tx.category ?? "").toLowerCase();
      if (!sameDay(new Date(getTxDate(tx)), today)) return false;
      return category === "jajan" || category === "hiburan";
    }).length;

    if (todayImpulseCount >= 3) {
      warnings.push({
        id: `IMPULSE_PATTERN-${today.toISOString().slice(0, 10)}`,
        type: "IMPULSE_PATTERN",
        message: "Kamu jajan/hiburan 3x hari ini. Coba pikir dua kali sebelum beli!",
        severity: "low",
        createdAt: new Date().toISOString(),
      });
    }

    // 6) GOAL_AT_RISK
    const activeGoals = goals.filter((g) => !g.isCompleted);
    activeGoals.forEach((goal) => {
      const deadline = new Date(goal.deadline);
      const daysLeft = Math.ceil((startOfDay(deadline).getTime() - startOfDay(now).getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 0) return;

      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      if (daysLeft < 30 && progress < 50) {
        const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
        const perDay = Math.ceil(remaining / daysLeft);
        warnings.push({
          id: `GOAL_AT_RISK-${goal.id}`,
          type: "GOAL_AT_RISK",
          message: `Target '${goal.name}' terancam tidak tercapai. Butuh ${formatRupiah(perDay)}/hari untuk mengejar.`,
          severity: "high",
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Sort by severity: high -> medium -> low
    const severityRank: Record<WarningSeverity, number> = { high: 0, medium: 1, low: 2 };
    warnings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    // Avoid duplicates
    const map = new Map<string, EarlyWarning>();
    warnings.forEach((w) => map.set(w.id, w));
    return [...map.values()];
  }, [transactions, goals, now]);
}

