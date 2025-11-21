import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  id: string;
  name_en: string;
  name_bn: string;
  image_url?: string;
  slug: string;
}

export function CategoryCard({ name_en, name_bn, image_url, slug }: CategoryCardProps) {
  const { language } = useLanguage();
  const name = language === 'en' ? name_en : name_bn;

  return (
    <Link to={`/category/${slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
        <div className="relative aspect-square overflow-hidden bg-accent">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent">
              <span className="text-6xl font-bold text-primary/30">
                {name.charAt(0)}
              </span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end justify-center p-4">
            <h3 className="font-bold text-xl text-foreground">{name}</h3>
          </div>
        </div>
      </Card>
    </Link>
  );
}
