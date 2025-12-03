import { useEffect, useState, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload, Image, Loader2 } from 'lucide-react';

interface Banner {
  id: string;
  image_url: string;
  title_en: string | null;
  title_bn: string | null;
  link: string | null;
  is_active: boolean;
  display_order: number;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title_en: '',
    title_bn: '',
    link: '',
    is_active: true,
    display_order: 0,
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

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `banner-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('banner-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('banner-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const deleteOldImage = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      await supabase.storage.from('banner-images').remove([fileName]);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      
      let imageUrl = editingBanner?.image_url || '';
      
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
        
        // Delete old image if editing
        if (editingBanner?.image_url) {
          await deleteOldImage(editingBanner.image_url);
        }
      }

      if (!imageUrl) {
        toast.error('অনুগ্রহ করে একটি ছবি আপলোড করুন');
        setUploading(false);
        return;
      }

      const bannerData = {
        ...formData,
        image_url: imageUrl,
      };

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
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm('আপনি কি নিশ্চিত?')) return;

    try {
      // Delete image from storage
      if (banner.image_url) {
        await deleteOldImage(banner.image_url);
      }

      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', banner.id);

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
      title_en: banner.title_en || '',
      title_bn: banner.title_bn || '',
      link: banner.link || '',
      is_active: banner.is_active,
      display_order: banner.display_order || 0,
    });
    setImagePreview(banner.image_url);
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title_en: '',
      title_bn: '',
      link: '',
      is_active: true,
      display_order: 0,
    });
    setEditingBanner(null);
    setImagePreview(null);
    setSelectedFile(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ব্যানার ম্যানেজমেন্ট</h1>
            <p className="text-muted-foreground mt-2">হোমপেজ স্লাইডার ব্যানার যোগ এবং ম্যানেজ করুন</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                নতুন ব্যানার
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingBanner ? 'ব্যানার এডিট করুন' : 'নতুন ব্যানার যোগ করুন'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <Label>ব্যানার ছবি</Label>
                  <div 
                    className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                          <p className="text-sm font-medium">ক্লিক করে পরিবর্তন করুন</p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8">
                        <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">ক্লিক করে ছবি আপলোড করুন</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (সর্বোচ্চ 5MB)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>লিংক (অপশনাল)</Label>
                    <Input
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="/products"
                    />
                  </div>
                  <div>
                    <Label>ক্রম নম্বর</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>সক্রিয় করুন</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <Button onClick={handleSave} className="w-full" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      আপলোড হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {editingBanner ? 'আপডেট করুন' : 'সেভ করুন'}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.is_active ? 'opacity-60' : ''}>
              <CardHeader className="p-0">
                <div className="aspect-video overflow-hidden rounded-t-lg bg-muted">
                  <img
                    src={banner.image_url}
                    alt={banner.title_bn || 'Banner'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="text-base line-clamp-1">
                    {banner.title_bn || banner.title_en || 'Untitled'}
                  </CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full ${banner.is_active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {banner.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
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
                    onClick={() => handleDelete(banner)}
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
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Image className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">কোন ব্যানার নেই</p>
            <p className="text-sm text-muted-foreground mt-1">উপরের বাটনে ক্লিক করে নতুন ব্যানার যোগ করুন</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}