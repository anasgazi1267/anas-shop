import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, Package, Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Order {
  id: string;
  tracking_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_charge: number;
  payment_method: string | null;
  transaction_id: string | null;
  notes: string | null;
  payment_screenshot: string | null;
  product_sizes: any;
  product_ids: string[] | null;
  movedrop_order_id: string | null;
  order_source: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [productTypes, setProductTypes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchOrders();
    fetchProductTypes();
  }, []);

  const fetchProductTypes = async () => {
    const { data } = await supabase.from('products').select('id, product_type');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(p => { map[p.id] = p.product_type || 'own'; });
      setProductTypes(map);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error('অর্ডার লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;

      if (newStatus === 'cancelled') {
        await supabase.from('affiliate_earnings').update({ status: 'cancelled' }).eq('order_id', orderId);
      }
      if (newStatus === 'delivered') {
        await supabase.from('affiliate_earnings').update({ status: 'confirmed' }).eq('order_id', orderId);
      }

      toast.success('অর্ডার স্ট্যাটাস আপডেট হয়েছে');
      fetchOrders();
    } catch (error: any) {
      toast.error('আপডেট করতে সমস্যা হয়েছে: ' + error.message);
    }
  };

  const isDropshipOrder = (order: Order) => {
    if (!order.product_ids) return false;
    return order.product_ids.some(pid => productTypes[pid] === 'dropship');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'shipped': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'অপেক্ষমাণ',
      processing: 'প্রক্রিয়াধীন',
      shipped: 'পাঠানো হয়েছে',
      delivered: 'ডেলিভারড',
      cancelled: 'ক্যান্সেল',
    };
    return statusMap[status] || 'অজানা';
  };

  const filteredOrders = filterSource === 'all'
    ? orders
    : filterSource === 'dropship'
      ? orders.filter(o => isDropshipOrder(o))
      : orders.filter(o => !isDropshipOrder(o));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">অর্ডার ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground mt-2">সব অর্ডার দেখুন এবং ম্যানেজ করুন</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant={filterSource === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterSource('all')}>
            সব ({orders.length})
          </Button>
          <Button variant={filterSource === 'own' ? 'default' : 'outline'} size="sm" onClick={() => setFilterSource('own')}>
            <Package className="h-4 w-4 mr-1" /> নিজের
          </Button>
          <Button variant={filterSource === 'dropship' ? 'default' : 'outline'} size="sm" onClick={() => setFilterSource('dropship')}>
            <Truck className="h-4 w-4 mr-1" /> ড্রপশিপিং
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {order.customer_name}
                      {isDropshipOrder(order) && (
                        <Badge className="bg-blue-500 text-xs">🚚 ড্রপশিপ</Badge>
                      )}
                      {order.movedrop_order_id && (
                        <Badge variant="outline" className="text-xs">MD: {order.movedrop_order_id}</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">ট্র্যাকিং: {order.tracking_id}</p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ফোন</p>
                    <p className="font-medium">{order.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">মোট পরিমাণ</p>
                    <p className="font-medium">৳{order.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ডেলিভারি চার্জ</p>
                    <p className="font-medium">৳{order.delivery_charge || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">তারিখ</p>
                    <p className="font-medium">{new Date(order.created_at).toLocaleDateString('bn-BD')}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                    <SelectTrigger className="flex-1 min-w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
                      <SelectItem value="processing">প্রক্রিয়াধীন</SelectItem>
                      <SelectItem value="shipped">পাঠানো হয়েছে</SelectItem>
                      <SelectItem value="delivered">ডেলিভারড</SelectItem>
                      <SelectItem value="cancelled">ক্যান্সেল</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => { setSelectedOrder(order); setDialogOpen(true); }}
                  >
                    <Eye className="h-4 w-4 mr-2" /> বিস্তারিত
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading && <p className="text-center">লোড হচ্ছে...</p>}
        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">কোন অর্ডার নেই</p>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>অর্ডার বিস্তারিত</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ট্র্যাকিং আইডি</p>
                    <p className="font-semibold">{selectedOrder.tracking_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">স্ট্যাটাস</p>
                    <Badge className={getStatusColor(selectedOrder.status)}>{getStatusText(selectedOrder.status)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">গ্রাহকের নাম</p>
                    <p className="font-semibold">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ফোন নাম্বার</p>
                    <p className="font-semibold">{selectedOrder.customer_phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">ঠিকানা</p>
                    <p className="font-semibold">{selectedOrder.customer_address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">মোট পরিমাণ</p>
                    <p className="font-semibold">৳{selectedOrder.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ডেলিভারি চার্জ</p>
                    <p className="font-semibold">৳{selectedOrder.delivery_charge || 0}</p>
                  </div>
                  {isDropshipOrder(selectedOrder) && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">অর্ডার টাইপ</p>
                      <Badge className="bg-blue-500">🚚 ড্রপশিপিং প্রোডাক্ট</Badge>
                      {selectedOrder.movedrop_order_id && (
                        <p className="text-sm mt-1">MoveDrop ID: {selectedOrder.movedrop_order_id}</p>
                      )}
                    </div>
                  )}
                  {selectedOrder.payment_method && (
                    <div>
                      <p className="text-sm text-muted-foreground">পেমেন্ট মেথড</p>
                      <p className="font-semibold">{selectedOrder.payment_method}</p>
                    </div>
                  )}
                  {selectedOrder.transaction_id && (
                    <div>
                      <p className="text-sm text-muted-foreground">ট্রানজেকশন আইডি</p>
                      <p className="font-semibold">{selectedOrder.transaction_id}</p>
                    </div>
                  )}
                  {selectedOrder.product_sizes && Array.isArray(selectedOrder.product_sizes) && selectedOrder.product_sizes.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">সাইজ</p>
                      <p className="font-semibold">{selectedOrder.product_sizes.map((ps: any) => ps.size).join(', ')}</p>
                    </div>
                  )}
                  {selectedOrder.payment_screenshot && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">পেমেন্ট স্ক্রিনশট</p>
                      <img src={selectedOrder.payment_screenshot} alt="Payment Screenshot" className="max-w-md rounded-lg border" />
                    </div>
                  )}
                  {selectedOrder.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">নোট</p>
                      <p className="font-semibold">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
