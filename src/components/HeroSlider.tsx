import { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Autoplay from 'embla-carousel-autoplay';
import { Skeleton } from '@/components/ui/skeleton';

interface Banner {
  id: string;
  image_url: string;
  title_en: string | null;
  title_bn: string | null;
  link: string | null;
  is_active: boolean;
}

export function HeroSlider() {
  const { t } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <Skeleton className="h-[200px] md:h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="w-full h-[200px] md:h-[400px] bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
            {t('Welcome to Anas Shop', 'আনাস শপে স্বাগতম')}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t('Your trusted online shopping destination', 'আপনার বিশ্বস্ত অনলাইন শপিং গন্তব্য')}
          </p>
          <Button asChild>
            <Link to="/products">{t('Shop Now', 'এখনই কিনুন')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 5000,
        }),
      ]}
      className="w-full"
    >
      <CarouselContent>
        {banners.map((banner) => (
          <CarouselItem key={banner.id}>
            <Link to={banner.link || '/products'} className="block">
              <div className="relative h-[200px] md:h-[400px] overflow-hidden rounded-lg">
                <img
                  src={banner.image_url}
                  alt={banner.title_bn || banner.title_en || 'Banner'}
                  className="w-full h-full object-cover"
                />
                {(banner.title_en || banner.title_bn) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent flex items-center">
                    <div className="container mx-auto px-4 md:px-8">
                      <div className="max-w-md space-y-2 md:space-y-4">
                        <h2 className="text-xl md:text-4xl font-bold text-foreground line-clamp-2">
                          {t(banner.title_en || '', banner.title_bn || '')}
                        </h2>
                        <Button size="sm" className="md:size-default">
                          {t('Shop Now', 'এখনই কিনুন')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      {banners.length > 1 && (
        <>
          <CarouselPrevious className="left-2 md:left-4" />
          <CarouselNext className="right-2 md:right-4" />
        </>
      )}
    </Carousel>
  );
}