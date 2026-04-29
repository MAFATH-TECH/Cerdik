-- =============================================
-- CERDIK APP - Database Schema (追加 tables)
-- NOTE: Table `public.profiles` + fungsi auth/RPC sudah dibuat di migration sebelumnya.
-- File ini menambahkan tabel yang masih belum ada (transactions, goals, dsb) beserta RLS.
-- =============================================

create extension if not exists pgcrypto;

-- Tabel transaksi
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(15,2) not null check (amount > 0),
  category text not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Tabel goals/target tabungan
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  emoji text default '🎯',
  target_amount numeric(15,2) not null check (target_amount > 0),
  current_amount numeric(15,2) default 0,
  deadline date not null,
  note text,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Tabel kontribusi goal
create table if not exists public.goal_contributions (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references public.goals(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(15,2) not null check (amount > 0),
  note text,
  created_at timestamptz default now()
);

-- Tabel warning yang di-dismiss
create table if not exists public.dismissed_warnings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  warning_type text not null,
  dismissed_at timestamptz default now()
);

-- Tabel riwayat chat AI
create table if not exists public.ai_chat_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.dismissed_warnings enable row level security;
alter table public.ai_chat_history enable row level security;

-- Transactions
drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Users manage own transactions"
  on public.transactions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Goals
drop policy if exists "Users manage own goals" on public.goals;
create policy "Users manage own goals"
  on public.goals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Goal contributions
drop policy if exists "Users manage own contributions" on public.goal_contributions;
create policy "Users manage own contributions"
  on public.goal_contributions
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.goals g
      where g.id = goal_id
        and g.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.goals g
      where g.id = goal_id
        and g.user_id = auth.uid()
    )
  );

-- Dismissed warnings
drop policy if exists "Users manage own dismissed warnings" on public.dismissed_warnings;
create policy "Users manage own dismissed warnings"
  on public.dismissed_warnings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- AI chat history
drop policy if exists "Users manage own chat history" on public.ai_chat_history;
create policy "Users manage own chat history"
  on public.ai_chat_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================
create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_goals_user on public.goals(user_id, is_completed);
create index if not exists idx_contributions_goal on public.goal_contributions(goal_id, created_at desc);

