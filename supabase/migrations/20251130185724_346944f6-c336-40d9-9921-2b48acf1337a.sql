-- Add sizes column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}';

-- Add payment screenshot and product sizes to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_screenshot text,
ADD COLUMN IF NOT EXISTS product_sizes jsonb DEFAULT '[]'::jsonb;

-- Update storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for payment screenshots
CREATE POLICY "Anyone can upload payment screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots');

CREATE POLICY "Admins can view payment screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-screenshots' AND (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
));

CREATE POLICY "Users can view their own payment screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);