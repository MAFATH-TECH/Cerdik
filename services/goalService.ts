import { supabase } from "@/services/supabase";

export type Goal = {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO
  note?: string | null;
  isCompleted: boolean;
  createdAt: string; // ISO
  completedAt?: string | null;
};

export type CreateGoalInput = {
  name: string;
  emoji: string;
  target_amount: number;
  deadline: string | Date;
  note?: string;
};

export type AddContributionResult = {
  goal: Goal;
  isCompleted: boolean;
};

export const goalService = {
  async createGoal(data: CreateGoalInput): Promise<Goal> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user?.id) throw new Error("Sesi login tidak ditemukan.");

    const deadlineIso = data.deadline instanceof Date ? data.deadline.toISOString() : data.deadline;

    const payload = {
      user_id: user.id,
      name: data.name,
      emoji: data.emoji,
      target_amount: data.target_amount,
      deadline: deadlineIso.slice(0, 10), // postgres type date
      note: data.note ?? null,
    };

    const { data: inserted, error } = await supabase
      .from("goals")
      .insert(payload)
      .select(
        "id, name, emoji, target_amount, current_amount, deadline, note, is_completed, created_at, completed_at",
      )
      .single();

    if (error) throw error;

    return mapGoal(inserted);
  },

  async getGoals(includeCompleted = false): Promise<Goal[]> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user?.id) throw new Error("Sesi login tidak ditemukan.");

    const query = supabase
      .from("goals")
      .select("id, name, emoji, target_amount, current_amount, deadline, note, is_completed, created_at, completed_at")
      .eq("user_id", user.id);

    if (!includeCompleted) {
      query.eq("is_completed", false);
    }

    query.order("deadline", { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map(mapGoal);
  },

  async addContribution(goalId: string, amount: number, note?: string): Promise<AddContributionResult> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user?.id) throw new Error("Sesi login tidak ditemukan.");

    // 1) Fetch current goal
    const { data: goalRow, error: goalError } = await supabase
      .from("goals")
      .select(
        "id, name, emoji, target_amount, current_amount, deadline, note, is_completed, created_at, completed_at, user_id",
      )
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();
    if (goalError) throw goalError;

    const currentAmount = Number((goalRow as any).current_amount);
    const nextAmount = currentAmount + amount;

    // 2) Insert contribution
    const { error: contribError } = await supabase.from("goal_contributions").insert({
      goal_id: goalId,
      user_id: user.id,
      amount,
      note: note ?? null,
    });
    if (contribError) throw contribError;

    const isCompleted = nextAmount >= Number((goalRow as any).target_amount);
    const nowIso = new Date().toISOString();

    // 3) Update goal (current_amount + completion flags)
    const { data: updatedGoal, error: updateError } = await supabase
      .from("goals")
      .update({
        current_amount: nextAmount,
        is_completed: isCompleted,
        completed_at: isCompleted ? nowIso : null,
      })
      .eq("id", goalId)
      .eq("user_id", user.id)
      .select("id, name, emoji, target_amount, current_amount, deadline, note, is_completed, created_at, completed_at")
      .single();

    if (updateError) throw updateError;
    const mappedGoal = mapGoal(updatedGoal);

    return { goal: mappedGoal, isCompleted };
  },

  async deleteGoal(id: string): Promise<boolean> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user?.id) throw new Error("Sesi login tidak ditemukan.");

    const { error, data } = await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id).select("id");
    if (error) throw error;

    return Array.isArray(data) ? data.length > 0 : false;
  },

  getGoalProgress(goal: Goal): { percentage: number; daysLeft: number; dailyNeeded: number } {
    const percentage = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;

    const today = new Date();
    const deadlineDate = new Date(goal.deadline);
    const diffMs = deadlineDate.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (goal.isCompleted || daysLeft === 0) {
      return { percentage, daysLeft, dailyNeeded: 0 };
    }

    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const dailyNeeded = remaining / daysLeft;

    return { percentage, daysLeft, dailyNeeded };
  },
};

function mapGoal(row: any): Goal {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    targetAmount: typeof row.target_amount === "number" ? row.target_amount : Number(row.target_amount),
    currentAmount: typeof row.current_amount === "number" ? row.current_amount : Number(row.current_amount),
    deadline: row.deadline instanceof Date ? row.deadline.toISOString() : String(row.deadline),
    note: row.note,
    isCompleted: Boolean(row.is_completed),
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

