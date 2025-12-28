-- Update handle_new_user to include tier_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, referred_by, tier_id)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'phone', 
    'agent',
    (new.raw_user_meta_data->>'referred_by')::uuid,
    (new.raw_user_meta_data->>'tier_id')::uuid
  );
  RETURN new;
END;
$$;

-- Create RPC to allow users to set their own tier (as a fallback/fix)
CREATE OR REPLACE FUNCTION public.set_registration_tier(tier_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET tier_id = set_registration_tier.tier_id
  WHERE id = auth.uid()
  AND (tier_id IS NULL OR tier_id != set_registration_tier.tier_id); -- Only if different
END;
$$;
