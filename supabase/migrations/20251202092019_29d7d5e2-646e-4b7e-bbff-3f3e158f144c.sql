-- Add keywords and SEO fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT;

-- Create category-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for category-images bucket
CREATE POLICY "Anyone can view category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'category-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update category images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'category-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'category-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);