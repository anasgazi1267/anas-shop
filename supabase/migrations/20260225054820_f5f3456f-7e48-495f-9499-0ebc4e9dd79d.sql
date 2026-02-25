
-- Ensure unique role assignments
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_key
  ON public.user_roles (user_id, role);

-- Public users table to expose emails safely (admin/own access only)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own user row" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

CREATE POLICY "Users can view own user row"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger to sync auth.users -> public.users + profiles + roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);

  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NULL))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email = 'anasgazi5567@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users (if any)
INSERT INTO public.users (id, email, full_name, created_at)
SELECT id, email, (raw_user_meta_data->>'full_name'), created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (user_id, full_name)
SELECT id, (raw_user_meta_data->>'full_name')
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, CASE WHEN email = 'anasgazi5567@gmail.com' THEN 'admin' ELSE 'user' END
FROM auth.users
ON CONFLICT DO NOTHING;

-- Fix permissive RLS policies flagged by linter
-- Orders: replace unsafe SELECT policy and permissive INSERT policy
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;

CREATE POLICY "Orders insert (public)"
ON public.orders
FOR INSERT
WITH CHECK (
  tracking_id IS NOT NULL
  AND customer_name IS NOT NULL
  AND customer_phone IS NOT NULL
  AND customer_address IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Orders select own"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Orders select admin"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Orders update admin"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Orders delete admin"
ON public.orders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- product_views: avoid WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can insert product_views" ON public.product_views;
CREATE POLICY "Anyone can insert product_views"
ON public.product_views
FOR INSERT
WITH CHECK (product_id IS NOT NULL);

-- product_requests: avoid WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can insert product_requests" ON public.product_requests;
CREATE POLICY "Anyone can insert product_requests"
ON public.product_requests
FOR INSERT
WITH CHECK (product_name IS NOT NULL AND length(trim(product_name)) > 0);
