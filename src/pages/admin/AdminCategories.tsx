import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload, X, ChevronRight, FolderOpen, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name_en: string;
  name_bn: string;
  slug: string;
  image_url: string | null;
  parent_id: string | null;
  display_order: number | null;
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
    parent_id: '',
  });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

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

  // Get parent categories (categories without parent_id)
  const parentCategories = categories.filter(c => !c.parent_id);
  
  // Get subcategories for a parent
  const getSubcategories = (parentId: string) => {
    return categories.filter(c => c.parent_id === parentId);
  };

  // Count products in category (placeholder - could be implemented with a separate query)
  const getCategoryProductCount = (categoryId: string) => {
    return 0; // This would need a separate query
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, image_url: '' });
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.image_url;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('category-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast.error('ইমেজ আপলোড সমস্যা: ' + error.message);
      return formData.image_url;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const slug = formData.name_en.toLowerCase().replace(/\s+/g, '-');
      const imageUrl = await uploadImage();

      const categoryData = {
        name_en: formData.name_en,
        name_bn: formData.name_bn,
        image_url: imageUrl,
        parent_id: formData.parent_id || null,
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
    // Check if category has subcategories
    const hasSubcategories = categories.some(c => c.parent_id === id);
    if (hasSubcategories) {
      toast.error('প্রথমে সাবক্যাটাগরিগুলো ডিলিট করুন');
      return;
    }

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
      parent_id: category.parent_id || '',
    });
    setImagePreview(category.image_url || '');
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_bn: '',
      image_url: '',
      parent_id: '',
    });
    setEditingCategory(null);
    setImageFile(null);
    setImagePreview('');
  };

  // Render subcategory item
  const renderSubcategory = (category: Category) => (
    <div key={category.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg ml-6 border-l-2 border-primary/30">
      <div className="flex items-center gap-3">
        {category.image_url ? (
          <img src={category.image_url} alt={category.name_bn} className="w-10 h-10 object-cover rounded" />
        ) : (
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
            <Folder className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-medium">{category.name_bn}</p>
          <p className="text-xs text-muted-foreground">{category.name_en}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(category.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render parent category with subcategories
  const renderParentCategory = (category: Category) => {
    const subcategories = getSubcategories(category.id);
    
    return (
      <Card key={category.id} className="overflow-hidden">
        <CardHeader className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {category.image_url ? (
                <img src={category.image_url} alt={category.name_bn} className="w-16 h-16 object-cover rounded-lg" />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {category.name_bn}
                  {subcategories.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {subcategories.length} সাবক্যাটাগরি
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{category.name_en}</p>
                <p className="text-xs text-muted-foreground mt-1">Slug: {category.slug}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                <Pencil className="h-4 w-4 mr-1" />
                এডিট
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
                <Trash2 className="h-4 w-4 mr-1" />
                ডিলিট
              </Button>
            </div>
          </div>
        </CardHeader>
        {subcategories.length > 0 && (
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              সাবক্যাটাগরি:
            </p>
            <div className="space-y-2">
              {subcategories.map(renderSubcategory)}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ক্যাটাগরি ম্যানেজমেন্ট</h1>
            <p className="text-muted-foreground mt-2">
              মোট {parentCategories.length} টি মূল ক্যাটাগরি, {categories.length - parentCategories.length} টি সাবক্যাটাগরি
            </p>
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
                  <Label>প্যারেন্ট ক্যাটাগরি (ঐচ্ছিক)</Label>
                  <Select 
                    value={formData.parent_id} 
                    onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="মূল ক্যাটাগরি হিসেবে তৈরি করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">মূল ক্যাটাগরি (কোন প্যারেন্ট নেই)</SelectItem>
                      {parentCategories
                        .filter(c => c.id !== editingCategory?.id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name_bn} ({category.name_en})
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    সাবক্যাটাগরি তৈরি করতে একটি মূল ক্যাটাগরি নির্বাচন করুন
                  </p>
                </div>
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
                  <Label>ক্যাটাগরি ইমেজ</Label>
                  <div className="space-y-3">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">ইমেজ আপলোড করুন</p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="cursor-pointer"
                        />
                      </div>
                    )}
                    <p className="text-xs text-primary font-medium mt-2">
                      💡 রিকমেন্ডেড: 600x400 পিক্সেল, সাইজ 300KB এর কম
                    </p>
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full" disabled={uploading || !formData.name_en || !formData.name_bn}>
                  {uploading ? 'আপলোড হচ্ছে...' : editingCategory ? 'আপডেট করুন' : 'সেভ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Tree View */}
        <div className="space-y-4">
          {parentCategories.map(renderParentCategory)}
        </div>

        {loading && <p className="text-center">লোড হচ্ছে...</p>}
        {!loading && categories.length === 0 && (
          <Card className="p-8 text-center">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">কোন ক্যাটাগরি নেই</p>
            <p className="text-sm text-muted-foreground mt-1">উপরের বাটনে ক্লিক করে নতুন ক্যাটাগরি যোগ করুন</p>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}