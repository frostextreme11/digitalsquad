-- Tier type enum
CREATE TYPE tier_type AS ENUM ('basic', 'pro', 'vip');

-- Tiers configuration table
CREATE TABLE public.tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_key tier_type UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  commission_rate DECIMAL NOT NULL,       -- 0.30, 0.50, 0.60
  min_withdraw DECIMAL NOT NULL,          -- 50000, 20000, 0
  upgrade_price DECIMAL DEFAULT 0,        -- 0, 100000, 0
  registration_price DECIMAL DEFAULT 50000, -- 50000, 150000, 0
  upgrade_sales_threshold INTEGER,        -- null, 10, 100
  override_commission_rate DECIMAL,       -- null, null, 0.05 (1 level only)
  priority_withdrawal BOOLEAN DEFAULT FALSE,
  is_purchasable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add tier to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES public.tiers(id),
  ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;

-- Insert default tiers with registration_price
INSERT INTO public.tiers (tier_key, name, description, commission_rate, min_withdraw, upgrade_price, registration_price, upgrade_sales_threshold, is_purchasable) VALUES
  ('basic', 'SQUAD MEMBER', 'Tier pemula - Komisi 30%', 0.30, 50000, 0, 50000, NULL, TRUE),
  ('pro', 'SQUAD ELITE', 'Tier pro - Komisi 50%', 0.50, 20000, 100000, 150000, 10, TRUE),
  ('vip', 'SQUAD COMMANDER', 'Tier VIP eksklusif - Komisi 60%', 0.60, 0, 0, 0, 100, FALSE);

-- VIP special: override commission 5% from 1 level downline
UPDATE public.tiers SET override_commission_rate = 0.05, priority_withdrawal = TRUE WHERE tier_key = 'vip';

-- Set default tier for existing users
UPDATE public.profiles SET tier_id = (SELECT id FROM public.tiers WHERE tier_key = 'basic') WHERE tier_id IS NULL;

-- RLS
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tiers" ON public.tiers FOR SELECT USING (TRUE);

CREATE POLICY "Admin manage tiers" ON public.tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RPC: Increment sales count
CREATE OR REPLACE FUNCTION increment_sales(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles SET total_sales = COALESCE(total_sales, 0) + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Check and perform auto-upgrade
CREATE OR REPLACE FUNCTION check_auto_upgrade(check_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  current_tier_key tier_type;
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
  
  -- Get thresholds
  SELECT upgrade_sales_threshold INTO pro_threshold FROM tiers WHERE tier_key = 'pro';
  SELECT upgrade_sales_threshold INTO vip_threshold FROM tiers WHERE tier_key = 'vip';
  
  -- Check upgrade eligibility
  IF (current_tier_key IS NULL OR current_tier_key = 'basic') AND current_sales >= COALESCE(pro_threshold, 10) THEN
    SELECT id INTO next_tier_id FROM tiers WHERE tier_key = 'pro';
    UPDATE profiles SET tier_id = next_tier_id WHERE id = check_user_id;
    RETURN 'upgraded_to_pro';
  ELSIF current_tier_key = 'pro' AND current_sales >= COALESCE(vip_threshold, 100) THEN
    SELECT id INTO next_tier_id FROM tiers WHERE tier_key = 'vip';
    UPDATE profiles SET tier_id = next_tier_id WHERE id = check_user_id;
    RETURN 'upgraded_to_vip';
  END IF;
  
  RETURN 'no_upgrade';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
