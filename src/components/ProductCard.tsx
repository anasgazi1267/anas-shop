import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface ProductCardProps {
  id: string;
  name_en: string;
  name_bn: string;
  price: number;
  discount_price?: number | null;
  images: string[];
  is_new?: boolean;
  is_featured?: boolean;
  stock: number;
}

export function ProductCard({
  id,
  name_en,
  name_bn,
  price,
  discount_price,
  images,
  is_new,
  is_featured,
  stock,
}: ProductCardProps) {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const name = language === 'en' ? name_en : name_bn;
  const displayPrice = discount_price || price;
  const hasDiscount = discount_price && discount_price < price;
  const inWishlist = isInWishlist(id);
  const discountPercent = hasDiscount ? Math.round(((price - discount_price) / price) * 100) : 0;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
      <Link to={`/product/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {images[0] ? (
            <img
              src={images[0]}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/20" />
            </div>
          )}
          
          <div className="absolute top-1 md:top-2 left-1 md:left-2 right-1 md:right-2 flex justify-between items-start gap-1">
            <div className="flex flex-col gap-1">
              {is_new && (
                <Badge variant="default" className="bg-primary text-[10px] md:text-xs px-1.5 py-0.5">
                  {t('New', 'নতুন')}
                </Badge>
              )}
              {hasDiscount && (
                <Badge variant="destructive" className="text-[10px] md:text-xs px-1.5 py-0.5">
                  -{discountPercent}%
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 hover:bg-background h-6 w-6 md:h-8 md:w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                inWishlist ? removeFromWishlist(id) : addToWishlist(id);
              }}
            >
              <Heart className={`h-3 w-3 md:h-4 md:w-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>

          {stock <= 0 && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="destructive" className="text-xs md:text-sm px-2 py-1">
                {t('Out of Stock', 'স্টক আউট')}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-2 md:p-3">
        <Link to={`/product/${id}`}>
          <h3 className="font-medium text-xs md:text-sm mb-1 md:mb-2 line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem] md:min-h-[2.75rem]">
            {name}
          </h3>
        </Link>
        
        <div className="flex flex-col gap-0.5 mb-2">
          <span className="text-base md:text-lg font-bold text-primary">৳{displayPrice.toLocaleString()}</span>
          {hasDiscount && (
            <span className="text-[10px] md:text-xs line-through text-muted-foreground">
              ৳{price.toLocaleString()}
            </span>
          )}
        </div>

        <Button 
          className="w-full h-7 md:h-9 text-[10px] md:text-sm" 
          size="sm"
          disabled={stock <= 0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(id);
          }}
        >
          <ShoppingCart className="mr-1 h-3 w-3 md:h-4 md:w-4" />
          {stock <= 0 ? t('Out of Stock', 'স্টক আউট') : t('Add to Cart', 'কার্টে যোগ')}
        </Button>
      </CardContent>
    </Card>
  );
}