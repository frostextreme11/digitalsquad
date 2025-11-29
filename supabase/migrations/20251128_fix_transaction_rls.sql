-- Allow authenticated users to insert their own transactions
create policy "Authenticated users insert transactions" 
on public.transactions 
for insert 
with check (auth.uid() = user_id);
