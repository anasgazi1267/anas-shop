import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, CreditCard, Truck } from 'lucide-react';

interface Product {
  id: string;
  name_en: string;
  name_bn: string;
  price: number;
  discount_price: number | null;
  is_advance_payment: boolean;
  advance_amount: number | null;
  sizes: string[];
  affiliate_commission: number | null;
}

interface Division {
  id: string;
  name_en: string;
  name_bn: string;
}

interface District {
  id: string;
  division_id: string;
  name_en: string;
  name_bn: string;
  is_dhaka: boolean;
}

interface DeliverySettings {
  inside_dhaka_charge: number;
  outside_dhaka_charge: number;
  free_delivery_threshold: number;
}

export default function OrderForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const refCode = searchParams.get('ref');
  const [product, setProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    division_id: '',
    district_id: '',
    transaction_id: '',
    notes: '',
    selected_size: '',
  });
  const [loading, setLoading] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchSettings();
      fetchDivisions();
      fetchDistricts();
      fetchDeliverySettings();
    }
  }, [id]);

  useEffect(() => {
    if (formData.division_id) {
      const filtered = districts.filter(d => d.division_id === formData.division_id);
      setFilteredDistricts(filtered);
      setFormData(prev => ({ ...prev, district_id: '' }));
    }
  }, [formData.division_id, districts]);

  useEffect(() => {
    if (formData.district_id && deliverySettings) {
      const selectedDistrict = districts.find(d => d.id === formData.district_id);
      if (selectedDistrict) {
        const charge = selectedDistrict.is_dhaka 
          ? deliverySettings.inside_dhaka_charge 
          : deliverySettings.outside_dhaka_charge;
        
        const productPrice = product?.discount_price || product?.price || 0;
        
        // Check if free delivery threshold is met
        if (deliverySettings.free_delivery_threshold > 0 && 
            productPrice >= deliverySettings.free_delivery_threshold) {
          setDeliveryCharge(0);
        } else {
          setDeliveryCharge(charge);
        }
      }
    }
  }, [formData.district_id, deliverySettings, districts, product]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name_en, name_bn, price, discount_price, is_advance_payment, advance_amount, sizes, affiliate_commission')
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

  const fetchDivisions = async () => {
    const { data, error } = await supabase
      .from('divisions')
      .select('*')
      .order('name_en');
    if (!error && data) {
      setDivisions(data);
    }
  };

  const fetchDistricts = async () => {
    const { data, error } = await supabase
      .from('districts')
      .select('*')
      .order('name_en');
    if (!error && data) {
      setDistricts(data);
    }
  };

  const fetchDeliverySettings = async () => {
    const { data, error } = await supabase
      .from('delivery_settings')
      .select('*')
      .single();
    if (!error && data) {
      setDeliverySettings({
        inside_dhaka_charge: Number(data.inside_dhaka_charge),
        outside_dhaka_charge: Number(data.outside_dhaka_charge),
        free_delivery_threshold: Number(data.free_delivery_threshold),
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('Copied to clipboard!', 'ক্লিপবোর্ডে কপি হয়েছে!'));
  };

  const uploadScreenshot = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `screenshots/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Screenshot upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.customer_phone || !formData.customer_address || 
        !formData.division_id || !formData.district_id) {
      toast.error(t('Please fill all required fields', 'সকল প্রয়োজনীয় ক্ষেত্র পূরণ করুন'));
      return;
    }

    if (product?.sizes && product.sizes.length > 0 && !formData.selected_size) {
      toast.error(t('Please select a size', 'সাইজ নির্বাচন করুন'));
      return;
    }

    if (product?.is_advance_payment && !formData.transaction_id) {
      toast.error(
        t('Please enter transaction ID for advance payment', 'অগ্রিম পেমেন্টের জন্য ট্রানজেকশন আইডি লিখুন')
      );
      return;
    }

    setLoading(true);

    let screenshotUrl = null;
    if (screenshotFile && product?.is_advance_payment) {
      screenshotUrl = await uploadScreenshot(screenshotFile);
    }

    const displayPrice = product?.discount_price || product?.price || 0;
    const totalAmount = displayPrice + deliveryCharge;
    const trackingIdResult = await supabase.rpc('generate_tracking_id');
    
    const productSizes = formData.selected_size 
      ? [{ product_id: id, size: formData.selected_size }]
      : [];

    const orderData = {
      tracking_id: trackingIdResult.data || `AS${Date.now().toString().slice(-6)}`,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      customer_address: formData.customer_address,
      division_id: formData.division_id,
      district_id: formData.district_id,
      product_ids: [id],
      total_amount: totalAmount,
      delivery_charge: deliveryCharge,
      advance_amount: product?.is_advance_payment ? product.advance_amount : null,
      transaction_id: formData.transaction_id || null,
      payment_method: product?.is_advance_payment ? 'advance' : 'cod',
      status: 'pending',
      notes: formData.notes,
      payment_screenshot: screenshotUrl,
      product_sizes: productSizes,
    };

    const { data, error } = await supabase.from('orders').insert([orderData]).select().single();

    if (error) {
      toast.error(t('Failed to place order', 'অর্ডার করতে ব্যর্থ হয়েছে'));
      console.error(error);
    } else {
      // Record affiliate earning if referral code exists
      if (refCode && product?.affiliate_commission && product.affiliate_commission > 0) {
        try {
          // Find the affiliate link owner
          const { data: affiliateLink } = await supabase
            .from('affiliate_links')
            .select('user_id')
            .eq('referral_code', refCode)
            .single();

          if (affiliateLink) {
            await supabase.from('affiliate_earnings').insert({
              user_id: affiliateLink.user_id,
              order_id: data.id,
              product_id: id,
              amount: product.affiliate_commission,
              status: 'pending'
            });
          }
        } catch (affError) {
          console.error('Affiliate earning error:', affError);
        }
      }

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
                  <Label>{t('Full Name', 'পুরো নাম')} *</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label>{t('Phone Number', 'ফোন নম্বর')} *</Label>
                  <Input
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Division', 'বিভাগ')} *</Label>
                    <Select
                      value={formData.division_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, division_id: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select Division', 'বিভাগ নির্বাচন করুন')} />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map((division) => (
                          <SelectItem key={division.id} value={division.id}>
                            {language === 'en' ? division.name_en : division.name_bn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('District', 'জেলা')} *</Label>
                    <Select
                      value={formData.district_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, district_id: value })
                      }
                      disabled={!formData.division_id}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select District', 'জেলা নির্বাচন করুন')} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDistricts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {language === 'en' ? district.name_en : district.name_bn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>{t('Detailed Address', 'বিস্তারিত ঠিকানা')} *</Label>
                  <Textarea
                    value={formData.customer_address}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_address: e.target.value })
                    }
                    rows={3}
                    placeholder={t('House/Road/Area details', 'বাসা/রোড/এলাকার বিস্তারিত')}
                    required
                  />
                </div>

                {deliveryCharge > 0 && (
                  <Card className="bg-accent">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-primary" />
                          <span className="font-medium">
                            {t('Delivery Charge', 'ডেলিভারি চার্জ')}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          ৳{deliveryCharge.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <Label>{t('Select Size', 'সাইজ নির্বাচন করুন')} *</Label>
                    <Select
                      value={formData.selected_size}
                      onValueChange={(value) =>
                        setFormData({ ...formData, selected_size: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('Choose size', 'সাইজ বেছে নিন')} />
                      </SelectTrigger>
                      <SelectContent>
                        {product.sizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {product.is_advance_payment && (
                  <>
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

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('Payment Screenshot (Optional)', 'পেমেন্ট স্ক্রিনশট (ঐচ্ছিক)')}
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('Upload payment confirmation screenshot', 'পেমেন্ট নিশ্চিতকরণ স্ক্রিনশট আপলোড করুন')}
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <Label>{t('Additional Notes (Optional)', 'অতিরিক্ত নোট (ঐচ্ছিক)')}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <Card className="bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('Product Price', 'প্রোডাক্ট দাম')}</span>
                        <span className="font-semibold">৳{displayPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('Delivery Charge', 'ডেলিভারি চার্জ')}</span>
                        <span className="font-semibold">৳{deliveryCharge.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-bold">{t('Total Amount', 'মোট পরিমাণ')}</span>
                        <span className="font-bold text-lg text-primary">
                          ৳{(displayPrice + deliveryCharge).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('Processing...', 'প্রক্রিয়াধীন...') : t('Confirm Order', 'অর্ডার নিশ্চিত করুন')}
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
