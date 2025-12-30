-- Allow agents to see transactions that earned them a commission
create policy "Agent read commission transactions" on public.transactions
for select
using (
  exists (
    select 1 from public.commissions
    where source_transaction_id = public.transactions.id
    and agent_id = auth.uid()
  )
);
