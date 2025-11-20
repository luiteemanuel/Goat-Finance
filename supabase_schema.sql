-- Enable RLS (Row Level Security) is recommended, but for simplicity we will start with basic tables.
-- You can run this in the Supabase SQL Editor.

-- 1. Transactions Table
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  description text not null,
  amount numeric not null,
  type text not null, -- 'INCOME' or 'EXPENSE'
  category_id text,
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Cards Table
create table cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  last_digits text,
  color text,
  limit_amount numeric,
  current_invoice numeric default 0,
  due_date text,
  closing_date text
);

-- 3. Goals Table
create table goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline date,
  icon text
);

-- 4. Categories Table (Optional, if user creates custom ones)
create table categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  icon text,
  color text,
  budget_limit numeric
);

-- Enable Row Level Security (RLS) so users only see their own data
alter table transactions enable row level security;
alter table cards enable row level security;
alter table goals enable row level security;
alter table categories enable row level security;

-- Create Policies
create policy "Users can view their own transactions" on transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own transactions" on transactions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own transactions" on transactions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own transactions" on transactions
  for delete using (auth.uid() = user_id);

-- Repeat for other tables
create policy "Users can view their own cards" on cards for select using (auth.uid() = user_id);
create policy "Users can insert their own cards" on cards for insert with check (auth.uid() = user_id);
create policy "Users can update their own cards" on cards for update using (auth.uid() = user_id);
create policy "Users can delete their own cards" on cards for delete using (auth.uid() = user_id);

create policy "Users can view their own goals" on goals for select using (auth.uid() = user_id);
create policy "Users can insert their own goals" on goals for insert with check (auth.uid() = user_id);
create policy "Users can update their own goals" on goals for update using (auth.uid() = user_id);
create policy "Users can delete their own goals" on goals for delete using (auth.uid() = user_id);

create policy "Users can view their own categories" on categories for select using (auth.uid() = user_id);
create policy "Users can insert their own categories" on categories for insert with check (auth.uid() = user_id);
create policy "Users can update their own categories" on categories for update using (auth.uid() = user_id);
create policy "Users can delete their own categories" on categories for delete using (auth.uid() = user_id);
