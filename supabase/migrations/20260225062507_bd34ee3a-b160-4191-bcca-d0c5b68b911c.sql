-- Add product_type column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'own';

-- Add movedrop_order_id to orders for tracking forwarded orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS movedrop_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_source text NOT NULL DEFAULT 'website';
