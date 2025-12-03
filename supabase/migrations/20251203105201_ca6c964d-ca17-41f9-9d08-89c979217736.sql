-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for admins to upload banners
CREATE POLICY "Admins can upload banner images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'banner-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Create policy for admins to update banner images
CREATE POLICY "Admins can update banner images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'banner-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Create policy for admins to delete banner images
CREATE POLICY "Admins can delete banner images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'banner-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Create policy for public read access to banner images
CREATE POLICY "Banner images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banner-images');