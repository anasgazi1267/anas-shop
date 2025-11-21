import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import heroBanner from '@/assets/hero-banner.jpg';
import Autoplay from 'embla-carousel-autoplay';

export function HeroSlider() {
  const { t } = useLanguage();

  const slides = [
    {
      title_en: 'Welcome to Anas Shop',
      title_bn: 'আনাস শপে স্বাগতম',
      subtitle_en: 'Your trusted online shopping destination',
      subtitle_bn: 'আপনার বিশ্বস্ত অনলাইন শপিং গন্তব্য',
      image: heroBanner,
    },
    {
      title_en: 'Best Deals on Electronics',
      title_bn: 'ইলেকট্রনিক্সে সেরা অফার',
      subtitle_en: 'Up to 50% off on selected items',
      subtitle_bn: 'নির্বাচিত পণ্যে ৫০% পর্যন্ত ছাড়',
      image: heroBanner,
    },
    {
      title_en: 'Latest Fashion Trends',
      title_bn: 'সর্বশেষ ফ্যাশন ট্রেন্ড',
      subtitle_en: 'Explore our new collection',
      subtitle_bn: 'আমাদের নতুন কালেকশন ঘুরে দেখুন',
      image: heroBanner,
    },
  ];

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
        {slides.map((slide, index) => (
          <CarouselItem key={index}>
            <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-lg">
              <img
                src={slide.image}
                alt={slide.title_en}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent flex items-center">
                <div className="container mx-auto px-4">
                  <div className="max-w-xl space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                      {t(slide.title_en, slide.title_bn)}
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground">
                      {t(slide.subtitle_en, slide.subtitle_bn)}
                    </p>
                    <Button asChild size="lg" className="mt-6">
                      <Link to="/products">
                        {t('Shop Now', 'এখনই কিনুন')}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
  );
}
