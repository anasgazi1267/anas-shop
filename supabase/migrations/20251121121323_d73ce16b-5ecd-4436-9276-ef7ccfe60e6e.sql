-- Fix generate_tracking_id function security
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS TEXT 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'AS' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;