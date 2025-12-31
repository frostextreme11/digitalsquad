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
  with organic_profiles as (
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
    and (search_query = '' or p.email ilike '%' || search_query || '%' or p.full_name ilike '%' || search_query || '%')
  ),
  organic_leads as (
    select distinct on (l.email)
      l.id,
      l.email,
      l.full_name,
      l.phone,
      l.created_at
    from leads l
    where (l.referred_by_code is null or l.referred_by_code = '')
    and not exists (
      select 1 from profiles p where p.email = l.email
    )
    and (search_query = '' or l.email ilike '%' || search_query || '%' or l.full_name ilike '%' || search_query || '%')
    order by l.email, l.created_at desc
  )
  select * from organic_profiles
  union all
  select * from organic_leads
  order by created_at desc
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
  with organic_profiles as (
    select 
      p.email
    from profiles p
    where p.referred_by is null
    and not exists (
      select 1 from transactions t 
      where t.user_id = p.id 
      and t.status = 'success'
    )
    and (search_query = '' or p.email ilike '%' || search_query || '%' or p.full_name ilike '%' || search_query || '%')
  ),
  organic_leads as (
    select 
      l.email
    from leads l
    where (l.referred_by_code is null or l.referred_by_code = '')
    and not exists (
      select 1 from profiles p where p.email = l.email
    )
    and (search_query = '' or l.email ilike '%' || search_query || '%' or l.full_name ilike '%' || search_query || '%')
  )
  select count(distinct email)
  into total
  from (
    select email from organic_profiles
    union all
    select email from organic_leads
  ) combined;
  
  return total;
end;
$$ language plpgsql security definer;
