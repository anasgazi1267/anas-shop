import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, Wallet, Clock, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    pendingWithdrawals: 0,
    totalWithdrawn: 0,
    totalUsers: 0,
    cancelledOrders: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status');

      const { data: products } = await supabase
        .from('products')
        .select('id');

      const { data: earnings } = await supabase
        .from('affiliate_earnings')
        .select('amount, status');

      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('amount, status');

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const totalOrders = orders?.length || 0;
      const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0;
      const totalRevenue = orders?.filter(o => o.status !== 'cancelled')
        .reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalProducts = products?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

      const totalCommissions = earnings?.filter(e => e.status !== 'cancelled')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const pendingCommissions = earnings?.filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      const totalWithdrawn = withdrawals?.filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      setStats({
        totalOrders,
        totalRevenue,
        totalProducts,
        pendingOrders,
        totalCommissions,
        pendingCommissions,
        pendingWithdrawals,
        totalWithdrawn,
        totalUsers: usersCount || 0,
        cancelledOrders,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    {
      title: 'মোট বিক্রি',
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: 'মোট অর্ডার',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: 'মোট প্রোডাক্ট',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-950',
    },
    {
      title: 'মোট ইউজার',
      value: stats.totalUsers.toString(),
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100 dark:bg-indigo-950',
    },
    {
      title: 'পেন্ডিং অর্ডার',
      value: stats.pendingOrders.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-950',
    },
    {
      title: 'ক্যান্সেল অর্ডার',
      value: stats.cancelledOrders.toString(),
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100 dark:bg-red-950',
    },
    {
      title: 'মোট কমিশন',
      value: `৳${stats.totalCommissions.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-950',
    },
    {
      title: 'পেন্ডিং উইথড্রয়াল',
      value: `৳${stats.pendingWithdrawals.toLocaleString()}`,
      icon: Wallet,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-950',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">ড্যাশবোর্ড</h1>
          <p className="text-muted-foreground mt-2">আপনার শপের সারাংশ দেখুন</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
