import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState({
    inside_dhaka_charge: 50,
    outside_dhaka_charge: 70,
    free_delivery_threshold: 0,
  });

  const [affiliateSettings, setAffiliateSettings] = useState({
    referral_commission_rate: 5,
    minimum_withdrawal: 500,
  });

  const [paymentInfo, setPaymentInfo] = useState({
    bkash_number: '',
    nagad_number: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: delivery } = await supabase
        .from('delivery_settings')
        .select('*')
        .maybeSingle();

      if (delivery) {
        setDeliverySettings({
          inside_dhaka_charge: Number(delivery.inside_dhaka_charge),
          outside_dhaka_charge: Number(delivery.outside_dhaka_charge),
          free_delivery_threshold: Number(delivery.free_delivery_threshold),
        });
      }

      const { data: settings } = await supabase
        .from('settings')
        .select('*');

      if (settings) {
        const bkash = settings.find(s => s.key === 'bkash_number');
        const nagad = settings.find(s => s.key === 'nagad_number');
        const referralRate = settings.find(s => s.key === 'referral_commission_rate');
        const minWithdraw = settings.find(s => s.key === 'minimum_withdrawal');

        setPaymentInfo({
          bkash_number: bkash?.value || '',
          nagad_number: nagad?.value || '',
        });

        setAffiliateSettings({
          referral_commission_rate: Number(referralRate?.value) || 5,
          minimum_withdrawal: Number(minWithdraw?.value) || 500,
        });
      }
    } catch (error) {
      toast.error('সেটিংস লোড করতে সমস্যা হয়েছে');
    }
  };

  const saveDeliverySettings = async () => {
    try {
      setLoading(true);
      const { data: existing } = await supabase
        .from('delivery_settings')
        .select('id')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('delivery_settings')
          .update(deliverySettings)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('delivery_settings')
          .insert(deliverySettings);
        if (error) throw error;
      }

      toast.success('ডেলিভারি সেটিংস সেভ হয়েছে');
    } catch (error: any) {
      toast.error('সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAffiliateSettings = async () => {
    try {
      setLoading(true);

      await supabase.from('settings').upsert({ key: 'referral_commission_rate', value: affiliateSettings.referral_commission_rate.toString() });
      await supabase.from('settings').upsert({ key: 'minimum_withdrawal', value: affiliateSettings.minimum_withdrawal.toString() });

      toast.success('এফিলিয়েট সেটিংস সেভ হয়েছে');
    } catch (error: any) {
      toast.error('সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const savePaymentInfo = async () => {
    try {
      setLoading(true);
      await supabase.from('settings').upsert({ key: 'bkash_number', value: paymentInfo.bkash_number });
      await supabase.from('settings').upsert({ key: 'nagad_number', value: paymentInfo.nagad_number });
      toast.success('পেমেন্ট ইনফো সেভ হয়েছে');
    } catch (error: any) {
      toast.error('সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">সেটিংস</h1>
          <p className="text-muted-foreground mt-2">আপনার শপের সেটিংস কনফিগার করুন</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ডেলিভারি চার্জ</CardTitle>
            <CardDescription>ঢাকার ভিতরে এবং বাইরের ডেলিভারি চার্জ সেট করুন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>ঢাকার ভিতরে ডেলিভারি চার্জ (৳)</Label>
              <Input
                type="number"
                value={deliverySettings.inside_dhaka_charge}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, inside_dhaka_charge: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>ঢাকার বাইরে ডেলিভারি চার্জ (৳)</Label>
              <Input
                type="number"
                value={deliverySettings.outside_dhaka_charge}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, outside_dhaka_charge: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>ফ্রি ডেলিভারি থ্রেশহোল্ড (৳)</Label>
              <Input
                type="number"
                value={deliverySettings.free_delivery_threshold}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, free_delivery_threshold: Number(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground mt-1">এই পরিমাণের উপরে ফ্রি ডেলিভারি। 0 মানে ডিসেবল।</p>
            </div>
            <Button onClick={saveDeliverySettings} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />সেভ করুন
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>এফিলিয়েট সেটিংস</CardTitle>
            <CardDescription>রেফারেল কমিশন রেট এবং মিনিমাম উইথড্রয়াল সেট করুন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>রেফারেল কমিশন রেট (%)</Label>
              <Input
                type="number"
                value={affiliateSettings.referral_commission_rate}
                onChange={(e) => setAffiliateSettings({ ...affiliateSettings, referral_commission_rate: Number(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground mt-1">রেফার করা ইউজারের বিক্রি থেকে এই % কমিশন পাবে</p>
            </div>
            <div>
              <Label>মিনিমাম উইথড্রয়াল (৳)</Label>
              <Input
                type="number"
                value={affiliateSettings.minimum_withdrawal}
                onChange={(e) => setAffiliateSettings({ ...affiliateSettings, minimum_withdrawal: Number(e.target.value) })}
              />
            </div>
            <Button onClick={saveAffiliateSettings} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />সেভ করুন
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>পেমেন্ট ইনফরমেশন</CardTitle>
            <CardDescription>বিকাশ এবং নগদ নাম্বার সেট করুন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>বিকাশ নাম্বার</Label>
              <Input
                value={paymentInfo.bkash_number}
                onChange={(e) => setPaymentInfo({ ...paymentInfo, bkash_number: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <Label>নগদ নাম্বার</Label>
              <Input
                value={paymentInfo.nagad_number}
                onChange={(e) => setPaymentInfo({ ...paymentInfo, nagad_number: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <Button onClick={savePaymentInfo} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />সেভ করুন
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
