-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_bn TEXT,
  price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2),
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.categories(id),
  images TEXT[] NOT NULL DEFAULT '{}',
  is_advance_payment BOOLEAN DEFAULT false,
  advance_amount DECIMAL(10, 2),
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_requests table
CREATE TABLE public.product_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  product_ids UUID[] NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  advance_amount DECIMAL(10, 2),
  transaction_id TEXT,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title_en TEXT,
  title_bn TEXT,
  link TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table
CREATE TABLE public.settings (
  key TEXT NOT NULL PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Banners are viewable by everyone" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Settings are viewable by everyone" ON public.settings FOR SELECT USING (true);

-- Create policies for product requests
CREATE POLICY "Anyone can create product requests" ON public.product_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view their own requests" ON public.product_requests FOR SELECT USING (true);

-- Create policies for orders
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view orders by tracking ID" ON public.orders FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Generate tracking ID function
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'AS' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
  ('bkash_number', '01401757283'),
  ('nagad_number', '01401757283'),
  ('support_email', 'zenmarket55@gmail.com'),
  ('support_whatsapp', '01401757283'),
  ('facebook_url', ''),
  ('youtube_url', '');

-- Insert sample categories
INSERT INTO public.categories (name_en, name_bn, slug) VALUES
  ('Electronics', 'ইলেকট্রনিক্স', 'electronics'),
  ('Fashion', 'ফ্যাশন', 'fashion'),
  ('Home & Living', 'হোম এন্ড লিভিং', 'home-living'),
  ('Beauty & Health', 'বিউটি এন্ড হেলথ', 'beauty-health');