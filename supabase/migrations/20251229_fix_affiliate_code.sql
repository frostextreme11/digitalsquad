-- Function to generate a unique affiliate code
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

-- Update the handle_new_user trigger function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_tier_id uuid;
begin
  -- Safely extract tier_id if valid UUID
  begin
    meta_tier_id := (new.raw_user_meta_data->>'tier_id')::uuid;
  exception when others then
    meta_tier_id := null;
  end;

  insert into public.profiles (id, email, full_name, phone, role, referred_by, affiliate_code, tier_id)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'phone', 
    'agent',
    (new.raw_user_meta_data->>'referred_by')::uuid,
    public.generate_affiliate_code(new.raw_user_meta_data->>'full_name'),
    meta_tier_id
  );
  return new;
end;
$$;

-- Backfill missing affiliate codes
do $$
declare
  r record;
begin
  for r in select id, full_name from public.profiles where affiliate_code is null loop
    update public.profiles
    set affiliate_code = public.generate_affiliate_code(r.full_name)
    where id = r.id;
  end loop;
end;
$$;
