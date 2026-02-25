
-- Payment methods: add account_number
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS account_number TEXT;

-- Product requests: add customer fields
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Withdrawal requests: add processed_at
ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
