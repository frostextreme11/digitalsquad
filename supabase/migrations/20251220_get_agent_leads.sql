-- Functions to get agent leads (users referred by agent who haven't paid yet)

drop function if exists get_agent_leads_paginated(uuid, text, int, int);
drop function if exists get_agent_leads_count(uuid, text);

create or replace function get_agent_leads_paginated(
  p_agent_id uuid,
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
  select 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.created_at
  from profiles p
  where p.referred_by = p_agent_id
  and not exists (
    select 1 from transactions t 
    where t.user_id = p.id 
    and t.status = 'success'
    and t.type = 'registration'
  )
  and (
    search_query = '' 
    or p.email ilike '%' || search_query || '%' 
    or p.full_name ilike '%' || search_query || '%'
  )
  order by p.created_at desc
  limit page_limit
  offset page_offset;
end;
$$ language plpgsql security definer;

create or replace function get_agent_leads_count(
  p_agent_id uuid,
  search_query text
)
returns integer as $$
declare
  total int;
begin
  select count(*)
  into total
  from profiles p
  where p.referred_by = p_agent_id
  and not exists (
    select 1 from transactions t 
    where t.user_id = p.id 
    and t.status = 'success'
    and t.type = 'registration'
  )
  and (
    search_query = '' 
    or p.email ilike '%' || search_query || '%' 
    or p.full_name ilike '%' || search_query || '%'
  );
  
  return total;
end;
$$ language plpgsql security definer;
