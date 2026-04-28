import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GOAL_STORAGE_KEY = "cerdik_goals_v1";

export type Goal = {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  note: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
};

type GoalState = {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  loadGoals: () => Promise<void>;
  addGoal: (payload: Omit<Goal, "id" | "createdAt" | "isCompleted" | "currentAmount">) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  addSaving: (goalId: string, amount: number) => Promise<void>;
  completeGoal: (goalId: string) => Promise<void>;
};

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  loadGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const rawGoals = await AsyncStorage.getItem(GOAL_STORAGE_KEY);
      if (!rawGoals) {
        set({ goals: [], isLoading: false, error: null });
        return;
      }
      const parsedGoals = JSON.parse(rawGoals) as Goal[];
      set({ goals: parsedGoals, isLoading: false, error: null });
    } catch {
      set({ goals: [], isLoading: false, error: "Gagal memuat goal." });
    }
  },

  addGoal: async (payload) => {
    set({ isLoading: true, error: null });
    const nextGoal: Goal = {
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
      currentAmount: 0,
      isCompleted: false,
      ...payload,
    };

    try {
      const nextGoals = [nextGoal, ...get().goals];
      await AsyncStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(nextGoals));
      set({ goals: nextGoals, isLoading: false, error: null });
    } catch {
      set({ isLoading: false, error: "Gagal menyimpan goal." });
    }
  },

  updateGoal: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const nextGoals = get().goals.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal));
      await AsyncStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(nextGoals));
      set({ goals: nextGoals, isLoading: false, error: null });
    } catch {
      set({ isLoading: false, error: "Gagal memperbarui goal." });
    }
  },

  addSaving: async (goalId, amount) => {
    set({ isLoading: true, error: null });
    try {
      const nextGoals = get().goals.map((goal) => {
        if (goal.id !== goalId) return goal;
        const nextAmount = goal.currentAmount + amount;
        const completed = nextAmount >= goal.targetAmount;
        return {
          ...goal,
          currentAmount: nextAmount,
          isCompleted: completed,
          completedAt: completed ? new Date().toISOString() : goal.completedAt,
        };
      });

      await AsyncStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(nextGoals));
      set({ goals: nextGoals, isLoading: false, error: null });
    } catch {
      set({ isLoading: false, error: "Gagal menambah tabungan." });
    }
  },

  completeGoal: async (goalId) => {
    set({ isLoading: true, error: null });
    try {
      const nextGoals = get().goals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              isCompleted: true,
              currentAmount: Math.max(goal.currentAmount, goal.targetAmount),
              completedAt: goal.completedAt ?? new Date().toISOString(),
            }
          : goal,
      );
      await AsyncStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(nextGoals));
      set({ goals: nextGoals, isLoading: false, error: null });
    } catch {
      set({ isLoading: false, error: "Gagal menyelesaikan goal." });
    }
  },
}));
