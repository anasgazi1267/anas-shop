
-- Products: add slug column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Profiles: add division_id and district_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES public.divisions;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.districts;

-- Products: add is_bestseller if missing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banner-images', 'banner-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Auth users upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Public read category images" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');
CREATE POLICY "Auth users upload category images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'category-images' AND auth.role() = 'authenticated');
CREATE POLICY "Public read banner images" ON storage.objects FOR SELECT USING (bucket_id = 'banner-images');
CREATE POLICY "Auth users upload banner images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banner-images' AND auth.role() = 'authenticated');
CREATE POLICY "Public read payment screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'payment-screenshots');
CREATE POLICY "Anyone upload payment screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-screenshots');
