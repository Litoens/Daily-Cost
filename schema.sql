-- Create costs table for tracking daily expenses
create table public.costs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(10,2) not null check (amount >= 0),
  category text not null,
  date date not null default current_date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
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
  using (auth.uid() = user_id);

-- Policy: Users can only delete their own costs
create policy "Users can delete their own costs"
  on public.costs for delete
  using (auth.uid() = user_id);
