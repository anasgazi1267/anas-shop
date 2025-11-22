-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles: users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policy for user_roles: admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create delivery_settings table
CREATE TABLE public.delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inside_dhaka_charge NUMERIC NOT NULL DEFAULT 50,
  outside_dhaka_charge NUMERIC NOT NULL DEFAULT 70,
  free_delivery_threshold NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on delivery_settings
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view delivery settings
CREATE POLICY "Everyone can view delivery settings"
ON public.delivery_settings
FOR SELECT
USING (true);

-- Only admins can update delivery settings
CREATE POLICY "Admins can update delivery settings"
ON public.delivery_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default delivery settings
INSERT INTO public.delivery_settings (inside_dhaka_charge, outside_dhaka_charge, free_delivery_threshold)
VALUES (50, 70, 0);

-- Create divisions table for Bangladesh
CREATE TABLE public.divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on divisions
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

-- Everyone can view divisions
CREATE POLICY "Everyone can view divisions"
ON public.divisions
FOR SELECT
USING (true);

-- Create districts table for Bangladesh
CREATE TABLE public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE NOT NULL,
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  is_dhaka BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on districts
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- Everyone can view districts
CREATE POLICY "Everyone can view districts"
ON public.districts
FOR SELECT
USING (true);

-- Insert Bangladesh divisions
INSERT INTO public.divisions (name_en, name_bn) VALUES
('Dhaka', 'ঢাকা'),
('Chittagong', 'চট্টগ্রাম'),
('Rajshahi', 'রাজশাহী'),
('Khulna', 'খুলনা'),
('Barishal', 'বরিশাল'),
('Sylhet', 'সিলেট'),
('Rangpur', 'রংপুর'),
('Mymensingh', 'ময়মনসিংহ');

-- Insert Dhaka division districts
INSERT INTO public.districts (division_id, name_en, name_bn, is_dhaka)
SELECT id, 'Dhaka', 'ঢাকা', true FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Gazipur', 'গাজীপুর', true FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Narayanganj', 'নারায়ণগঞ্জ', true FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Narsingdi', 'নরসিংদী', false FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Tangail', 'টাঙ্গাইল', false FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Kishoreganj', 'কিশোরগঞ্জ', false FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Manikganj', 'মানিকগঞ্জ', false FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Munshiganj', 'মুন্সীগঞ্জ', true FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Rajbari', 'রাজবাড়ী', false FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Shariatpur', 'শরীয়তপুর', false FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Faridpur', 'ফরিদপুর', false FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Gopalganj', 'গোপালগঞ্জ', false FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT id, 'Madaripur', 'মাদারীপুর', false FROM public.divisions WHERE name_en = 'Dhaka';

-- Update orders table to include division and district
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES public.divisions(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.districts(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0;

-- Update RLS policies for products table to allow admin management
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for orders table to allow admin management
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for categories table to allow admin management
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for banners table to allow admin management
CREATE POLICY "Admins can insert banners"
ON public.banners
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update banners"
ON public.banners
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banners"
ON public.banners
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for settings table to allow admin management
CREATE POLICY "Admins can update settings"
ON public.settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
ON public.settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for product_requests to allow admin management
CREATE POLICY "Admins can view all product requests"
ON public.product_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product requests"
ON public.product_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Create storage policies for product images
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));