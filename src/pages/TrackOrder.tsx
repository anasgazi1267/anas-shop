import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  tracking_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function TrackOrder() {
  const { t } = useLanguage();
  const [trackingId, setTrackingId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      toast.error(t('Please enter a tracking ID', 'ট্র্যাকিং আইডি লিখুন'));
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tracking_id', trackingId.toUpperCase())
      .single();

    if (error || !data) {
      toast.error(t('Order not found', 'অর্ডার পাওয়া যায়নি'));
      setOrder(null);
    } else {
      setOrder(data);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6" />;
      case 'processing':
        return <Package className="h-6 w-6" />;
      case 'shipped':
        return <Truck className="h-6 w-6" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6" />;
      default:
        return <Package className="h-6 w-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, [string, string]> = {
      pending: ['Pending', 'অপেক্ষমাণ'],
      processing: ['Processing', 'প্রক্রিয়াধীন'],
      shipped: ['Shipped', 'পাঠানো হয়েছে'],
      delivered: ['Delivered', 'ডেলিভারড'],
    };
    const [en, bn] = statusMap[status] || ['Unknown', 'অজানা'];
    return t(en, bn);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">
            {t('Track Your Order', 'আপনার অর্ডার ট্র্যাক করুন')}
          </h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('Enter Tracking ID', 'ট্র্যাকিং আইডি লিখুন')}</CardTitle>
              <CardDescription>
                {t(
                  'Enter your order tracking ID to see the current status',
                  'আপনার অর্ডারের বর্তমান অবস্থা দেখতে ট্র্যাকিং আইডি লিখুন'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder={t('e.g., AS123456', 'যেমন: AS123456')}
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {t('Search', 'খুঁজুন')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {order && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {t('Order Details', 'অর্ডার বিবরণ')}
                  </CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('Tracking ID', 'ট্র্যাকিং আইডি')}
                    </p>
                    <p className="font-semibold">{order.tracking_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('Total Amount', 'মোট পরিমাণ')}
                    </p>
                    <p className="font-semibold">৳{order.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('Customer Name', 'গ্রাহকের নাম')}
                    </p>
                    <p className="font-semibold">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('Phone', 'ফোন')}
                    </p>
                    <p className="font-semibold">{order.customer_phone}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('Delivery Address', 'ডেলিভারি ঠিকানা')}
                  </p>
                  <p className="font-semibold">{order.customer_address}</p>
                </div>

                <div className="relative pt-8">
                  <div className="flex justify-between items-center">
                    {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
                      const isActive = ['pending', 'processing', 'shipped', 'delivered']
                        .indexOf(order.status) >= index;
                      
                      return (
                        <div key={status} className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isActive ? getStatusColor(status) : 'bg-muted'
                            } text-white mb-2`}
                          >
                            {getStatusIcon(status)}
                          </div>
                          <p className="text-xs text-center font-medium">
                            {getStatusText(status)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute top-14 left-0 right-0 h-1 bg-muted -z-0">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: `${
                          (['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) /
                            3) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
