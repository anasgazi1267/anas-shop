-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for users table
CREATE POLICY "Users are viewable by admins only"
  ON public.users FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));