import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  Link as LinkIcon, 
  Copy, 
  Wallet,
  Clock,
  Check,
  X,
  XCircle
} from 'lucide-react';

interface AffiliateEarning {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product_id: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  payment_method: string;
  account_number: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

interface AffiliateLink {
  id: string;
  product_id: string;
  referral_code: string;
  clicks: number;
  product_name?: string;
}

export default function AffiliateDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useUserAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [earningsRes, withdrawalsRes, linksRes] = await Promise.all([
        supabase.from('affiliate_earnings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('withdrawal_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('affiliate_links').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (earningsRes.data) setEarnings(earningsRes.data);
      if (withdrawalsRes.data) setWithdrawals(withdrawalsRes.data);
      if (linksRes.data) setAffiliateLinks(linksRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('Enter valid amount', 'সঠিক পরিমাণ দিন'));
      return;
    }

    if (amount > availableBalance) {
      toast.error(t('Insufficient balance', 'অপর্যাপ্ত ব্যালেন্স'));
      return;
    }

    if (!paymentMethod || !accountNumber) {
      toast.error(t('Fill all fields', 'সব তথ্য দিন'));
      return;
    }

    try {
      const { error } = await supabase.from('withdrawal_requests').insert({
        user_id: user.id,
        amount,
        payment_method: paymentMethod,
        account_number: accountNumber
      });

      if (error) throw error;

      toast.success(t('Withdrawal request submitted', 'উইথড্রয়াল রিকোয়েস্ট জমা হয়েছে'));
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setPaymentMethod('');
      setAccountNumber('');
      fetchData();
    } catch (error: any) {
      toast.error('সমস্যা হয়েছে: ' + error.message);
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success(t('Link copied!', 'লিংক কপি হয়েছে!'));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />{t('Pending', 'পেন্ডিং')}</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />{t('Approved', 'অনুমোদিত')}</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />{t('Rejected', 'বাতিল')}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />{t('Cancelled', 'ক্যান্সেল')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Calculate totals - exclude cancelled orders
  const totalEarnings = earnings.filter(e => e.status !== 'cancelled').reduce((sum, e) => sum + e.amount, 0);
  const pendingEarnings = earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const withdrawnAmount = withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);
  const availableBalance = totalEarnings - withdrawnAmount - pendingWithdrawals;
  const cancelledCount = earnings.filter(e => e.status === 'cancelled').length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('Affiliate Dashboard', 'এফিলিয়েট ড্যাশবোর্ড')}</h1>
          <p className="text-muted-foreground mt-1">{t('Track your earnings and referrals', 'আপনার আয় এবং রেফারেল ট্র্যাক করুন')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('Total Earnings', 'মোট আয়')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">৳{totalEarnings.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('Available Balance', 'উত্তোলনযোগ্য')}</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">৳{availableBalance.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('Pending', 'পেন্ডিং')}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">৳{pendingEarnings.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('Cancelled', 'ক্যান্সেল')}</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{cancelledCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={availableBalance <= 0}>
                <Wallet className="h-4 w-4 mr-2" />
                {t('Withdraw', 'উত্তোলন করুন')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('Withdraw Earnings', 'আয় উত্তোলন')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-accent rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('Available Balance', 'উত্তোলনযোগ্য')}</p>
                  <p className="text-2xl font-bold text-primary">৳{availableBalance.toLocaleString()}</p>
                </div>
                <div>
                  <Label>{t('Amount', 'পরিমাণ')}</Label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="৳0"
                  />
                </div>
                <div>
                  <Label>{t('Payment Method', 'পেমেন্ট মেথড')}</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select method', 'মেথড নির্বাচন করুন')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bkash">বিকাশ</SelectItem>
                      <SelectItem value="nagad">নগদ</SelectItem>
                      <SelectItem value="rocket">রকেট</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('Account Number', 'অ্যাকাউন্ট নম্বর')}</Label>
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <Button onClick={handleWithdraw} className="w-full">
                  {t('Submit Request', 'রিকোয়েস্ট জমা দিন')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="earnings">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="earnings">{t('Earnings', 'আয়')}</TabsTrigger>
            <TabsTrigger value="links">{t('My Links', 'আমার লিংক')}</TabsTrigger>
            <TabsTrigger value="withdrawals">{t('Withdrawals', 'উত্তোলন')}</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-4">
            {earnings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  {t('No earnings yet', 'এখনো কোনো আয় নেই')}
                </CardContent>
              </Card>
            ) : (
              earnings.map((earning) => (
                <Card key={earning.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">৳{earning.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(earning.created_at).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                    {getStatusBadge(earning.status)}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            {affiliateLinks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  {t('No affiliate links yet. Share products to generate links!', 'এখনো কোনো এফিলিয়েট লিংক নেই। প্রোডাক্ট শেয়ার করুন!')}
                </CardContent>
              </Card>
            ) : (
              affiliateLinks.map((link) => (
                <Card key={link.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm">{link.referral_code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{link.clicks} {t('clicks', 'ক্লিক')}</Badge>
                        <Button size="sm" variant="outline" onClick={() => copyLink(link.referral_code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            {withdrawals.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  {t('No withdrawal requests yet', 'এখনো কোনো উত্তোলন রিকোয়েস্ট নেই')}
                </CardContent>
              </Card>
            ) : (
              withdrawals.map((withdrawal) => (
                <Card key={withdrawal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">৳{withdrawal.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {withdrawal.payment_method}: {withdrawal.account_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(withdrawal.created_at).toLocaleDateString('bn-BD')}
                        </p>
                        {withdrawal.admin_note && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('Note', 'নোট')}: {withdrawal.admin_note}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
