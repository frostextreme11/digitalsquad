create table if not exists video_testimonials (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  video_url text not null,
  title text not null,
  description text,
  thumbnail_url text
);

alter table video_testimonials enable row level security;

create policy "Enable read access for all authenticated users"
  on video_testimonials for select
  to authenticated
  using (true);

create policy "Enable all access for admin users"
  on video_testimonials for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
