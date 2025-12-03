import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  name_en: string;
  name_bn: string;
  price: number;
  discount_price: number | null;
  images: string[];
  is_new: boolean;
  is_featured: boolean;
  stock: number;
}

export default function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [sortBy]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setProducts(allProducts);
    } else {
      const filtered = allProducts.filter(product => {
        const query = searchQuery.toLowerCase();
        return (
          product.name_en.toLowerCase().includes(query) ||
          product.name_bn.toLowerCase().includes(query) ||
          (product as any).keywords?.some((kw: string) => kw.toLowerCase().includes(query))
        );
      });
      setProducts(filtered);
    }
  }, [searchQuery, allProducts]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*');

    switch (sortBy) {
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setAllProducts(data || []);
      setProducts(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="space-y-4 mb-6">
          <h1 className="text-xl md:text-3xl font-bold">{t('All Products', 'সকল পণ্য')}</h1>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('Search products...', 'পণ্য খুঁজুন...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[160px] h-10">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('Sort by', 'সাজান')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  {t('Newest First', 'নতুন আগে')}
                </SelectItem>
                <SelectItem value="price_low">
                  {t('Price: Low to High', 'দাম: কম থেকে বেশি')}
                </SelectItem>
                <SelectItem value="price_high">
                  {t('Price: High to Low', 'দাম: বেশি থেকে কম')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            {products.length} {t('products found', 'টি পণ্য পাওয়া গেছে')}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <p className="text-lg text-muted-foreground">
              {t('No products found', 'কোনো পণ্য পাওয়া যায়নি')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('Try a different search term', 'অন্য কিছু দিয়ে খুঁজুন')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}