-- 1. Ensure Service Role has explicit access despite usually bypassing RLS
-- This is a "belt and suspenders" fix for the "No Commission" issue.

-- Commissions
drop policy if exists "Service role manage commissions" on public.commissions;
create policy "Service role manage commissions" on public.commissions
  for all to service_role using (true) with check (true);

-- Profiles
drop policy if exists "Service role manage profiles" on public.profiles;
create policy "Service role manage profiles" on public.profiles
  for all to service_role using (true) with check (true);

-- Transactions
drop policy if exists "Service role manage transactions" on public.transactions;
create policy "Service role manage transactions" on public.transactions
  for all to service_role using (true) with check (true);

-- Leads
drop policy if exists "Service role manage leads" on public.leads;
create policy "Service role manage leads" on public.leads
  for all to service_role using (true) with check (true);

-- 2. Make check_auto_upgrade safer for NULLs to prevent Trigger crashes
CREATE OR REPLACE FUNCTION check_auto_upgrade(check_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  current_tier_key public.tier_type;
  current_sales INTEGER;
  next_tier_id UUID;
  pro_threshold INTEGER;
  vip_threshold INTEGER;
BEGIN
  -- Get current tier and sales
  SELECT t.tier_key, p.total_sales INTO current_tier_key, current_sales
  FROM profiles p
  LEFT JOIN tiers t ON p.tier_id = t.id
  WHERE p.id = check_user_id;
  
  -- Get thresholds (use coalesce for safety)
  SELECT upgrade_sales_threshold INTO pro_threshold FROM tiers WHERE tier_key = 'pro';
  SELECT upgrade_sales_threshold INTO vip_threshold FROM tiers WHERE tier_key = 'vip';
  
  -- Check upgrade eligibility (COALESCE EVERYTHING)
  IF (current_tier_key IS NULL OR current_tier_key = 'basic') AND COALESCE(current_sales, 0) >= COALESCE(pro_threshold, 10) THEN
    SELECT id INTO next_tier_id FROM tiers WHERE tier_key = 'pro';
    IF next_tier_id IS NOT NULL THEN
        UPDATE profiles SET tier_id = next_tier_id WHERE id = check_user_id;
        RETURN 'upgraded_to_pro';
    END IF;
  ELSIF current_tier_key = 'pro' AND COALESCE(current_sales, 0) >= COALESCE(vip_threshold, 100) THEN
    SELECT id INTO next_tier_id FROM tiers WHERE tier_key = 'vip';
    IF next_tier_id IS NOT NULL THEN
        UPDATE profiles SET tier_id = next_tier_id WHERE id = check_user_id;
        RETURN 'upgraded_to_vip';
    END IF;
  END IF;
  
  RETURN 'no_upgrade';
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't crash the transaction
  RAISE WARNING 'Auto upgrade check failed for user %: %', check_user_id, SQLERRM;
  RETURN 'error';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
