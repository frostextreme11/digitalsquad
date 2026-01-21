-- Blog Posts Table
-- Migration for blog system with SEO fields

CREATE TABLE public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  slug text UNIQUE NOT NULL,
  meta_description text,
  reading_time integer DEFAULT 1,
  keywords text[] DEFAULT '{}',
  is_published boolean DEFAULT false,
  author_name text DEFAULT 'Digital Squad Team',
  featured_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public read published posts" ON public.posts 
  FOR SELECT USING (is_published = true);

-- Admin can do everything
CREATE POLICY "Admin full access posts" ON public.posts 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create index on slug for faster lookups
CREATE INDEX idx_posts_slug ON public.posts(slug);

-- Create index on is_published for filtered queries
CREATE INDEX idx_posts_published ON public.posts(is_published);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row update
CREATE TRIGGER posts_updated_at_trigger
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_updated_at();
