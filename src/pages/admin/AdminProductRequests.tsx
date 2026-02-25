import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

interface ProductRequest {
  id: string;
  product_name: string;
  description: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
}

export default function AdminProductRequests() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('product_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error('রিকোয়েস্ট লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('product_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success('স্ট্যাটাস আপডেট হয়েছে');
      fetchRequests();
    } catch (error: any) {
      toast.error('আপডেট করতে সমস্যা হয়েছে');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'অপেক্ষমাণ',
      approved: 'অনুমোদিত',
      rejected: 'প্রত্যাখ্যাত',
    };
    return statusMap[status] || 'অজানা';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">প্রোডাক্ট রিকোয়েস্ট</h1>
          <p className="text-muted-foreground mt-2">গ্রাহকদের প্রোডাক্ট রিকোয়েস্ট দেখুন এবং ম্যানেজ করুন</p>
        </div>

        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.product_name}</CardTitle>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusText(request.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.description && (
                  <p className="text-sm text-muted-foreground">{request.description}</p>
                )}
                {request.image_url && (
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                    <img
                      src={request.image_url}
                      alt={request.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">গ্রাহকের নাম</p>
                    <p className="font-semibold">{request.customer_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ফোন নাম্বার</p>
                    <p className="font-semibold">{request.customer_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">তারিখ</p>
                    <p className="font-semibold">
                      {new Date(request.created_at).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                </div>
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => updateStatus(request.id, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      অনুমোদন করুন
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateStatus(request.id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      প্রত্যাখ্যান করুন
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {loading && <p className="text-center">লোড হচ্ছে...</p>}
        {!loading && requests.length === 0 && (
          <p className="text-center text-muted-foreground">কোন রিকোয়েস্ট নেই</p>
        )}
      </div>
    </AdminLayout>
  );
}
