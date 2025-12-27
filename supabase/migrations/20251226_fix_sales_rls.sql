-- Allow agents to view transactions that generated commissions for them
DROP POLICY IF EXISTS "Agent read commission transactions" ON public.transactions;
CREATE POLICY "Agent read commission transactions"
ON public.transactions FOR SELECT
USING (
  id IN (
    SELECT source_transaction_id FROM public.commissions
    WHERE agent_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS commissions_agent_id_idx ON public.commissions(agent_id);
CREATE INDEX IF NOT EXISTS commissions_source_transaction_id_idx ON public.commissions(source_transaction_id);
