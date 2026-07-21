import { create } from "zustand";
import { Alert } from "react-native";

import { goalService, type Goal as ServiceGoal } from "@/services/goalService";

export type Goal = ServiceGoal;

type GoalState = {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  loadGoals: () => Promise<void>;
  createGoal: (data: { name: string; emoji: string; target_amount: number; deadline: string; note?: string }) => Promise<void>;
  updateGoal: (id: string, data: { name: string; emoji: string; target_amount: number; deadline: string; note?: string }) => Promise<void>;
  addContribution: (goalId: string, amount: number, note?: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  resetState: () => void;
};

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  loadGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const goals = await goalService.getGoals(true);
      set({ goals, isLoading: false, error: null });
    } catch (error) {
      set({
        goals: [],
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal memuat goal.",
      });
    }
  },

  createGoal: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await goalService.createGoal(data);
      await get().loadGoals();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal menyimpan goal.",
      });
      throw error;
    }
  },

  updateGoal: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await goalService.updateGoal(id, data);
      await get().loadGoals();

      if (updated.isCompleted) {
        Alert.alert("Selamat!", `Target ${updated.name} tercapai!`);
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal memperbarui goal.",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addContribution: async (goalId, amount, note) => {
    set({ isLoading: true, error: null });
    try {
      const { goal, isCompleted } = await goalService.addContribution(goalId, amount, note);
      await get().loadGoals();

      if (isCompleted) {
        Alert.alert("Selamat!", `Target ${goal.name} tercapai!`);
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal menambah tabungan.",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteGoal: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const ok = await goalService.deleteGoal(id);
      if (!ok) throw new Error("Goal tidak ditemukan.");
      await get().loadGoals();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal menghapus goal.",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetState: () => {
    set({
      goals: [],
      isLoading: false,
      error: null,
    });
  },
}));
