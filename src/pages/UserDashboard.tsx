import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Languages, Settings, DollarSign, Wallet, Link2, Copy, Check } from 'lucide-react';
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

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

interface Earning {
  id: string;
  amount: number;
  status: string;
  is_referral_commission: boolean;
  created_at: string;
}

export default function UserDashboard() {
  const { user, loading: authLoading } = useUserAuth();
  const { language, setLanguage, t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    const [profileRes, ordersRes, divisionsRes, earningsRes, withdrawalsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('orders').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('divisions').select('*').order('name_en'),
      supabase.from('affiliate_earnings').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('withdrawal_requests').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (divisionsRes.data) setDivisions(divisionsRes.data);
    if (earningsRes.data) setEarnings(earningsRes.data);
    if (withdrawalsRes.data) setWithdrawals(withdrawalsRes.data);

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
      .upsert({ user_id: user!.id, ...updates });

    if (error) {
      toast.error(t('Failed to update profile', 'প্রোফাইল আপডেট ব্যর্থ হয়েছে'));
    } else {
      toast.success(t('Profile updated successfully', 'প্রোফাইল আপডেট হয়েছে'));
      fetchData();
    }

    setSaving(false);
  };

  const referralLink = user ? `${window.location.origin}/auth?ref=${user.id.slice(0, 8)}` : '';

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(t('Referral link copied!', 'রেফারেল লিংক কপি হয়েছে!'));
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate stats
  const totalEarnings = earnings
    .filter(e => e.status !== 'cancelled')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'approved')
    .reduce((sum, w) => sum + Number(w.amount), 0);
  
  const availableBalance = totalEarnings - totalWithdrawn;

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
      cancelled: 'destructive',
      approved: 'default',
      rejected: 'destructive'
    };

    const labels: Record<string, string> = {
      pending: t('Pending', 'পেন্ডিং'),
      processing: t('Processing', 'প্রসেসিং'),
      shipped: t('Shipped', 'শিপড'),
      delivered: t('Delivered', 'ডেলিভারড'),
      cancelled: t('Cancelled', 'বাতিল'),
      approved: t('Approved', 'অনুমোদিত'),
      rejected: t('Rejected', 'বাতিল')
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">{t('Total Earnings', 'মোট আয়')}</span>
              </div>
              <p className="text-2xl font-bold text-green-600">৳{totalEarnings.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">{t('Available', 'বর্তমান')}</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">৳{availableBalance.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">{t('Orders', 'অর্ডার')}</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{orders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">{t('Withdrawals', 'উত্তোলন')}</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{withdrawals.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {t('Your Referral Link', 'আপনার রেফারেল লিংক')}
            </CardTitle>
            <CardDescription>
              {t('Share this link to earn 5% commission on referral sales', 'এই লিংক শেয়ার করে রেফারেল বিক্রিতে ৫% কমিশন পান')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-sm" />
              <Button onClick={copyReferralLink} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('Profile', 'প্রোফাইল')}</span>
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('Orders', 'অর্ডার')}</span>
            </TabsTrigger>
            <TabsTrigger value="earnings">
              <DollarSign className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('Earnings', 'আয়')}</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              <Wallet className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('Withdrawals', 'উত্তোলন')}</span>
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('Settings', 'সেটিংস')}</span>
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

          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>{t('My Earnings', 'আমার আয়')}</CardTitle>
                <CardDescription>
                  {t('View your affiliate and referral earnings', 'আপনার এফিলিয়েট ও রেফারেল আয় দেখুন')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {earnings.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('No earnings yet', 'এখনও কোন আয় নেই')}</p>
                    <Link to="/affiliate">
                      <Button variant="outline" className="mt-4">
                        {t('Start Earning', 'আয় শুরু করুন')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {earnings.map((earning) => (
                      <div key={earning.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">৳{earning.amount.toLocaleString()}</p>
                            <Badge variant={earning.is_referral_commission ? 'secondary' : 'default'}>
                              {earning.is_referral_commission ? t('Referral', 'রেফারেল') : t('Direct', 'ডাইরেক্ট')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(earning.created_at).toLocaleDateString('bn-BD')}
                          </p>
                        </div>
                        {getStatusBadge(earning.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>{t('Withdrawal History', 'উত্তোলন ইতিহাস')}</CardTitle>
                <CardDescription>
                  {t('View your withdrawal requests', 'আপনার উত্তোলন অনুরোধ দেখুন')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">{t('Available Balance', 'বর্তমান ব্যালেন্স')}</p>
                  <p className="text-3xl font-bold text-primary">৳{availableBalance.toLocaleString()}</p>
                  <Link to="/affiliate">
                    <Button className="mt-4" disabled={availableBalance <= 0}>
                      <Wallet className="h-4 w-4 mr-2" />
                      {t('Withdraw', 'উত্তোলন করুন')}
                    </Button>
                  </Link>
                </div>

                {withdrawals.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('No withdrawals yet', 'এখনও কোন উত্তোলন নেই')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">৳{withdrawal.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {withdrawal.payment_method} • {new Date(withdrawal.created_at).toLocaleDateString('bn-BD')}
                          </p>
                        </div>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                    ))}
                  </div>
                )}
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