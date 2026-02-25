import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CreditCard, Upload } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  name_bn: string | null;
  logo_url: string | null;
  account_number?: string | null;
  is_active: boolean;
  display_order: number;
}

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_bn: '',
    logo_url: '',
    account_number: '',
    is_active: true,
    display_order: 0
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('পেমেন্ট মেথড লোড করতে সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-${Date.now()}.${fileExt}`;
      const filePath = `payment-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, logo_url: publicUrl });
      toast.success('লোগো আপলোড হয়েছে');
    } catch (error: any) {
      toast.error('আপলোড ব্যর্থ: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(formData)
          .eq('id', editingMethod.id);

        if (error) throw error;
        toast.success('পেমেন্ট মেথড আপডেট হয়েছে');
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert(formData);

        if (error) throw error;
        toast.success('পেমেন্ট মেথড যোগ হয়েছে');
      }

      setDialogOpen(false);
      resetForm();
      fetchMethods();
    } catch (error: any) {
      toast.error('সমস্যা হয়েছে: ' + error.message);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      name_bn: method.name_bn,
      logo_url: method.logo_url || '',
      account_number: method.account_number || '',
      is_active: method.is_active,
      display_order: method.display_order
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই পেমেন্ট মেথড মুছে ফেলতে চান?')) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('পেমেন্ট মেথড মুছে ফেলা হয়েছে');
      fetchMethods();
    } catch (error: any) {
      toast.error('মুছতে সমস্যা: ' + error.message);
    }
  };

  const toggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !method.is_active })
        .eq('id', method.id);

      if (error) throw error;
      fetchMethods();
    } catch (error: any) {
      toast.error('আপডেট ব্যর্থ');
    }
  };

  const resetForm = () => {
    setEditingMethod(null);
    setFormData({
      name: '',
      name_bn: '',
      logo_url: '',
      account_number: '',
      is_active: true,
      display_order: 0
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">পেমেন্ট মেথড</h1>
            <p className="text-muted-foreground mt-2">বিকাশ, নগদ, রকেট ইত্যাদি ম্যানেজ করুন</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                নতুন মেথড
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMethod ? 'পেমেন্ট মেথড এডিট' : 'নতুন পেমেন্ট মেথড'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>নাম (English)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="bKash"
                    required
                  />
                </div>
                <div>
                  <Label>নাম (বাংলা)</Label>
                  <Input
                    value={formData.name_bn}
                    onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                    placeholder="বিকাশ"
                    required
                  />
                </div>
                <div>
                  <Label>অ্যাকাউন্ট নাম্বার</Label>
                  <Input
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div>
                  <Label>লোগো</Label>
                  {formData.logo_url && (
                    <img src={formData.logo_url} alt="Logo" className="h-12 mb-2 object-contain" />
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="লোগো URL"
                    />
                    <Button type="button" variant="outline" disabled={uploading} asChild>
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>ক্রম</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>সক্রিয়</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editingMethod ? 'আপডেট করুন' : 'যোগ করুন'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>লোগো</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead>নাম্বার</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>একশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">লোড হচ্ছে...</TableCell>
                  </TableRow>
                ) : methods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      কোন পেমেন্ট মেথড নেই
                    </TableCell>
                  </TableRow>
                ) : (
                  methods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        {method.logo_url ? (
                          <img src={method.logo_url} alt={method.name} className="h-8 w-auto object-contain" />
                        ) : (
                          <CreditCard className="h-8 w-8 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">{method.name_bn}</p>
                        </div>
                      </TableCell>
                      <TableCell>{method.account_number || 'N/A'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={method.is_active}
                          onCheckedChange={() => toggleActive(method)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(method)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(method.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
