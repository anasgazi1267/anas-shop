-- Create user_referrals table for tracking who referred whom
CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_referral UNIQUE (referrer_id, referred_id)
);

-- Create payment_methods table for admin to manage
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  logo_url TEXT,
  account_number TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add referral_commission column to affiliate_earnings to track tier-2 commissions
ALTER TABLE public.affiliate_earnings 
ADD COLUMN IF NOT EXISTS is_referral_commission BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referrer_id UUID;

-- Insert default settings for referral system
INSERT INTO public.settings (key, value) VALUES 
  ('referral_commission_rate', '5'),
  ('minimum_withdrawal', '500')
ON CONFLICT (key) DO NOTHING;

-- Insert default payment methods
INSERT INTO public.payment_methods (name, name_bn, account_number, display_order) VALUES
  ('bKash', 'বিকাশ', '', 1),
  ('Nagad', 'নগদ', '', 2),
  ('Rocket', 'রকেট', '', 3);

-- Enable RLS
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_referrals
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals" ON public.user_referrals
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all referrals" ON public.user_referrals
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for payment_methods
CREATE POLICY "Everyone can view active payment methods" ON public.payment_methods
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment methods" ON public.payment_methods
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add user_id to orders for tracking user orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS referral_code TEXT;