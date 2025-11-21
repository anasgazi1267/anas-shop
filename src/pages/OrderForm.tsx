import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, CreditCard } from 'lucide-react';

interface Product {
  id: string;
  name_en: string;
  name_bn: string;
  price: number;
  discount_price: number | null;
  is_advance_payment: boolean;
  advance_amount: number | null;
}

export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    transaction_id: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchSettings();
    }
  }, [id]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name_en, name_bn, price, discount_price, is_advance_payment, advance_amount')
      .eq('id', id)
      .single();

    if (error) {
      toast.error(t('Product not found', 'পণ্য পাওয়া যায়নি'));
      navigate('/products');
    } else {
      setProduct(data);
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('settings').select('*');
    if (!error && data) {
      const settingsMap: Record<string, string> = {};
      data.forEach((item) => {
        settingsMap[item.key] = item.value;
      });
      setSettings(settingsMap);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('Copied to clipboard!', 'ক্লিপবোর্ডে কপি হয়েছে!'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.customer_phone || !formData.customer_address) {
      toast.error(t('Please fill all required fields', 'সকল প্রয়োজনীয় ক্ষেত্র পূরণ করুন'));
      return;
    }

    if (product?.is_advance_payment && !formData.transaction_id) {
      toast.error(
        t('Please enter transaction ID for advance payment', 'অগ্রিম পেমেন্টের জন্য ট্রানজেকশন আইডি লিখুন')
      );
      return;
    }

    setLoading(true);

    const displayPrice = product?.discount_price || product?.price || 0;
    const trackingIdResult = await supabase.rpc('generate_tracking_id');
    
    const orderData = {
      tracking_id: trackingIdResult.data || `AS${Date.now().toString().slice(-6)}`,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      customer_address: formData.customer_address,
      product_ids: [id],
      total_amount: displayPrice,
      advance_amount: product?.is_advance_payment ? product.advance_amount : null,
      transaction_id: formData.transaction_id || null,
      payment_method: product?.is_advance_payment ? 'advance' : 'cod',
      status: 'pending',
      notes: formData.notes,
    };

    const { data, error } = await supabase.from('orders').insert([orderData]).select().single();

    if (error) {
      toast.error(t('Failed to place order', 'অর্ডার করতে ব্যর্থ হয়েছে'));
      console.error(error);
    } else {
      toast.success(
        t('Order placed successfully!', 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!')
      );
      navigate(`/order-success/${data.tracking_id}`);
    }
    setLoading(false);
  };

  if (!product) {
    return null;
  }

  const name = language === 'en' ? product.name_en : product.name_bn;
  const displayPrice = product.discount_price || product.price;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">
            {t('Place Your Order', 'অর্ডার করুন')}
          </h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{name}</CardTitle>
              <CardDescription className="text-2xl font-bold text-primary">
                ৳{displayPrice.toLocaleString()}
              </CardDescription>
            </CardHeader>
          </Card>

          {product.is_advance_payment && product.advance_amount && (
            <Card className="mb-6 bg-accent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle>
                    {t('Advance Payment Required', 'অগ্রিম পেমেন্ট প্রয়োজন')}
                  </CardTitle>
                </div>
                <CardDescription className="text-2xl font-bold text-primary">
                  ৳{product.advance_amount.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">
                    {t('Bkash Number', 'বিকাশ নম্বর')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={settings.bkash_number || '01401757283'} readOnly />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(settings.bkash_number || '01401757283')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">
                    {t('Nagad Number', 'নগদ নম্বর')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={settings.nagad_number || '01401757283'} readOnly />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(settings.nagad_number || '01401757283')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('Customer Information', 'গ্রাহক তথ্য')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('Full Name', 'পুরো নাম')} *
                  </label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('Phone Number', 'ফোন নম্বর')} *
                  </label>
                  <Input
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('Delivery Address', 'ডেলিভারি ঠিকানা')} *
                  </label>
                  <Textarea
                    value={formData.customer_address}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_address: e.target.value })
                    }
                    rows={3}
                    required
                  />
                </div>

                {product.is_advance_payment && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('Transaction ID', 'ট্রানজেকশন আইডি')} *
                    </label>
                    <Input
                      value={formData.transaction_id}
                      onChange={(e) =>
                        setFormData({ ...formData, transaction_id: e.target.value })
                      }
                      placeholder={t('Enter bKash/Nagad transaction ID', 'বিকাশ/নগদ ট্রানজেকশন আইডি লিখুন')}
                      required={product.is_advance_payment}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('Additional Notes (Optional)', 'অতিরিক্ত নোট (ঐচ্ছিক)')}
                  </label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {t('Confirm Order', 'অর্ডার নিশ্চিত করুন')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
