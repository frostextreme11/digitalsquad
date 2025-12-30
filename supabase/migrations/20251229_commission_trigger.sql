-- Trigger function to handle commission side effects (Balance, Sales, Upgrade)
create or replace function public.on_commission_created()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Update balance
  update public.profiles
  set balance = coalesce(balance, 0) + new.amount
  where id = new.agent_id;
  
  -- Update total sales
  update public.profiles
  set total_sales = coalesce(total_sales, 0) + 1
  where id = new.agent_id;
  
  -- Check auto upgrade
  perform public.check_auto_upgrade(new.agent_id);
  
  return new;
end;
$$;

-- Drop trigger if exists to avoid duplication errors
drop trigger if exists trigger_commission_created on public.commissions;

-- Create trigger
create trigger trigger_commission_created
after insert on public.commissions
for each row
execute function public.on_commission_created();
