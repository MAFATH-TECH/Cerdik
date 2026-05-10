import { useEffect, useMemo, useState } from "react";
import { userSettingsService } from "@/services/userSettingsService";

import { useGoalStore } from "@/stores/useGoalStore";
import { useTransactionStore } from "@/stores/useTransactionStore";

export interface Warning {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "high" | "medium" | "low";
  actionLabel?: string;
  actionRoute?: string;
}

export function useEarlyWarning(): Warning[] {
  const { transactions, summary } = useTransactionStore();
  const { goals } = useGoalStore();
  const [weeklyExpenseLimit, setWeeklyExpenseLimit] = useState(0);

  useEffect(() => {
    userSettingsService
      .getSettings()
      .then((settings) => setWeeklyExpenseLimit(settings.weeklyExpenseLimit))
      .catch(() => setWeeklyExpenseLimit(0));
  }, []);

  return useMemo(() => {
    const warnings: Warning[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const thisMonthExpenses = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return tx.type === "expense" && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const thisMonthTx = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const savingThisMonth = thisMonthTx.filter(
      (tx) => tx.category === "Tabungan" || tx.category === "Menabung",
    );

    const totalExpense = summary?.totalExpense ?? 0;
    const totalIncome = summary?.totalIncome ?? 0;

    // RULE 1: Pengeluaran sudah >80% pemasukan
    if (totalIncome > 0 && totalExpense / totalIncome > 0.8) {
      const sisa = totalIncome - totalExpense;
      warnings.push({
        id: "budget_80",
        type: "BUDGET_80_PERCENT",
        title: "Hampir Habis!",
        message: `Kamu sudah pakai ${Math.round((totalExpense / totalIncome) * 100)}% uang sakumu. Sisa Rp ${sisa.toLocaleString("id-ID")} sampai akhir bulan.`,
        severity: "high",
        actionLabel: "Lihat Evaluasi",
        actionRoute: "/(tabs)/evaluasi",
      });
    }

    // RULE 2: Pengeluaran hari ini >2x rata-rata harian
    const todayExpenses = thisMonthExpenses.filter((tx) => tx.date === todayStr);
    const todayTotal = todayExpenses.reduce((s, tx) => s + tx.amount, 0);
    const avgDaily = totalExpense / Math.max(1, today.getDate());
    if (todayTotal > avgDaily * 2 && todayTotal > 5000) {
      warnings.push({
        id: "overspend_today",
        type: "OVERSPENDING_DAILY",
        title: "Pengeluaran Hari Ini Tinggi",
        message: `Hari ini kamu sudah keluar Rp ${todayTotal.toLocaleString("id-ID")}, lebih dari 2x rata-rata harianmu.`,
        severity: "high",
      });
    }

    // RULE 3: Jajan & Hiburan >40% total pengeluaran
    const jajanTotal = thisMonthExpenses
      .filter((tx) => ["Jajan", "Hiburan"].includes(tx.category))
      .reduce((s, tx) => s + tx.amount, 0);
    if (totalExpense > 0 && jajanTotal / totalExpense > 0.4) {
      warnings.push({
        id: "jajan_spike",
        type: "CATEGORY_SPIKE",
        title: "Banyak Jajan Nih",
        message: `${Math.round((jajanTotal / totalExpense) * 100)}% pengeluaranmu untuk jajan & hiburan. Coba dikurangi!`,
        severity: "medium",
      });
    }

    // RULE 4: Jajan 3x+ dalam satu hari
    const todayJajan = todayExpenses.filter((tx) => ["Jajan", "Hiburan"].includes(tx.category));
    if (todayJajan.length >= 3) {
      warnings.push({
        id: "impulse",
        type: "IMPULSE_PATTERN",
        title: "Sering Jajan Hari Ini",
        message: `Kamu sudah ${todayJajan.length}x jajan/hiburan hari ini. Pikir dua kali sebelum beli lagi!`,
        severity: "low",
      });
    }

    // RULE 5: Goal terancam tidak tercapai
    goals
      .filter((g) => !g.isCompleted)
      .forEach((goal) => {
        const deadline = new Date(goal.deadline);
        const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
        if (daysLeft <= 30 && daysLeft > 0 && progress < 0.5) {
          const needed = goal.targetAmount - goal.currentAmount;
          const perDay = Math.ceil(needed / daysLeft);
          warnings.push({
            id: `goal_risk_${goal.id}`,
            type: "GOAL_AT_RISK",
            title: `Target "${goal.name}" Terancam`,
            message: `Deadline ${daysLeft} hari lagi, baru ${Math.round(progress * 100)}% tercapai. Butuh Rp ${perDay.toLocaleString("id-ID")}/hari.`,
            severity: "high",
            actionLabel: "Lihat Target",
            actionRoute: "/(tabs)/rencanakan",
          });
        }
      });

    // RULE 6: Pengeluaran minggu ini mendekati/melewati batas mingguan
    if (weeklyExpenseLimit > 0) {
      const now = new Date();
      const day = now.getDay(); // Min=0, Sen=1, ...
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const nextMonday = new Date(monday);
      nextMonday.setDate(nextMonday.getDate() + 7);

      const weeklyExpense = transactions
        .filter((tx) => {
          if (tx.type !== "expense") return false;
          const d = new Date(tx.date);
          return d >= monday && d < nextMonday;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      const usagePct = (weeklyExpense / weeklyExpenseLimit) * 100;
      if (usagePct >= 100) {
        warnings.push({
          id: "weekly_limit_exceeded",
          type: "WEEKLY_LIMIT_EXCEEDED",
          title: "Batas Mingguan Terlewati",
          message: `Pengeluaran minggu ini Rp ${weeklyExpense.toLocaleString("id-ID")} dari batas Rp ${weeklyExpenseLimit.toLocaleString("id-ID")}.`,
          severity: "high",
          actionLabel: "Lihat Evaluasi",
          actionRoute: "/(tabs)/evaluasi",
        });
      } else if (usagePct >= 80) {
        warnings.push({
          id: "weekly_limit_near",
          type: "WEEKLY_LIMIT_NEAR",
          title: "Batas Mingguan Hampir Habis",
          message: `Pengeluaran minggu ini sudah ${Math.round(usagePct)}% dari batas mingguanmu.`,
          severity: "medium",
          actionLabel: "Cek Pengeluaran",
          actionRoute: "/(tabs)/evaluasi",
        });
      }
    }

    // RULE 7: Belum ada catatan tabungan (Tabungan / Menabung) bulan ini
    if (savingThisMonth.length === 0) {
      warnings.push({
        id: "no_saving",
        type: "NO_SAVING",
        title: "Belum Menabung Bulan Ini",
        message:
          "Kamu belum menabung bulan ini. Yuk sisihkan sebagian uang sakumu! 💰",
        severity: "medium",
        actionLabel: "Catat Tabungan",
        actionRoute: "/(tabs)/catat",
      });
    }

    // Urutkan: high → medium → low
    const order: Record<Warning["severity"], number> = { high: 0, medium: 1, low: 2 };
    return warnings.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [goals, summary, transactions, weeklyExpenseLimit]);
}

