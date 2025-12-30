-- Restore affiliate_code generation in the new trigger logic

-- Ensure the generator function exists (idempotent)
create or replace function public.generate_affiliate_code(name text)
returns text
language plpgsql
as $$
declare
  base_code text;
  new_code text;
  counter integer := 0;
begin
  -- clean name: uppercase, remove non-alphanumeric
  base_code := upper(regexp_replace(coalesce(name, 'USER'), '[^a-zA-Z0-9]', '', 'g'));
  if length(base_code) < 3 then
    base_code := 'AGENT';
  end if;
  base_code := substring(base_code from 1 for 4);
  
  -- Generates like NAME1234
  loop
    new_code := base_code || floor(random() * 9000 + 1000)::text;
    if not exists (select 1 from public.profiles where affiliate_code = new_code) then
      return new_code;
    end if;
    counter := counter + 1;
    if counter > 100 then
       -- fallback to random string if stuck
       return 'A' || substring(md5(random()::text) from 1 for 7);
    end if;
  end loop;
end;
$$;


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  ref_by uuid;
  t_id uuid;
  aff_code text;
BEGIN
  -- Safely parse UUIDs from metadata
  BEGIN
    ref_by := NULLIF(new.raw_user_meta_data->>'referred_by', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    ref_by := NULL;
  END;

  BEGIN
    t_id := NULLIF(new.raw_user_meta_data->>'tier_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    t_id := NULL;
  END;

  -- Generate Affiliate Code
  aff_code := public.generate_affiliate_code(new.raw_user_meta_data->>'full_name');

  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    role, 
    referred_by, 
    tier_id,
    affiliate_code
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'phone', 
    'agent',
    ref_by,
    t_id,
    aff_code
  );
  
  RETURN new;
END;
$$;
