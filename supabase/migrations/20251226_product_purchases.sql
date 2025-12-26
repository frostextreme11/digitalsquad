-- Product Purchases (for end users who are not registered agents)
CREATE TABLE IF NOT EXISTS public.product_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  agent_code TEXT,  -- The affiliate code of the selling agent
  transaction_id UUID REFERENCES public.transactions(id),
  status status_type DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add commission_rate to products (optional, defaults to 50%)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'commission_rate') THEN
        ALTER TABLE public.products ADD COLUMN commission_rate DECIMAL DEFAULT 0.5;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.product_purchases ENABLE ROW LEVEL SECURITY;

-- Public insert for checkout
DROP POLICY IF EXISTS "Public insert product_purchases" ON public.product_purchases;
CREATE POLICY "Public insert product_purchases" 
ON public.product_purchases FOR INSERT WITH CHECK (true);

-- Admin read all
DROP POLICY IF EXISTS "Admin read product_purchases" ON public.product_purchases;
CREATE POLICY "Admin read product_purchases" 
ON public.product_purchases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Agent read their own sales (by affiliate code)
DROP POLICY IF EXISTS "Agent read own sales" ON public.product_purchases;
CREATE POLICY "Agent read own sales" 
ON public.product_purchases FOR SELECT USING (
  agent_code IN (SELECT affiliate_code FROM public.profiles WHERE id = auth.uid())
);
