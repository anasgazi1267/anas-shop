import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HeroSlider } from '@/components/HeroSlider';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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

  const ProductGridSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  const SectionHeader = ({ title, link }: { title: string; link: string }) => (
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
      <Button variant="ghost" size="sm" asChild>
        <Link to={link} className="text-primary">
          {t('View All', 'সব দেখুন')}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Slider */}
        <section className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          <HeroSlider />
        </section>

        {/* Categories */}
        <section className="container mx-auto px-3 md:px-4 py-6 md:py-8">
          <SectionHeader 
            title={t('Popular Categories', 'জনপ্রিয় ক্যাটাগরি')} 
            link="/products" 
          />
          
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {categories.slice(0, 6).map((category) => (
                <CategoryCard key={category.id} {...category} />
              ))}
            </div>
          )}
        </section>

        {/* New Arrivals */}
        {(loading || newProducts.length > 0) && (
          <section className="bg-accent/20 py-6 md:py-8">
            <div className="container mx-auto px-3 md:px-4">
              <SectionHeader 
                title={t('New Arrivals', 'নতুন পণ্য')} 
                link="/products?filter=new" 
              />
              
              {loading ? (
                <ProductGridSkeleton />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {newProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Discount Products */}
        {(loading || discountProducts.length > 0) && (
          <section className="py-6 md:py-8">
            <div className="container mx-auto px-3 md:px-4">
              <SectionHeader 
                title={t('Special Discounts', 'বিশেষ ছাড়')} 
                link="/products?filter=discount" 
              />
              
              {loading ? (
                <ProductGridSkeleton />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {discountProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {(loading || featuredProducts.length > 0) && (
          <section className="bg-accent/20 py-6 md:py-8">
            <div className="container mx-auto px-3 md:px-4">
              <SectionHeader 
                title={t('Featured Products', 'ফিচার্ড পণ্য')} 
                link="/products?filter=featured" 
              />
              
              {loading ? (
                <ProductGridSkeleton />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;