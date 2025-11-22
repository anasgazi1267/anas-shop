import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Banner {
  id: string;
  image_url: string;
  title_en: string | null;
  title_bn: string | null;
  link: string | null;
  is_active: boolean;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    image_url: '',
    title_en: '',
    title_bn: '',
    link: '',
    is_active: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      toast.error('ব্যানার লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const bannerData = formData;

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
        toast.success('ব্যানার আপডেট হয়েছে');
      } else {
        const { error } = await supabase
          .from('banners')
          .insert(bannerData);

        if (error) throw error;
        toast.success('ব্যানার যোগ হয়েছে');
      }

      setDialogOpen(false);
      resetForm();
      fetchBanners();
    } catch (error: any) {
      toast.error('সমস্যা হয়েছে: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত?')) return;

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('ব্যানার ডিলিট হয়েছে');
      fetchBanners();
    } catch (error: any) {
      toast.error('ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      image_url: banner.image_url,
      title_en: banner.title_en || '',
      title_bn: banner.title_bn || '',
      link: banner.link || '',
      is_active: banner.is_active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      image_url: '',
      title_en: '',
      title_bn: '',
      link: '',
      is_active: true,
    });
    setEditingBanner(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ব্যানার ম্যানেজমেন্ট</h1>
            <p className="text-muted-foreground mt-2">হোমপেজ ব্যানার যোগ এবং ম্যানেজ করুন</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                নতুন ব্যানার
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBanner ? 'ব্যানার এডিট করুন' : 'নতুন ব্যানার যোগ করুন'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>ইমেজ URL</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>টাইটেল (ইংরেজি)</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    placeholder="Banner Title"
                  />
                </div>
                <div>
                  <Label>টাইটেল (বাংলা)</Label>
                  <Input
                    value={formData.title_bn}
                    onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                    placeholder="ব্যানার টাইটেল"
                  />
                </div>
                <div>
                  <Label>লিংক (অপশনাল)</Label>
                  <Input
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="/products"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>সক্রিয় করুন</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingBanner ? 'আপডেট করুন' : 'সেভ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {banner.title_bn || banner.title_en || 'Untitled'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {banner.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video overflow-hidden rounded-lg bg-muted mb-4">
                  <img
                    src={banner.image_url}
                    alt={banner.title_bn || ''}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(banner)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    এডিট
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    ডিলিট
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading && <p className="text-center">লোড হচ্ছে...</p>}
        {!loading && banners.length === 0 && (
          <p className="text-center text-muted-foreground">কোন ব্যানার নেই</p>
        )}
      </div>
    </AdminLayout>
  );
}
