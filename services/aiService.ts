import { FunctionsHttpError } from "@supabase/supabase-js";

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
  const { summary, transactions } = useTransactionStore.getState();

  const financialContext = {
    total_pemasukan: summary?.totalIncome ?? 0,
    total_pengeluaran: summary?.totalExpense ?? 0,
    sisa: (summary?.totalIncome ?? 0) - (summary?.totalExpense ?? 0),
    persentase_tabungan: summary?.totalIncome
      ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)
      : 0,
    pengeluaran_per_kategori: summary?.byCategory ?? [],
    jumlah_transaksi: transactions.length,
  };

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Edge Function gateway pada project ini menerima publishable key.
  const apiKey = publishableKey ?? anonKey;
  if (!supabaseUrl || !apiKey) {
    throw new Error("Supabase URL / API key belum diatur untuk memanggil Edge Function.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke("ai-chat", {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${session?.access_token ?? apiKey}`,
    },
    body: JSON.stringify({
      message: userMessage,
      financialContext,
      chatHistory: chatHistory.slice(-10),
    }),
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const details = await error.context.json();
        const detailMessage =
          typeof details?.error === "string"
            ? details.error
            : typeof details?.message === "string"
              ? details.message
              : error.message;
        throw new Error(detailMessage);
      } catch {
        throw new Error(error.message);
      }
    }
    throw new Error(error.message);
  }

  if (typeof data?.message !== "string" || !data.message.trim()) {
    throw new Error("AI response kosong.");
  }

  return data.message;
}
