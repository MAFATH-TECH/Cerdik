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

export type TransactionSummaryResult = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  totalSaving: number;
  byCategory: { category: string; total: number }[];
};

/** Hitung ringkasan dari daftar transaksi (hindari query ganda ke Supabase). */
export function summarizeTransactions(
  rows: Array<{ type: TransactionType; amount: number; category: string }>,
): TransactionSummaryResult {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalSaving = 0;
  const byCategoryMap = new Map<string, number>();

  for (const row of rows) {
    const amount = typeof row.amount === "number" ? row.amount : Number(row.amount);
    const category = row.category ?? "Lainnya";

    if (category === "Tabungan" || category === "Menabung") {
      totalSaving += amount;
    }

    if (row.type === "income") {
      totalIncome += amount;
    } else {
      totalExpense += amount;
      if (category !== "Menabung") {
        byCategoryMap.set(category, (byCategoryMap.get(category) ?? 0) + amount);
      }
    }
  }

  const byCategory = [...byCategoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => ({ category: cat, total }));

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    totalSaving,
    byCategory,
  };
}

function mapTransactionRow(row: any): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: typeof row.amount === "number" ? row.amount : Number(row.amount),
    category: row.category,
    note: row.note ?? "",
    date: row.date,
    createdAt: row.created_at,
  };
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Batas bulan sebagai string YYYY-MM-DD (kolom `date` bertipe DATE; hindari toISOString yang bergeser zona waktu). */
export function monthBounds(month: number, year: number): { start: string; end: string } {
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return { start: `${year}-${pad2(month)}-01`, end: `${nextYear}-${pad2(nextMonth)}-01` };
}

export type MonthlyBalance = {
  year: number;
  month: number; // 1-12
  opening: number;
  income: number;
  expense: number;
  closing: number;
};

const PAGE_SIZE = 1000;

/** Ambil semua baris (Supabase membatasi 1000 baris per query) lewat paging. */
async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

/** Susun riwayat saldo per bulan, dari bulan transaksi pertama sampai bulan berjalan (terbaru di awal). */
export function buildMonthlyBalances(
  rows: { date: string; type: TransactionType; amount: number }[],
  nowYear: number,
  nowMonth: number,
): MonthlyBalance[] {
  if (rows.length === 0) return [];

  const perMonth = new Map<string, { income: number; expense: number }>();
  let firstKey = rows[0].date.slice(0, 7);
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    if (key < firstKey) firstKey = key;
    const entry = perMonth.get(key) ?? { income: 0, expense: 0 };
    const amount = typeof row.amount === "number" ? row.amount : Number(row.amount);
    if (row.type === "income") entry.income += amount;
    else entry.expense += amount;
    perMonth.set(key, entry);
  }

  let year = Number(firstKey.slice(0, 4));
  let month = Number(firstKey.slice(5, 7));
  const result: MonthlyBalance[] = [];
  let opening = 0;

  while (year < nowYear || (year === nowYear && month <= nowMonth)) {
    const entry = perMonth.get(`${year}-${pad2(month)}`) ?? { income: 0, expense: 0 };
    const closing = opening + entry.income - entry.expense;
    result.push({ year, month, opening, income: entry.income, expense: entry.expense, closing });
    opening = closing;
    if (month === 12) {
      year += 1;
      month = 1;
    } else {
      month += 1;
    }
  }

  return result.reverse();
}

export type UpdateTransactionInput = {
  type: TransactionType;
  amount: number;
  category: string;
  note?: string;
  date: string;
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
    return mapTransactionRow(inserted);
  },

  async getTransactionById(id: string): Promise<Transaction | null> {
    const userId = await getAuthedUserId();

    const { data, error } = await supabase
      .from("transactions")
      .select("id, type, amount, category, note, date, created_at")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapTransactionRow(data);
  },

  async updateTransaction(id: string, data: UpdateTransactionInput): Promise<Transaction> {
    const userId = await getAuthedUserId();

    const payload = {
      type: data.type,
      amount: data.amount,
      category: data.category,
      note: data.note ?? null,
      date: toDateOnly(data.date),
    };

    const { data: updated, error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, type, amount, category, note, date, created_at")
      .single();

    if (error) throw error;
    return mapTransactionRow(updated);
  },

  async getTransactions(options: { month?: number; year?: number } = {}): Promise<Transaction[]> {
    const userId = await getAuthedUserId();

    const query = supabase
      .from("transactions")
      .select("id, type, amount, category, note, date, created_at")
      .eq("user_id", userId);

    if (typeof options.year === "number" && typeof options.month === "number") {
      const { start, end } = monthBounds(options.month, options.year);
      query.gte("date", start).lt("date", end);
    }

    query.order("date", { ascending: false }).order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map(mapTransactionRow);
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

    return (data ?? []).map(mapTransactionRow);
  },

  /** Sisa saldo (pemasukan − pengeluaran) dari semua transaksi sebelum awal bulan tersebut. */
  async getCarryOverBalance(month: number, year: number): Promise<number> {
    const userId = await getAuthedUserId();
    const { start } = monthBounds(month, year);

    const rows = await fetchAllRows<{ type: TransactionType; amount: number }>((from, to) =>
      supabase
        .from("transactions")
        .select("type, amount")
        .eq("user_id", userId)
        .lt("date", start)
        .order("id")
        .range(from, to),
    );

    return rows.reduce((sum, row) => {
      const amount = typeof row.amount === "number" ? row.amount : Number(row.amount);
      return row.type === "income" ? sum + amount : sum - amount;
    }, 0);
  },

  async getMonthlyBalances(): Promise<MonthlyBalance[]> {
    const userId = await getAuthedUserId();

    const rows = await fetchAllRows<{ date: string; type: TransactionType; amount: number }>((from, to) =>
      supabase
        .from("transactions")
        .select("date, type, amount")
        .eq("user_id", userId)
        .order("id")
        .range(from, to),
    );

    const now = new Date();
    return buildMonthlyBalances(rows, now.getFullYear(), now.getMonth() + 1);
  },

  async getTransactionSummary(month: number, year: number): Promise<TransactionSummaryResult> {
    const list = await transactionService.getTransactions({ month, year });
    return summarizeTransactions(list);
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

  async resetAllTransactions(): Promise<boolean> {
    const userId = await getAuthedUserId();

    const { error } = await supabase.from("transactions").delete().eq("user_id", userId);

    if (error) throw error;
    return true;
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

    return (data ?? []).map(mapTransactionRow);
  },
};

