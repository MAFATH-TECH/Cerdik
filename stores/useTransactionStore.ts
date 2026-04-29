import { create } from "zustand";

import { transactionService, type Transaction as ServiceTransaction, type TransactionType } from "@/services/transactionService";

export type Transaction = ServiceTransaction;

export type TransactionSummary = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  byCategory: { category: string; total: number }[];
};

type TransactionState = {
  transactions: Transaction[];
  summary: TransactionSummary | null;
  isLoading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
  loadTransactions: () => Promise<void>;
  addTransaction: (data: {
    type: TransactionType;
    amount: number;
    category: string;
    note: string;
    date: string | Date;
  }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loadSummary: () => Promise<void>;
  setSelectedPeriod: (month: number, year: number) => Promise<void>;
};

const getNowMonth = () => new Date().getMonth() + 1; // 1-12
const getNowYear = () => new Date().getFullYear();

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  summary: null,
  isLoading: false,
  error: null,
  selectedMonth: getNowMonth(),
  selectedYear: getNowYear(),

  loadTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { selectedMonth, selectedYear } = get();
      const list = await transactionService.getTransactions({ month: selectedMonth, year: selectedYear });
      set({ transactions: list, isLoading: false, error: null });
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

      const { selectedMonth, selectedYear } = get();
      const list = await transactionService.getTransactions({ month: selectedMonth, year: selectedYear });
      const summary = await transactionService.getTransactionSummary(selectedMonth, selectedYear);

      set({ transactions: list, summary, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal menyimpan transaksi.",
      });
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const ok = await transactionService.deleteTransaction(id);
      if (!ok) throw new Error("Transaksi tidak ditemukan atau tidak bisa dihapus.");

      const nextList = get().transactions.filter((t) => t.id !== id);
      const { selectedMonth, selectedYear } = get();
      const summary = await transactionService.getTransactionSummary(selectedMonth, selectedYear);

      set({ transactions: nextList, summary, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal menghapus transaksi.",
      });
      throw error;
    }
  },

  loadSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const { selectedMonth, selectedYear } = get();
      const nextSummary = await transactionService.getTransactionSummary(selectedMonth, selectedYear);
      set({ summary: nextSummary, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal memuat ringkasan transaksi.",
      });
    }
  },

  setSelectedPeriod: async (month, year) => {
    set({ selectedMonth: month, selectedYear: year, error: null, isLoading: true });
    try {
      await get().loadTransactions();
      await get().loadSummary();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Gagal memuat transaksi untuk periode tersebut.",
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));
