import { supabase } from "@/services/supabase";

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO
};

export type AddTransactionInput = {
  type: TransactionType;
  amount: number;
  category: string;
  note?: string;
  date: string | Date;
};

const toDateOnly = (input: string | Date): string => {
  if (input instanceof Date) return input.toISOString().slice(0, 10);
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  // If ISO string: take the first 10 chars => YYYY-MM-DD
  return input.slice(0, 10);
};

const getAuthedUserId = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user?.id) throw new Error("Sesi login tidak ditemukan.");
  return user.id;
};

export const transactionService = {
  async addTransaction(data: AddTransactionInput): Promise<Transaction> {
    const userId = await getAuthedUserId();

    const payload = {
      user_id: userId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      note: data.note ?? null,
      date: toDateOnly(data.date),
    };

    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert(payload)
      .select("id, type, amount, category, note, date, created_at")
      .single();

    if (error) throw error;
    const mapped = inserted as any;
    return {
      id: mapped.id,
      type: mapped.type,
      amount: typeof mapped.amount === "number" ? mapped.amount : Number(mapped.amount),
      category: mapped.category,
      note: mapped.note ?? "",
      date: mapped.date,
      createdAt: mapped.created_at,
    };
  },

  async getTransactions(options: { month?: number; year?: number } = {}): Promise<Transaction[]> {
    const userId = await getAuthedUserId();

    const query = supabase
      .from("transactions")
      .select("id, type, amount, category, note, date, created_at")
      .eq("user_id", userId);

    if (typeof options.year === "number" && typeof options.month === "number") {
      const start = new Date(options.year, options.month - 1, 1);
      const end = new Date(options.year, options.month, 1);
      query.gte("date", start.toISOString().slice(0, 10)).lt("date", end.toISOString().slice(0, 10));
    }

    query.order("date", { ascending: false }).order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      amount: typeof row.amount === "number" ? row.amount : Number(row.amount),
      category: row.category,
      note: row.note ?? "",
      date: row.date,
      createdAt: row.created_at,
    }));
  },

  async getTransactionsInRange(options: { from: Date; to: Date }): Promise<Transaction[]> {
    const userId = await getAuthedUserId();

    // `date` kolom adalah tipe DATE di Postgres, jadi kita pakai string YYYY-MM-DD.
    const toDateOnlyLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const fromStr = toDateOnlyLocal(options.from);
    const toStr = toDateOnlyLocal(options.to);

    const { data, error } = await supabase
      .from("transactions")
      .select("id, type, amount, category, note, date, created_at")
      .eq("user_id", userId)
      .gte("date", fromStr)
      .lt("date", toStr)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      amount: typeof row.amount === "number" ? row.amount : Number(row.amount),
      category: row.category,
      note: row.note ?? "",
      date: row.date,
      createdAt: row.created_at,
    }));
  },

  async getTransactionSummary(month: number, year: number): Promise<{
    totalIncome: number;
    totalExpense: number;
    net: number;
    byCategory: { category: string; total: number }[];
  }> {
    const userId = await getAuthedUserId();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("transactions")
      .select("type, amount, category, date")
      .eq("user_id", userId)
      .gte("date", startStr)
      .lt("date", endStr);

    if (error) throw error;

    const rows = (data ?? []) as any[];

    let totalIncome = 0;
    let totalExpense = 0;
    const byCategoryMap = new Map<string, number>();

    for (const row of rows) {
      const amount = typeof row.amount === "number" ? row.amount : Number(row.amount);
      if (row.type === "income") {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        const category = row.category ?? "Lainnya";
        byCategoryMap.set(category, (byCategoryMap.get(category) ?? 0) + amount);
      }
    }

    const byCategory = [...byCategoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => ({ category, total }));

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      byCategory,
    };
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const userId = await getAuthedUserId();

    const { data, error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");

    if (error) throw error;
    return Array.isArray(data) ? data.length > 0 : false;
  },

  async getRecentTransactions(limit: number = 5): Promise<Transaction[]> {
    const userId = await getAuthedUserId();

    const { data, error } = await supabase
      .from("transactions")
      .select("id, type, amount, category, note, date, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      amount: typeof row.amount === "number" ? row.amount : Number(row.amount),
      category: row.category,
      note: row.note ?? "",
      date: row.date,
      createdAt: row.created_at,
    }));
  },
};

