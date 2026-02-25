
-- Products: rename and add columns
ALTER TABLE public.products RENAME COLUMN name TO name_en;
ALTER TABLE public.products RENAME COLUMN description TO description_en;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_advance_payment BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS advance_amount NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_keywords TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS affiliate_commission NUMERIC;

-- Categories: rename and add columns
ALTER TABLE public.categories RENAME COLUMN name TO name_en;
ALTER TABLE public.categories RENAME COLUMN image TO image_url;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;

-- Banners: rename columns
ALTER TABLE public.banners RENAME COLUMN image TO image_url;
ALTER TABLE public.banners RENAME COLUMN title TO title_en;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title_bn TEXT;
ALTER TABLE public.banners RENAME COLUMN sort_order TO display_order;

-- Divisions: rename
ALTER TABLE public.divisions RENAME COLUMN name TO name_en;

-- Districts: rename and add
ALTER TABLE public.districts RENAME COLUMN name TO name_en;
ALTER TABLE public.districts ADD COLUMN IF NOT EXISTS is_dhaka BOOLEAN DEFAULT false;

-- Product views: rename and add
ALTER TABLE public.product_views RENAME COLUMN ip_address TO user_ip;
ALTER TABLE public.product_views ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Affiliate links: rename
ALTER TABLE public.affiliate_links RENAME COLUMN code TO referral_code;

-- Affiliate earnings: add columns
ALTER TABLE public.affiliate_earnings ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products;
ALTER TABLE public.affiliate_earnings ADD COLUMN IF NOT EXISTS is_referral_commission BOOLEAN DEFAULT false;

-- Withdrawal requests: add columns
ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Categories: add display_order
ALTER TABLE public.categories RENAME COLUMN sort_order TO display_order;

-- Orders: add missing columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS advance_amount NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_screenshot TEXT;

-- Update Dhaka division districts
UPDATE public.districts SET is_dhaka = true WHERE division_id = (SELECT id FROM public.divisions WHERE name_en = 'Dhaka');

-- Drop old payment_methods and recreate for admin-managed methods
DROP TABLE IF EXISTS public.payment_methods;
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read payment_methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Admins can manage payment_methods" ON public.payment_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Insert default payment methods
INSERT INTO public.payment_methods (name, name_bn, display_order) VALUES
('bKash', 'বিকাশ', 1),
('Nagad', 'নগদ', 2),
('Rocket', 'রকেট', 3);

-- Insert some districts for Dhaka division
INSERT INTO public.districts (name_en, name_bn, division_id, is_dhaka) 
SELECT 'Dhaka', 'ঢাকা', id, true FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT 'Gazipur', 'গাজীপুর', id, true FROM public.divisions WHERE name_en = 'Dhaka'
UNION ALL
SELECT 'Narayanganj', 'নারায়ণগঞ্জ', id, true FROM public.divisions WHERE name_en = 'Dhaka';

-- Insert districts for Chittagong
INSERT INTO public.districts (name_en, name_bn, division_id, is_dhaka)
SELECT 'Chittagong', 'চট্টগ্রাম', id, false FROM public.divisions WHERE name_en = 'Chittagong'
UNION ALL
SELECT 'Comilla', 'কুমিল্লা', id, false FROM public.divisions WHERE name_en = 'Chittagong';

-- Insert districts for Rajshahi
INSERT INTO public.districts (name_en, name_bn, division_id, is_dhaka)
SELECT 'Rajshahi', 'রাজশাহী', id, false FROM public.divisions WHERE name_en = 'Rajshahi';

-- Insert districts for Khulna
INSERT INTO public.districts (name_en, name_bn, division_id, is_dhaka)
SELECT 'Khulna', 'খুলনা', id, false FROM public.divisions WHERE name_en = 'Khulna';

-- Insert districts for Sylhet
INSERT INTO public.districts (name_en, name_bn, division_id, is_dhaka)
SELECT 'Sylhet', 'সিলেট', id, false FROM public.divisions WHERE name_en = 'Sylhet';

-- Insert districts for Barisal
INSERT INTO public.districts (name_en, name_bn, division_id, is_dhaka)
SELECT 'Barisal', 'বরিশাল', id, false FROM public.divisions WHERE name_en = 'Barisal';

-- Insert districts for Rangpur
INSERT INTO public.districts (name_en, name_bn, division_id, is_dhaka)
SELECT 'Rangpur', 'রংপুর', id, false FROM public.divisions WHERE name_en = 'Rangpur';

-- Insert districts for Mymensingh
INSERT INTO public.districts (name_en, name_bn, division_id, is_dhaka)
SELECT 'Mymensingh', 'ময়মনসিংহ', id, false FROM public.divisions WHERE name_en = 'Mymensingh';
