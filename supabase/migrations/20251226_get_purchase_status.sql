-- Function to get purchase status for anonymous users
CREATE OR REPLACE FUNCTION public.get_purchase_status(tx_id UUID)
RETURNS TABLE (
  status status_type,
  product_file_url TEXT,
  product_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.status,
    p.file_url,
    p.title
  FROM public.product_purchases pp
  JOIN public.products p ON pp.product_id = p.id
  WHERE pp.transaction_id = tx_id;
END;
$$;
