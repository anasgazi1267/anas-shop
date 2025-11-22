import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name_en: string;
  name_bn: string;
  slug: string;
  image_url: string | null;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_bn: '',
    image_url: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error('ক্যাটাগরি লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const slug = formData.name_en.toLowerCase().replace(/\s+/g, '-');

      const categoryData = {
        ...formData,
        slug,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('ক্যাটাগরি আপডেট হয়েছে');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);

        if (error) throw error;
        toast.success('ক্যাটাগরি যোগ হয়েছে');
      }

      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error('সমস্যা হয়েছে: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('ক্যাটাগরি ডিলিট হয়েছে');
      fetchCategories();
    } catch (error: any) {
      toast.error('ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name_en: category.name_en,
      name_bn: category.name_bn,
      image_url: category.image_url || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_bn: '',
      image_url: '',
    });
    setEditingCategory(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ক্যাটাগরি ম্যানেজমেন্ট</h1>
            <p className="text-muted-foreground mt-2">ক্যাটাগরি যোগ, এডিট এবং ডিলিট করুন</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                নতুন ক্যাটাগরি
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'ক্যাটাগরি এডিট করুন' : 'নতুন ক্যাটাগরি যোগ করুন'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>নাম (ইংরেজি)</Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="Category Name"
                  />
                </div>
                <div>
                  <Label>নাম (বাংলা)</Label>
                  <Input
                    value={formData.name_bn}
                    onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                    placeholder="ক্যাটাগরি নাম"
                  />
                </div>
                <div>
                  <Label>ইমেজ URL (অপশনাল)</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingCategory ? 'আপডেট করুন' : 'সেভ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="text-lg">{category.name_bn}</CardTitle>
                <p className="text-sm text-muted-foreground">{category.name_en}</p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    এডিট
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(category.id)}
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
        {!loading && categories.length === 0 && (
          <p className="text-center text-muted-foreground">কোন ক্যাটাগরি নেই</p>
        )}
      </div>
    </AdminLayout>
  );
}
