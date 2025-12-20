-- Function to search withdrawals with efficient filtering
create or replace function get_admin_withdrawals(
    search_query text default '',
    status_filter text default 'all',
    limit_val int default 50
)
returns table (
    id uuid,
    created_at timestamptz,
    amount decimal,
    status status_type,
    bank_details jsonb,
    agent_id uuid,
    profiles jsonb
) 
language plpgsql
security definer
as $$
begin
    return query
    select 
        w.id,
        w.created_at,
        w.amount,
        w.status,
        w.bank_details,
        w.agent_id,
        jsonb_build_object(
            'full_name', p.full_name,
            'email', p.email,
            'affiliate_code', p.affiliate_code
        ) as profiles
    from 
        public.withdrawals w
    left join 
        public.profiles p on w.agent_id = p.id
    where 
        (status_filter = 'all' or w.status::text = status_filter)
        and
        (search_query = '' or 
         p.full_name ilike '%' || search_query || '%' or
         p.email ilike '%' || search_query || '%' or
         p.affiliate_code ilike '%' || search_query || '%' or
         w.bank_details->>'bank_name' ilike '%' || search_query || '%' or
         w.bank_details->>'account_number' ilike '%' || search_query || '%' or
         w.bank_details->>'account_name' ilike '%' || search_query || '%'
        )
    order by 
        w.created_at desc
    limit 
        limit_val;
end;
$$;
