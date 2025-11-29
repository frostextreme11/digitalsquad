create or replace function increment_balance(user_id uuid, amount decimal)
returns void as $$
begin
  update public.profiles
  set balance = balance + amount
  where id = user_id;
end;
$$ language plpgsql security definer;
