import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Package, CreditCard, Share2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name_en: string;
  name_bn: string;
  description_en: string | null;
  description_bn: string | null;
  price: number;
  discount_price: number | null;
  images: string[];
  is_new: boolean;
  is_featured: boolean;
  is_advance_payment: boolean;
  advance_amount: number | null;
  stock: number;
  sizes: string[];
  keywords: string[];
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  affiliate_commission: number | null;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user } = useUserAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const refCode = searchParams.get('ref');

  useEffect(() => {
    if (id) {
      fetchProduct();
      trackProductView();
    }
  }, [id]);

  const trackProductView = async () => {
    try {
      await supabase
        .from('product_views')
        .insert({
          product_id: id,
          user_ip: null,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      toast.error(t('Product not found', 'পণ্য পাওয়া যায়নি'));
      navigate('/products');
    } else {
      setProduct(data);
    }
    setLoading(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: name,
      text: `${name} - ৳${displayPrice.toLocaleString()}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t('Link copied to clipboard!', 'লিংক কপি হয়েছে!'));
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAffiliateShare = async () => {
    if (!user) {
      toast.error(t('Please login to get affiliate link', 'এফিলিয়েট লিংক পেতে লগইন করুন'));
      navigate('/auth');
      return;
    }

    try {
      // Check if affiliate link already exists
      const { data: existingLink } = await supabase
        .from('affiliate_links')
        .select('referral_code')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .single();

      let referralCode = existingLink?.referral_code;

      if (!referralCode) {
        // Generate new referral code
        referralCode = Math.random().toString(36).substring(2, 10);
        
        const { error } = await supabase.from('affiliate_links').insert({
          user_id: user.id,
          product_id: id,
          referral_code: referralCode
        });

        if (error) throw error;
      }

      const affiliateUrl = `${window.location.origin}/product/${id}?ref=${referralCode}`;
      
      if (navigator.share) {
        await navigator.share({
          title: name,
          text: `${name} - ৳${displayPrice.toLocaleString()}`,
          url: affiliateUrl,
        });
      } else {
        await navigator.clipboard.writeText(affiliateUrl);
        toast.success(t('Affiliate link copied!', 'এফিলিয়েট লিংক কপি হয়েছে!'));
      }
    } catch (error: any) {
      toast.error('সমস্যা হয়েছে: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const name = language === 'en' ? product.name_en : product.name_bn;
  const description = language === 'en' ? product.description_en : product.description_bn;
  const displayPrice = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  const metaTitle = product.meta_title || `${name} - ৳${displayPrice.toLocaleString()}`;
  const metaDescription = product.meta_description || description?.substring(0, 160) || `${name} - সেরা মূল্যে কিনুন`;
  const metaKeywords = product.meta_keywords || product.keywords?.join(', ') || name;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={metaKeywords} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={product.images[0] || ''} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={product.images[0] || ''} />
      </Helmet>
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              {product.images[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="h-32 w-32 text-muted-foreground/20" />
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {product.is_new && (
                  <Badge variant="default" className="bg-primary">
                    {t('New', 'নতুন')}
                  </Badge>
                )}
                {hasDiscount && (
                  <Badge variant="destructive">
                    {t('Sale', 'ছাড়')}
                  </Badge>
                )}
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{name}</h1>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-primary">
                  ৳{displayPrice.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-xl line-through text-muted-foreground">
                    ৳{product.price.toLocaleString()}
                  </span>
                )}
              </div>

            {product.stock > 0 ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Package className="h-4 w-4 mr-1" />
                  {t('In Stock', 'স্টক আছে')} ({product.stock})
                </Badge>
              ) : (
                <Badge variant="destructive">
                  {t('Out of Stock', 'স্টক আউট')}
                </Badge>
              )}
            </div>

            {/* Order and Share buttons - above description */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full"
                disabled={product.stock <= 0}
                onClick={() => navigate(`/order/${product.id}${refCode ? `?ref=${refCode}` : ''}`)}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {t('Order Now', 'অর্ডার করুন')}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {t('Share', 'শেয়ার')}
                </Button>
                
                {product.affiliate_commission && product.affiliate_commission > 0 && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleAffiliateShare}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    {t('Earn', 'আয় করুন')} ৳{product.affiliate_commission}
                  </Button>
                )}
              </div>
            </div>

            {description && (
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {t('Description', 'বিবরণ')}
                </h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}

            {product.is_advance_payment && product.advance_amount && (
              <div className="bg-accent rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">
                    {t('Advance Payment Required', 'অগ্রিম পেমেন্ট প্রয়োজন')}
                  </h3>
                </div>
                <p className="text-2xl font-bold text-primary">
                  ৳{product.advance_amount.toLocaleString()}
                </p>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">
                  {t('Available Sizes', 'উপলব্ধ সাইজ')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Badge key={size} variant="outline" className="px-3 py-1">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
