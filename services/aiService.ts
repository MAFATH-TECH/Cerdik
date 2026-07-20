import { FunctionsHttpError } from "@supabase/supabase-js";
import { useGoalStore } from "../stores/useGoalStore";
import { supabase } from "./supabase";
import { useTransactionStore } from "../stores/useTransactionStore";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendMessageToAI(
  userMessage: string,
  chatHistory: ChatMessage[],
): Promise<string> {
  const {
    summary,
    transactions,
    selectedMonth,
    selectedYear,
  } = useTransactionStore.getState();

  const { goals } = useGoalStore.getState();

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const balance = totalIncome - totalExpense;

  const topExpenseCategory =
    summary?.byCategory?.length
      ? [...summary.byCategory].sort((a, b) => b.total - a.total)[0]
      : null;

  // Konteks dipadatkan agar hemat token input per request.
  const financialContext = {
    periode: {
      bulan: selectedMonth,
      tahun: selectedYear,
    },
  
    kondisi: {
      pemasukan: totalIncome,
      pengeluaran: totalExpense,
      saldo: balance,
      rasioTabungan:
        totalIncome > 0
          ? Math.round((balance / totalIncome) * 100)
          : 0,
      status: balance >= 0 ? "Surplus" : "Defisit",
    },
  
    kategori: (summary?.byCategory ?? [])
      .slice()
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((c) => ({
        nama: c.category,
        total: c.total,
      })),
  
    transaksiTerakhir: transactions
      .slice()
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      )
      .slice(0, 3)
      .map((tx) => ({
        tipe: tx.type,
        kategori: tx.category,
        jumlah: tx.amount,
      })),
  
    goals: goals
      .slice(0, 3)
      .map((goal) => ({
        nama: goal.name,
        target: goal.targetAmount,
        saldo: goal.currentAmount,
        progres:
          goal.targetAmount > 0
            ? Math.min(
                100,
                Math.round(
                  (goal.currentAmount /
                    goal.targetAmount) *
                    100,
                ),
              )
            : 0,
      })),
  };

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Edge Function gateway pada project ini menerima publishable key.
  const apiKey = publishableKey ?? anonKey;
  if (!supabaseUrl || !apiKey) {
    throw new Error(
      "Supabase URL / API key belum diatur untuk memanggil Edge Function.",
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Jangan kirim ulang pesan user yang sedang diproses (sudah ada di `message`).
  const priorHistory = chatHistory.filter((chat, index) => {
    if (
      index === chatHistory.length - 1 &&
      chat.role === "user" &&
      chat.content === userMessage
    ) {
      return false;
    }
    return true;
  });

  const { data, error } = await supabase.functions.invoke("ai-chat", {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${session?.access_token ?? apiKey}`,
    },
    body: {
      message: userMessage,
      financialContext,
      chatHistory: priorHistory.slice(-4),
    },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      let detailMessage = error.message;
      try {
        const details = await error.context.json();
        if (typeof details?.error === "string") {
          detailMessage = details.error;
        } else if (typeof details?.message === "string") {
          detailMessage = details.message;
        }
      } catch {
        // biarkan detailMessage = error.message
      }
      throw new Error(detailMessage);
    }
    throw new Error(error.message);
  }

  if (typeof data?.message !== "string" || !data.message.trim()) {
    throw new Error("AI response kosong.");
  }

  return data.message.trim();
}
