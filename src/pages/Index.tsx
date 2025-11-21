import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HeroSlider } from '@/components/HeroSlider';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

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

interface Category {
  id: string;
  name_en: string;
  name_bn: string;
  slug: string;
  image_url: string | null;
}

const Index = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [categoriesRes, newProductsRes, featuredRes, discountRes] = await Promise.all([
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('products').select('*').eq('is_new', true).limit(8),
      supabase.from('products').select('*').eq('is_featured', true).limit(8),
      supabase.from('products').select('*').not('discount_price', 'is', null).limit(8),
    ]);

    if (!categoriesRes.error) setCategories(categoriesRes.data || []);
    if (!newProductsRes.error) setNewProducts(newProductsRes.data || []);
    if (!featuredRes.error) setFeaturedProducts(featuredRes.data || []);
    if (!discountRes.error) setDiscountProducts(discountRes.data || []);

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="container mx-auto px-4 py-8">
          <HeroSlider />
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8">
            {t('Popular Categories', 'জনপ্রিয় ক্যাটাগরি')}
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} {...category} />
              ))}
            </div>
          )}
        </section>

        {newProducts.length > 0 && (
          <section className="container mx-auto px-4 py-12 bg-accent/30">
            <h2 className="text-3xl font-bold mb-8">
              {t('New Arrivals', 'নতুন পণ্য')}
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {newProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
          </section>
        )}

        {discountProducts.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-8">
              {t('Special Discounts', 'বিশেষ ছাড়')}
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {discountProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
          </section>
        )}

        {featuredProducts.length > 0 && (
          <section className="container mx-auto px-4 py-12 bg-accent/30">
            <h2 className="text-3xl font-bold mb-8">
              {t('Featured Products', 'ফিচার্ড পণ্য')}
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
