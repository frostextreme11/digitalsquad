ALTER TABLE public.product_purchases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Policy for users to view their own purchases
CREATE POLICY "Users can view their own product purchases" 
ON public.product_purchases FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
