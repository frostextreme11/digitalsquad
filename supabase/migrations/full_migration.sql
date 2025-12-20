-- COMBINED MIGRATION SCRIPT
-- Generated from existing migration files

-- ==========================================
-- 1. Initial Schema
-- ==========================================

-- Enums
create type user_role as enum ('agent', 'admin');
create type transaction_type as enum ('registration', 'product_purchase');
create type status_type as enum ('pending', 'success', 'failed', 'cancelled');

-- Profiles (Users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  phone text,
  role user_role default 'agent',
  affiliate_code text unique,
  referred_by uuid references public.profiles(id),
  balance decimal default 0,
  created_at timestamptz default now()
);

-- Leads (Pre-registration)
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  full_name text,
  email text,
  phone text,
  referred_by_code text,
  status status_type default 'pending',
  created_at timestamptz default now()
);

-- Products
create table public.products (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price decimal not null,
  thumbnail_url text,
  file_url text,
  is_active boolean default true
);

-- Transactions
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  lead_id uuid references public.leads(id),
  midtrans_id text unique,
  amount decimal not null,
  type transaction_type,
  status status_type default 'pending',
  created_at timestamptz default now()
);

-- Commissions
create table public.commissions (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references public.profiles(id),
  source_transaction_id uuid references public.transactions(id),
  amount decimal not null,
  created_at timestamptz default now()
);

-- Withdrawals
create table public.withdrawals (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references public.profiles(id),
  amount decimal not null,
  bank_details jsonb,
  status status_type default 'pending',
  created_at timestamptz default now()
);

-- Visits (Simple Analytics)
create table public.visits (
  id uuid default gen_random_uuid() primary key,
  affiliate_code text,
  visitor_ip text,
  user_agent text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.commissions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.visits enable row level security;

-- Policies

-- Profiles: Public read for name/code (needed for referral check), Owner write
create policy "Public read profiles" on public.profiles for select using (true);
create policy "Owner update profiles" on public.profiles for update using (auth.uid() = id);

-- Leads: Public insert (anyone can be a lead), Admin read
create policy "Public insert leads" on public.leads for insert with check (true);
create policy "Admin read leads" on public.leads for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Products: Public read, Admin write
create policy "Public read products" on public.products for select using (true);
create policy "Admin write products" on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Transactions: Owner read, Admin read
create policy "Owner read transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Admin read transactions" on public.transactions for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Commissions: Owner read, Admin read
create policy "Owner read commissions" on public.commissions for select using (auth.uid() = agent_id);
create policy "Admin read commissions" on public.commissions for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Withdrawals: Owner read/insert, Admin all
create policy "Owner read withdrawals" on public.withdrawals for select using (auth.uid() = agent_id);
create policy "Owner insert withdrawals" on public.withdrawals for insert with check (auth.uid() = agent_id);
create policy "Admin all withdrawals" on public.withdrawals for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Visits: Public insert
create policy "Public insert visits" on public.visits for insert with check (true);
create policy "Admin read visits" on public.visits for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Agent read visits" on public.visits for select using (
  auth.uid() in (select id from public.profiles where affiliate_code = visits.affiliate_code)
);

-- ==========================================
-- 2. Auth Trigger
-- ==========================================

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', 'agent');
  return new;
end;
$$;

-- Trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 3. RPC Functions
-- ==========================================

create or replace function increment_balance(user_id uuid, amount decimal)
returns void as $$
begin
  update public.profiles
  set balance = balance + amount
  where id = user_id;
end;
$$ language plpgsql security definer;

-- ==========================================
-- 4. Fix Transaction RLS
-- ==========================================

-- Allow authenticated users to insert their own transactions
create policy "Authenticated users insert transactions" 
on public.transactions 
for insert 
with check (auth.uid() = user_id);

-- ==========================================
-- 5. Admin Access
-- ==========================================

-- Grant admin access to specific email
update public.profiles
set role = 'admin'
where email = 'irfankurniawan203@gmail.com'; -- Replace with your email if different

-- Or if you want to be safe, create a function to make admin
create or replace function make_admin(target_email text)
returns void as $$
begin
  update public.profiles
  set role = 'admin'
  where email = target_email;
end;
$$ language plpgsql security definer;
