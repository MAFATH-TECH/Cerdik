import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TRANSACTION_STORAGE_KEY = "cerdik_transactions_v1";

export type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string;
  createdAt: string;
};

type TransactionState = {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  loadTransactions: () => Promise<void>;
  addTransaction: (payload: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsByMonth: (year: number, month: number) => Transaction[];
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  loadTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const rawTransactions = await AsyncStorage.getItem(TRANSACTION_STORAGE_KEY);
      if (!rawTransactions) {
        set({ transactions: [], isLoading: false, error: null });
        return;
      }

      const parsedTransactions = JSON.parse(rawTransactions) as Transaction[];
      set({ transactions: parsedTransactions, isLoading: false, error: null });
    } catch {
      set({ transactions: [], isLoading: false, error: "Gagal memuat transaksi." });
    }
  },

  addTransaction: async (payload) => {
    set({ isLoading: true, error: null });
    const nextTransaction: Transaction = {
      id: `trx-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...payload,
    };

    try {
      const nextTransactions = [nextTransaction, ...get().transactions];
      await AsyncStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(nextTransactions));
      set({ transactions: nextTransactions, isLoading: false, error: null });
    } catch {
      set({ isLoading: false, error: "Gagal menyimpan transaksi." });
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const nextTransactions = get().transactions.filter((item) => item.id !== id);
      await AsyncStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(nextTransactions));
      set({ transactions: nextTransactions, isLoading: false, error: null });
    } catch {
      set({ isLoading: false, error: "Gagal menghapus transaksi." });
    }
  },

  getTransactionsByMonth: (year, month) =>
    get().transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === year && txDate.getMonth() === month;
    }),
}));
