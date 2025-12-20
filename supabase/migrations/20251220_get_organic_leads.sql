-- Functions to get organic leads (users without referrer and without successful purchase)

-- Drop existing function to avoid "cannot change return type" error
drop function if exists get_organic_leads_paginated(text, int, int);
drop function if exists get_organic_leads_count(text);

create or replace function get_organic_leads_paginated(
  search_query text,
  page_limit int,
  page_offset int
)
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  created_at timestamptz
) as $$
begin
  return query
  with combined_leads as (
    -- 1. From Profiles (Registered Users)
    select 
      p.id,
      p.email,
      p.full_name,
      p.phone,
      p.created_at
    from profiles p
    where p.referred_by is null
    and not exists (
      select 1 from transactions t 
      where t.user_id = p.id 
      and t.status = 'success'
    )
    union all
    -- 2. From Leads Table (Pre-registration)
    select 
      l.id,
      l.email,
      l.full_name,
      l.phone,
      l.created_at
    from leads l
    where l.referred_by_code is null 
       or l.referred_by_code = ''
  )
  select *
  from combined_leads cl
  where (
    search_query = '' 
    or cl.email ilike '%' || search_query || '%' 
    or cl.full_name ilike '%' || search_query || '%'
  )
  order by cl.created_at desc
  limit page_limit
  offset page_offset;
end;
$$ language plpgsql security definer;

create or replace function get_organic_leads_count(
  search_query text
)
returns integer as $$
declare
  total int;
begin
  with combined_leads as (
    select 
      p.email,
      p.full_name
    from profiles p
    where p.referred_by is null
    and not exists (
      select 1 from transactions t 
      where t.user_id = p.id 
      and t.status = 'success'
    )
    union all
    select 
      l.email,
      l.full_name
    from leads l
    where l.referred_by_code is null 
       or l.referred_by_code = ''
  )
  select count(*)
  into total
  from combined_leads cl
  where (
    search_query = '' 
    or cl.email ilike '%' || search_query || '%' 
    or cl.full_name ilike '%' || search_query || '%'
  );
  
  return total;
end;
$$ language plpgsql security definer;
