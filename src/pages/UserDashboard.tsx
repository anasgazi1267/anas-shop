import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, Package, Heart, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserDashboard() {
  const { user, loading: authLoading } = useUserAuth();
  const { language, setLanguage, t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    const [profileRes, ordersRes, divisionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle(),
      supabase.from('orders').select('*').eq('customer_phone', user!.email).order('created_at', { ascending: false }),
      supabase.from('divisions').select('*').order('name_en')
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (divisionsRes.data) setDivisions(divisionsRes.data);

    setLoading(false);
  };

  useEffect(() => {
    if (profile?.division_id) {
      fetchDistricts(profile.division_id);
    }
  }, [profile?.division_id]);

  const fetchDistricts = async (divisionId: string) => {
    const { data } = await supabase
      .from('districts')
      .select('*')
      .eq('division_id', divisionId)
      .order('name_en');
    
    if (data) setDistricts(data);
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const updates = {
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      division_id: profile.division_id,
      district_id: profile.district_id,
    };

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user!.id, ...updates });

    if (error) {
      toast.error(t('Failed to update profile', 'প্রোফাইল আপডেট ব্যর্থ হয়েছে'));
    } else {
      toast.success(t('Profile updated successfully', 'প্রোফাইল আপডেট হয়েছে'));
      fetchData();
    }

    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processing: 'default',
      shipped: 'default',
      delivered: 'outline',
      cancelled: 'destructive'
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-full">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('My Dashboard', 'আমার ড্যাশবোর্ড')}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              {t('Profile', 'প্রোফাইল')}
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="h-4 w-4 mr-2" />
              {t('Orders', 'অর্ডার')}
            </TabsTrigger>
            <TabsTrigger value="wishlist">
              <Heart className="h-4 w-4 mr-2" />
              {t('Wishlist', 'উইশলিস্ট')}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              {t('Settings', 'সেটিংস')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t('Profile Information', 'প্রোফাইল তথ্য')}</CardTitle>
                <CardDescription>
                  {t('Update your personal information', 'আপনার ব্যক্তিগত তথ্য আপডেট করুন')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('Full Name', 'পুরো নাম')}</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      defaultValue={profile?.full_name || ''}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('Phone', 'ফোন')}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={profile?.phone || ''}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('Division', 'বিভাগ')}</Label>
                      <Select
                        value={profile?.division_id || ''}
                        onValueChange={(value) => {
                          setProfile({ ...profile, division_id: value, district_id: null });
                          fetchDistricts(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('Select division', 'বিভাগ নির্বাচন করুন')} />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.map((div) => (
                            <SelectItem key={div.id} value={div.id}>
                              {language === 'bn' ? div.name_bn : div.name_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('District', 'জেলা')}</Label>
                      <Select
                        value={profile?.district_id || ''}
                        onValueChange={(value) => setProfile({ ...profile, district_id: value })}
                        disabled={!profile?.division_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('Select district', 'জেলা নির্বাচন করুন')} />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((dist) => (
                            <SelectItem key={dist.id} value={dist.id}>
                              {language === 'bn' ? dist.name_bn : dist.name_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">{t('Address', 'ঠিকানা')}</Label>
                    <Textarea
                      id="address"
                      name="address"
                      defaultValue={profile?.address || ''}
                      rows={3}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? t('Saving...', 'সংরক্ষণ করা হচ্ছে...') : t('Save Changes', 'পরিবর্তন সংরক্ষণ করুন')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>{t('My Orders', 'আমার অর্ডার')}</CardTitle>
                <CardDescription>
                  {t('View your order history', 'আপনার অর্ডার ইতিহাস দেখুন')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('No orders yet', 'এখনও কোন অর্ডার নেই')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">#{order.tracking_id}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('bn-BD')}
                            </p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-bold">৳{order.total_amount}</span>
                          <Link to={`/track-order?tracking=${order.tracking_id}`}>
                            <Button variant="outline" size="sm">
                              {t('Track Order', 'ট্র্যাক করুন')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wishlist">
            <Card>
              <CardHeader>
                <CardTitle>{t('My Wishlist', 'আমার উইশলিস্ট')}</CardTitle>
                <CardDescription>
                  {t('Your favorite products', 'আপনার পছন্দের পণ্য')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  {t('Wishlist feature coming soon', 'উইশলিস্ট ফিচার শীঘ্রই আসছে')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>{t('App Settings', 'অ্যাপ সেটিংস')}</CardTitle>
                <CardDescription>
                  {t('Manage your preferences', 'আপনার পছন্দ পরিচালনা করুন')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    {t('Language / ভাষা', 'ভাষা / Language')}
                  </h3>
                  <div className="flex gap-3">
                    <Button
                      variant={language === 'bn' ? 'default' : 'outline'}
                      onClick={() => setLanguage('bn')}
                      className="flex items-center gap-2 flex-1"
                    >
                      <Languages className="h-4 w-4" />
                      বাংলা
                    </Button>
                    <Button
                      variant={language === 'en' ? 'default' : 'outline'}
                      onClick={() => setLanguage('en')}
                      className="flex items-center gap-2 flex-1"
                    >
                      <Languages className="h-4 w-4" />
                      English
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}
