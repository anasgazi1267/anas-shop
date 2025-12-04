-- Add affiliate commission to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS affiliate_commission numeric DEFAULT 0;

-- Create affiliate links table
CREATE TABLE public.affiliate_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  clicks integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create affiliate earnings table
CREATE TABLE public.affiliate_earnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  account_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Affiliate links policies
CREATE POLICY "Users can view their own affiliate links" ON public.affiliate_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create affiliate links" ON public.affiliate_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view affiliate links by code" ON public.affiliate_links FOR SELECT USING (true);

-- Affiliate earnings policies
CREATE POLICY "Users can view their own earnings" ON public.affiliate_earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all earnings" ON public.affiliate_earnings FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update earnings" ON public.affiliate_earnings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert earnings" ON public.affiliate_earnings FOR INSERT WITH CHECK (true);

-- Withdrawal requests policies
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawal_requests FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update withdrawals" ON public.withdrawal_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for referral code lookup
CREATE INDEX idx_affiliate_links_referral_code ON public.affiliate_links(referral_code);