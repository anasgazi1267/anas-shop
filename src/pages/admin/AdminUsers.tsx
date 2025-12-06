import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, 
  Eye, 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  ShoppingCart,
  Wallet,
  Users as UsersIcon
} from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string | null;
}

interface AuthUser {
  id: string;
  email?: string;
}

interface UserData extends UserProfile {
  email: string;
  totalEarnings: number;
  totalWithdrawals: number;
  ordersCount: number;
  salesCount: number;
}

interface Order {
  id: string;
  tracking_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer_name: string;
}

interface Earning {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  is_referral_commission: boolean;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  account_number: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userEarnings, setUserEarnings] = useState<Earning[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<Withdrawal[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user data
      const usersWithData: UserData[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get earnings
          const { data: earnings } = await supabase
            .from('affiliate_earnings')
            .select('amount, status')
            .eq('user_id', profile.id);

          const totalEarnings = (earnings || [])
            .filter(e => e.status !== 'cancelled')
            .reduce((sum, e) => sum + Number(e.amount), 0);

          // Get withdrawals
          const { data: withdrawals } = await supabase
            .from('withdrawal_requests')
            .select('amount, status')
            .eq('user_id', profile.id);

          const totalWithdrawals = (withdrawals || [])
            .filter(w => w.status === 'approved')
            .reduce((sum, w) => sum + Number(w.amount), 0);

          // Get orders count - orders placed by this user
          const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          // Get sales count - products sold via affiliate
          const { count: salesCount } = await supabase
            .from('affiliate_earnings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .neq('status', 'cancelled');

          return {
            ...profile,
            email: profile.phone || profile.full_name || profile.id.slice(0, 8),
            totalEarnings,
            totalWithdrawals,
            ordersCount: ordersCount || 0,
            salesCount: salesCount || 0
          };
        })
      );

      setUsers(usersWithData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('ইউজার লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const viewUserDetails = async (user: UserData) => {
    setSelectedUser(user);
    setDetailsOpen(true);

    try {
      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch earnings
      const { data: earnings } = await supabase
        .from('affiliate_earnings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setUserOrders(orders || []);
      setUserEarnings(earnings || []);
      setUserWithdrawals(withdrawals || []);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      cancelled: 'destructive',
      delivered: 'outline',
      processing: 'default'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm) ||
    user.id.includes(searchTerm)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ইউজার ম্যানেজমেন্ট</h1>
            <p className="text-muted-foreground mt-2">সকল ইউজারদের তথ্য দেখুন</p>
          </div>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{users.length}</span>
              <span className="text-muted-foreground">মোট ইউজার</span>
            </div>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="নাম, ফোন বা ID দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইউজার ID</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead>মোট আয়</TableHead>
                  <TableHead>উত্তোলন</TableHead>
                  <TableHead>অর্ডার</TableHead>
                  <TableHead>বিক্রি</TableHead>
                  <TableHead>একশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      লোড হচ্ছে...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      কোন ইউজার পাওয়া যায়নি
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                      <TableCell>{user.phone || 'N/A'}</TableCell>
                      <TableCell className="text-green-600 font-medium">৳{user.totalEarnings.toLocaleString()}</TableCell>
                      <TableCell className="text-blue-600">৳{user.totalWithdrawals.toLocaleString()}</TableCell>
                      <TableCell>{user.ordersCount}</TableCell>
                      <TableCell>{user.salesCount}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => viewUserDetails(user)}>
                          <Eye className="h-4 w-4 mr-1" />
                          বিস্তারিত
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ইউজার বিস্তারিত
              </DialogTitle>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6">
                {/* User Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">প্রোফাইল তথ্য</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">নাম</p>
                        <p className="font-medium">{selectedUser.full_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ফোন</p>
                        <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ঠিকানা</p>
                        <p className="font-medium">{selectedUser.address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">যোগদান</p>
                        <p className="font-medium">
                          {selectedUser.created_at 
                            ? new Date(selectedUser.created_at).toLocaleDateString('bn-BD')
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">মোট আয়</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">৳{selectedUser.totalEarnings.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-muted-foreground">উত্তোলন</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">৳{selectedUser.totalWithdrawals.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-muted-foreground">অর্ডার</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{selectedUser.ordersCount}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-muted-foreground">বিক্রি</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">{selectedUser.salesCount}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs for details */}
                <Tabs defaultValue="earnings">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="earnings">আয় ({userEarnings.length})</TabsTrigger>
                    <TabsTrigger value="withdrawals">উত্তোলন ({userWithdrawals.length})</TabsTrigger>
                    <TabsTrigger value="orders">অর্ডার ({userOrders.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="earnings" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>তারিখ</TableHead>
                          <TableHead>পরিমাণ</TableHead>
                          <TableHead>টাইপ</TableHead>
                          <TableHead>স্ট্যাটাস</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userEarnings.map((earning) => (
                          <TableRow key={earning.id}>
                            <TableCell>{new Date(earning.created_at).toLocaleDateString('bn-BD')}</TableCell>
                            <TableCell className="font-medium">৳{earning.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={earning.is_referral_commission ? 'secondary' : 'default'}>
                                {earning.is_referral_commission ? 'রেফারেল' : 'ডাইরেক্ট'}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(earning.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="withdrawals" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>তারিখ</TableHead>
                          <TableHead>পরিমাণ</TableHead>
                          <TableHead>মেথড</TableHead>
                          <TableHead>নাম্বার</TableHead>
                          <TableHead>স্ট্যাটাস</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userWithdrawals.map((withdrawal) => (
                          <TableRow key={withdrawal.id}>
                            <TableCell>{new Date(withdrawal.created_at).toLocaleDateString('bn-BD')}</TableCell>
                            <TableCell className="font-medium">৳{withdrawal.amount.toLocaleString()}</TableCell>
                            <TableCell>{withdrawal.payment_method}</TableCell>
                            <TableCell>{withdrawal.account_number}</TableCell>
                            <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="orders" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ট্র্যাকিং ID</TableHead>
                          <TableHead>তারিখ</TableHead>
                          <TableHead>মোট</TableHead>
                          <TableHead>স্ট্যাটাস</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono">{order.tracking_id}</TableCell>
                            <TableCell>{new Date(order.created_at).toLocaleDateString('bn-BD')}</TableCell>
                            <TableCell className="font-medium">৳{order.total_amount.toLocaleString()}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
