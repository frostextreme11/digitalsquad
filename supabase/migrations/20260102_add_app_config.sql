-- Create app_config table for dynamic settings
create table if not exists app_config (
  key text primary key,
  value text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table app_config enable row level security;

-- Allow public read access to specific keys (we can restrict this if needed, but snap_url is public)
create policy "Allow public read access to app_config"
  on app_config for select
  using (true);

-- Only admins can update (assuming you have an admin role or just use Dashboard)
create policy "Allow admin update to app_config"
  on app_config for all
  using (auth.role() = 'service_role' or exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

-- Insert default values (Sandbox)
insert into app_config (key, value, description)
values 
  ('midtrans_snap_url', 'https://app.sandbox.midtrans.com/snap/snap.js', 'URL for Midtrans Snap JS (Sandbox: https://app.sandbox.midtrans.com/snap/snap.js, Production: https://app.midtrans.com/snap/snap.js)'),
  ('midtrans_api_url', 'https://app.sandbox.midtrans.com/snap/v1/transactions', 'URL for Midtrans API (Sandbox: https://app.sandbox.midtrans.com/snap/v1/transactions, Production: https://app.midtrans.com/snap/v1/transactions)'),
  ('midtrans_is_production', 'false', 'Flag to indicate if using production mode')
on conflict (key) do nothing;
