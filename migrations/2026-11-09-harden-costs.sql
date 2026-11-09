-- Run once in the Supabase SQL editor. Safe to re-run.
drop policy if exists "Users can update their own costs" on public.costs;
create policy "Users can update their own costs"
  on public.costs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.costs drop constraint if exists costs_amount_positive;
alter table public.costs add constraint costs_amount_positive check (amount > 0) not valid;

alter table public.costs drop constraint if exists costs_notes_length;
alter table public.costs add constraint costs_notes_length check (notes is null or char_length(notes) <= 500) not valid;

create index if not exists costs_user_date_idx on public.costs (user_id, date desc);
