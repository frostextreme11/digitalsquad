-- Fix RLS for Commissions and Transactions to ensure Agents can see their data

-- Commissions Table
ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for own commissions" ON "public"."commissions";

CREATE POLICY "Enable read access for own commissions" 
ON "public"."commissions" 
AS PERMISSIVE 
FOR SELECT 
TO "authenticated" 
USING (auth.uid() = agent_id);

-- Transactions Table (Ensure users see their own payment attempts)
ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for own transactions" ON "public"."transactions";

CREATE POLICY "Enable read access for own transactions" 
ON "public"."transactions" 
AS PERMISSIVE 
FOR SELECT 
TO "authenticated" 
USING (auth.uid() = user_id);

-- Ensure Profiles are readable (Referrer access)
-- Agents might need to see basic info of people they referred?
-- For now, let's keep it simple.

-- Just in case, grant usage on items
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
