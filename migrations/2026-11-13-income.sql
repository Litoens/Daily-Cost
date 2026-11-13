-- Run once in the Supabase SQL editor. Safe to re-run.
-- Adds the income table: one row per salary or extra payment, private to each user.
create table if not exists public.income (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(10,2) not null,
  source text not null,
  date date not null default current_date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint income_amount_positive check (amount > 0),
  constraint income_source_valid check (source in ('Salary', 'Extra')),
  constraint income_notes_length check (notes is null or char_length(notes) <= 500)
);

-- Row Level Security: each user only ever sees and changes their own income.
alter table public.income enable row level security;

drop policy if exists "Users can view their own income" on public.income;
create policy "Users can view their own income"
  on public.income for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own income" on public.income;
create policy "Users can insert their own income"
  on public.income for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own income" on public.income;
create policy "Users can update their own income"
  on public.income for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own income" on public.income;
create policy "Users can delete their own income"
  on public.income for delete
  using (auth.uid() = user_id);

-- Index for listing a user's income by date
create index if not exists income_user_date_idx on public.income (user_id, date desc);
