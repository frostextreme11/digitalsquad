-- Grant admin access to specific email
update public.profiles
set role = 'admin'
where email = 'irfankurniawan203@gmail.com'; -- Replace with your email if different

-- Or if you want to be safe, create a function to make admin
create or replace function make_admin(target_email text)
returns void as $$
begin
  update public.profiles
  set role = 'admin'
  where email = target_email;
end;
$$ language plpgsql security definer;
