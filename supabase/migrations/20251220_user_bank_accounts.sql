-- Create table for storing user bank accounts
create table if not exists public.user_bank_accounts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    bank_name text not null,
    account_number text not null,
    account_name text not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    unique(user_id, bank_name, account_number)
);

-- RLS policies
alter table public.user_bank_accounts enable row level security;

create policy "Users can view their own bank accounts"
    on public.user_bank_accounts for select
    using (auth.uid() = user_id);

create policy "Users can insert their own bank accounts"
    on public.user_bank_accounts for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own bank accounts"
    on public.user_bank_accounts for delete
    using (auth.uid() = user_id);
