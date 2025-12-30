-- Enable Admin Access Policy for key tables without custom function

-- Commissions: Admin sees all
DROP POLICY IF EXISTS "Enable read access for admins" ON "public"."commissions";
CREATE POLICY "Enable read access for admins" ON "public"."commissions"
FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Transactions: Admin sees all
DROP POLICY IF EXISTS "Enable read access for admins" ON "public"."transactions";
CREATE POLICY "Enable read access for admins" ON "public"."transactions"
FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Withdrawals: Admin sees all
DROP POLICY IF EXISTS "Enable read access for admins" ON "public"."withdrawals";
CREATE POLICY "Enable read access for admins" ON "public"."withdrawals"
FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Profiles: Admin sees all
DROP POLICY IF EXISTS "Enable read access for admins" ON "public"."profiles";
CREATE POLICY "Enable read access for admins" ON "public"."profiles"
FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
