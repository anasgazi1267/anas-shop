import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Product {
  id: string;
  name_en: string;
  name_bn: string;
  description_en: string | null;
  description_bn: string | null;
  price: number;
  discount_price: number | null;
  images: string[];
  stock: number;
  is_new: boolean;
  is_featured: boolean;
  is_advance_payment: boolean;
  advance_amount: number | null;
  sizes: string[];
  keywords: string[];
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  category_id: string | null;
  affiliate_commission: number | null;
}

interface Category {
  id: string;
  name_en: string;
  name_bn: string;
  parent_id: string | null;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name_en: '',
    name_bn: '',
    description_en: '',
    description_bn: '',
    price: 0,
    discount_price: 0,
    stock: 0,
    is_new: false,
    is_featured: false,
    is_advance_payment: false,
    advance_amount: 0,
    sizes: '',
    keywords: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    category_id: '',
    affiliate_commission: 0,
  });

  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');
    setCategories(data || []);
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error('প্রোডাক্ট লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async (files: FileList): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSave = async () => {
    try {
      setUploading(true);

      let imageUrls: string[] = editingProduct?.images || [];

      if (imageFiles && imageFiles.length > 0) {
        imageUrls = await uploadImages(imageFiles);
      }

      const slug = formData.name_en.toLowerCase().replace(/\s+/g, '-');

      const sizesArray = formData.sizes
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const productData = {
        ...formData,
        slug,
        images: imageUrls,
        discount_price: formData.discount_price > 0 ? formData.discount_price : null,
        advance_amount: formData.is_advance_payment ? formData.advance_amount : null,
        sizes: sizesArray,
        keywords: keywordsArray,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        meta_keywords: formData.meta_keywords || null,
        category_id: formData.category_id || null,
        affiliate_commission: formData.affiliate_commission > 0 ? formData.affiliate_commission : null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('প্রোডাক্ট আপডেট হয়েছে');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('প্রোডাক্ট যোগ হয়েছে');
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error('সমস্যা হয়েছে: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('প্রোডাক্ট ডিলিট হয়েছে');
      fetchProducts();
    } catch (error: any) {
      toast.error('ডিলিট করতে সমস্যা হয়েছে: ' + error.message);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name_en: product.name_en,
      name_bn: product.name_bn,
      description_en: product.description_en || '',
      description_bn: product.description_bn || '',
      price: product.price,
      discount_price: product.discount_price || 0,
      stock: product.stock,
      is_new: product.is_new,
      is_featured: product.is_featured,
      is_advance_payment: product.is_advance_payment,
      advance_amount: product.advance_amount || 0,
      sizes: product.sizes?.join(', ') || '',
      keywords: product.keywords?.join(', ') || '',
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      meta_keywords: product.meta_keywords || '',
      category_id: product.category_id || '',
      affiliate_commission: product.affiliate_commission || 0,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_bn: '',
      description_en: '',
      description_bn: '',
      price: 0,
      discount_price: 0,
      stock: 0,
      is_new: false,
      is_featured: false,
      is_advance_payment: false,
      advance_amount: 0,
      sizes: '',
      keywords: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      category_id: '',
      affiliate_commission: 0,
    });
    setEditingProduct(null);
    setImageFiles(null);
  };

  // Get parent categories (no parent_id)
  const parentCategories = categories.filter(c => !c.parent_id);
  // Get subcategories for a given parent
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">প্রোডাক্ট ম্যানেজমেন্ট</h1>
            <p className="text-muted-foreground mt-2">প্রোডাক্ট যোগ, এডিট এবং ডিলিট করুন</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                নতুন প্রোডাক্ট
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'প্রোডাক্ট এডিট করুন' : 'নতুন প্রোডাক্ট যোগ করুন'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>নাম (ইংরেজি)</Label>
                    <Input
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      placeholder="Product Name"
                    />
                  </div>
                  <div>
                    <Label>নাম (বাংলা)</Label>
                    <Input
                      value={formData.name_bn}
                      onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                      placeholder="প্রোডাক্ট নাম"
                    />
                  </div>
                </div>

                <div>
                  <Label>বিবরণ (ইংরেজি)</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Product description"
                  />
                </div>

                <div>
                  <Label>বিবরণ (বাংলা)</Label>
                  <Textarea
                    value={formData.description_bn}
                    onChange={(e) => setFormData({ ...formData, description_bn: e.target.value })}
                    placeholder="প্রোডাক্ট বিবরণ"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>দাম</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>ডিসকাউন্ট দাম</Label>
                    <Input
                      type="number"
                      value={formData.discount_price}
                      onChange={(e) => setFormData({ ...formData, discount_price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>স্টক</Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label>প্রোডাক্ট ছবি আপলোড করুন</Label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setImageFiles(e.target.files)}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    একাধিক ছবি নির্বাচন করতে পারবেন
                  </p>
                  <p className="text-xs text-primary font-medium mt-2">
                    💡 রিকমেন্ডেড: 800x800 পিক্সেল, সাইজ 500KB এর কম
                  </p>
                </div>

                <div>
                  <Label>সাইজ (কমা দিয়ে আলাদা করুন)</Label>
                  <Input
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    placeholder="S, M, L, XL বা 38, 39, 40, 41"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    উদাহরণ: S, M, L, XL অথবা 38, 39, 40, 41
                  </p>
                </div>

                {/* Category Selection */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">ক্যাটাগরি</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>ক্যাটাগরি নির্বাচন করুন</Label>
                      <Select 
                        value={formData.category_id} 
                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          {parentCategories.map((category) => (
                            <div key={category.id}>
                              <SelectItem value={category.id} className="font-semibold">
                                {category.name_bn}
                              </SelectItem>
                              {getSubcategories(category.id).map((sub) => (
                                <SelectItem key={sub.id} value={sub.id} className="pl-6">
                                  ↳ {sub.name_bn}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Affiliate Commission */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">এফিলিয়েট সেটিংস</h3>
                  <div>
                    <Label>এফিলিয়েট কমিশন (টাকা)</Label>
                    <Input
                      type="number"
                      value={formData.affiliate_commission}
                      onChange={(e) => setFormData({ ...formData, affiliate_commission: Number(e.target.value) })}
                      placeholder="0"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      প্রতিটি বিক্রিতে রেফারার কত টাকা পাবে
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">SEO সেটিংস</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>কীওয়ার্ড (কমা দিয়ে আলাদা করুন)</Label>
                      <Input
                        value={formData.keywords}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        placeholder="জুতা, স্নিকার, পুরুষ, ক্যাজুয়াল"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        সার্চের জন্য গুরুত্বপূর্ণ শব্দ লিখুন
                      </p>
                    </div>

                    <div>
                      <Label>Meta Title (SEO)</Label>
                      <Input
                        value={formData.meta_title}
                        onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                        placeholder="প্রোডাক্ট নাম - ব্র্যান্ড নাম"
                        maxLength={60}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Google Search এ দেখাবে (সর্বোচ্চ 60 অক্ষর)
                      </p>
                    </div>

                    <div>
                      <Label>Meta Description (SEO)</Label>
                      <Textarea
                        value={formData.meta_description}
                        onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                        placeholder="প্রোডাক্টের সংক্ষিপ্ত বিবরণ যা Google Search এ দেখাবে"
                        maxLength={160}
                        rows={3}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        সংক্ষিপ্ত বিবরণ (সর্বোচ্চ 160 অক্ষর)
                      </p>
                    </div>

                    <div>
                      <Label>Meta Keywords (SEO)</Label>
                      <Input
                        value={formData.meta_keywords}
                        onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                        placeholder="জুতা, স্নিকার, পুরুষ"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        SEO এর জন্য কীওয়ার্ড
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>নতুন প্রোডাক্ট</Label>
                    <Switch
                      checked={formData.is_new}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>ফিচার্ড প্রোডাক্ট</Label>
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>অ্যাডভান্স পেমেন্ট প্রয়োজন</Label>
                    <Switch
                      checked={formData.is_advance_payment}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_advance_payment: checked })}
                    />
                  </div>

                  {formData.is_advance_payment && (
                    <div>
                      <Label>অ্যাডভান্স পরিমাণ</Label>
                      <Input
                        type="number"
                        value={formData.advance_amount}
                        onChange={(e) => setFormData({ ...formData, advance_amount: Number(e.target.value) })}
                      />
                    </div>
                  )}
                </div>

                <Button onClick={handleSave} disabled={uploading} className="w-full">
                  {uploading ? 'আপলোড হচ্ছে...' : editingProduct ? 'আপডেট করুন' : 'সেভ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="aspect-square overflow-hidden rounded-lg bg-muted mb-4">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name_bn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Upload className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{product.name_bn}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>দাম:</span>
                  <span className="font-semibold">৳{product.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>স্টক:</span>
                  <span className="font-semibold">{product.stock}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    এডিট
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(product.id)}
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
        {!loading && products.length === 0 && (
          <p className="text-center text-muted-foreground">কোন প্রোডাক্ট নেই</p>
        )}
      </div>
    </AdminLayout>
  );
}
