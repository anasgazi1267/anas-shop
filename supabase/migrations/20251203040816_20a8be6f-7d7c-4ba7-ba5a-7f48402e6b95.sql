-- Fix product_views security warning by adding rate limiting

-- Drop existing policy
DROP POLICY IF EXISTS "Anyone can record product views" ON product_views;

-- Create a function to check for duplicate views within timeframe (5 minutes)
CREATE OR REPLACE FUNCTION public.can_record_view(p_product_id uuid, p_user_ip text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.product_views
    WHERE product_id = p_product_id
      AND user_ip = p_user_ip
      AND viewed_at > NOW() - INTERVAL '5 minutes'
  )
$$;

-- Create rate-limited policy
CREATE POLICY "Rate limited product view recording"
ON product_views FOR INSERT
WITH CHECK (
  can_record_view(product_id, user_ip)
);