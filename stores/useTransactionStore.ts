import { create } from "zustand";

import {
  summarizeTransactions,
  transactionService,
  type Transaction as ServiceTransaction,
  type TransactionType,
  type UpdateTransactionInput,
} from "@/services/transactionService";

export type Transaction = ServiceTransaction;

export type TransactionSummary = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  totalSaving: number;
  byCategory: { category: string; total: number }[];
};

type TransactionState = {
  transactions: Transaction[];
  summary: TransactionSummary | null;
  /** Sisa saldo semua bulan sebelum selectedMonth/selectedYear. */
  carryOver: number;
  isLoading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
  loadTransactions: () => Promise<void>;
  /** Satu fetch: isi list + summary (lebih cepat dari loadTransactions + loadSummary). */
  loadMonthData: () => Promise<void>;
  addTransaction: (data: {
    type: TransactionType;
    amount: number;
    category: string;
    note: string;
    date: string | Date;
  }) => Promise<void>;
  editTransaction: (id: string, data: UpdateTransactionInput) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  /** @deprecated gunakan removeTransaction */
  deleteTransaction: (id: string) => Promise<void>;
  resetTransactions: () => Promise<void>;
  loadSummary: () => Promise<void>;
  setSelectedPeriod: (month: number, year: number) => Promise<void>;
  /** Pindah ke bulan berjalan jika app terbuka melewati pergantian bulan. */
  ensureCurrentMonth: () => Promise<void>;
  resetState: () => void;
};

const getNowMonth = () => new Date().getMonth() + 1;
const getNowYear = () => new Date().getFullYear();

async function loadPeriod(month: number, year: number) {
  const [list, carryOver] = await Promise.all([
    transactionService.getTransactions({ month, year }),
    transactionService.getCarryOverBalance(month, year),
  ]);
  return { list, summary: summarizeTransactions(list), carryOver };
}

async function reloadMonthState(get: () => TransactionState) {
  const { selectedMonth, selectedYear } = get();
  return loadPeriod(selectedMonth, selectedYear);
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  summary: null,
  carryOver: 0,
  isLoading: false,
  error: null,
  selectedMonth: getNowMonth(),
  selectedYear: getNowYear(),

  loadTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { list, summary, carryOver } = await reloadMonthState(get);
      set({ transactions: list, summary, carryOver, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal memuat transaksi.",
      });
    }
  },

  loadMonthData: async () => {
    set({ isLoading: true, error: null });
    try {
      const { list, summary, carryOver } = await reloadMonthState(get);
      set({ transactions: list, summary, carryOver, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal memuat transaksi.",
      });
    }
  },

  addTransaction: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await transactionService.addTransaction(data);
      const { list, summary, carryOver } = await reloadMonthState(get);
      set({ transactions: list, summary, carryOver, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal menyimpan transaksi.",
      });
      throw error;
    }
  },

  editTransaction: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await transactionService.updateTransaction(id, data);
      const { list, summary, carryOver } = await reloadMonthState(get);
      set({ transactions: list, summary, carryOver, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal memperbarui transaksi.",
      });
      throw error;
    }
  },

  removeTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const ok = await transactionService.deleteTransaction(id);
      if (!ok) throw new Error("Transaksi tidak ditemukan atau tidak bisa dihapus.");

      const { list, summary, carryOver } = await reloadMonthState(get);
      set({ transactions: list, summary, carryOver, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal menghapus transaksi.",
      });
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    await get().removeTransaction(id);
  },

  resetTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      await transactionService.resetAllTransactions();
      set({ transactions: [], summary: null, carryOver: 0, isLoading: false, error: null });
      const { list, summary, carryOver } = await reloadMonthState(get);
      set({ transactions: list, summary, carryOver, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal mereset transaksi.",
      });
      throw error;
    }
  },

  loadSummary: async () => {
    try {
      // List store selalu mewakili selectedMonth/Year setelah load — hitung lokal, tanpa query ekstra.
      set({ summary: summarizeTransactions(get().transactions), error: null });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Gagal memuat ringkasan transaksi.",
      });
    }
  },

  setSelectedPeriod: async (month, year) => {
    set({ selectedMonth: month, selectedYear: year, error: null, isLoading: true });
    try {
      const { list, summary, carryOver } = await loadPeriod(month, year);
      set({ transactions: list, summary, carryOver, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal memuat transaksi untuk periode tersebut.",
      });
    }
  },

  ensureCurrentMonth: async () => {
    const month = getNowMonth();
    const year = getNowYear();
    const { selectedMonth, selectedYear } = get();
    if (selectedMonth === month && selectedYear === year) return;
    await get().setSelectedPeriod(month, year);
  },

  resetState: () => {
    set({
      transactions: [],
      summary: null,
      carryOver: 0,
      isLoading: false,
      error: null,
      selectedMonth: getNowMonth(),
      selectedYear: getNowYear(),
    });
  },
}));
