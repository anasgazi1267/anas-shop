import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  id: string;
  name_en: string;
  name_bn: string;
  image_url?: string | null;
  slug: string;
}

export function CategoryCard({ name_en, name_bn, image_url, slug }: CategoryCardProps) {
  const { language } = useLanguage();
  const name = language === 'en' ? name_en : name_bn;

  return (
    <Link to={`/products?category=${slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50">
        <div className="relative aspect-square overflow-hidden bg-accent">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent">
              <span className="text-3xl md:text-5xl font-bold text-primary/30">
                {name.charAt(0)}
              </span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex items-end justify-center p-2 md:p-4">
            <h3 className="font-semibold text-xs md:text-base text-foreground text-center line-clamp-2">{name}</h3>
          </div>
        </div>
      </Card>
    </Link>
  );
}