-- Security Definer Function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- We query profiles directly. Since it is SECURITY DEFINER, it runs with higher privileges, bypassing RLS on profiles.
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Fix Transactions RLS
ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for admins" ON "public"."transactions";
CREATE POLICY "Enable read access for admins" ON "public"."transactions"
FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Enable read access for own transactions" ON "public"."transactions";
CREATE POLICY "Enable read access for own transactions" ON "public"."transactions"
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix Profiles RLS (Crucial for recursion prevention)
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for admins" ON "public"."profiles";
CREATE POLICY "Enable read access for admins" ON "public"."profiles"
FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Enable read access for own profile" ON "public"."profiles";
CREATE POLICY "Enable read access for own profile" ON "public"."profiles"
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Fix Commissions RLS (Admin visibility)
ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for admins" ON "public"."commissions";
CREATE POLICY "Enable read access for admins" ON "public"."commissions"
FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Enable read access for own commissions" ON "public"."commissions";
CREATE POLICY "Enable read access for own commissions" ON "public"."commissions"
FOR SELECT TO authenticated
USING (auth.uid() = agent_id);

-- Fix Withdrawals RLS
ALTER TABLE "public"."withdrawals" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for admins" ON "public"."withdrawals";
CREATE POLICY "Enable read access for admins" ON "public"."withdrawals"
FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Enable read access for own withdrawals" ON "public"."withdrawals";
CREATE POLICY "Enable read access for own withdrawals" ON "public"."withdrawals"
FOR SELECT TO authenticated
USING (auth.uid() = agent_id);
