-- Create costs table for tracking daily expenses
create table public.costs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(10,2) not null,
  category text not null,
  date date not null default current_date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint costs_amount_positive check (amount > 0),
  constraint costs_notes_length check (notes is null or char_length(notes) <= 500)
);

-- Enable Row Level Security (RLS)
alter table public.costs enable row level security;

-- Policy: Users can only view their own costs
create policy "Users can view their own costs"
  on public.costs for select
  using (auth.uid() = user_id);

-- Policy: Users can only insert their own costs
create policy "Users can insert their own costs"
  on public.costs for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only update their own costs
create policy "Users can update their own costs"
  on public.costs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can only delete their own costs
create policy "Users can delete their own costs"
  on public.costs for delete
  using (auth.uid() = user_id);

-- Index for listing a user's costs by date
create index costs_user_date_idx on public.costs (user_id, date desc);

-- Create income table: one row per salary or extra payment
create table public.income (
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

-- Enable Row Level Security (RLS): each user only ever sees and changes their own income
alter table public.income enable row level security;

create policy "Users can view their own income"
  on public.income for select
  using (auth.uid() = user_id);

create policy "Users can insert their own income"
  on public.income for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own income"
  on public.income for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own income"
  on public.income for delete
  using (auth.uid() = user_id);

-- Index for listing a user's income by date
create index income_user_date_idx on public.income (user_id, date desc);
