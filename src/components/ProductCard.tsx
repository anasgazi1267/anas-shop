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
  discount_price?: number;
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

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link to={`/product/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {images[0] ? (
            <img
              src={images[0]}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-20 w-20 text-muted-foreground/20" />
            </div>
          )}
          
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-2">
            <div className="flex flex-col gap-2">
              {is_new && (
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
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 hover:bg-background h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                inWishlist ? removeFromWishlist(id) : addToWishlist(id);
              }}
            >
              <Heart className={`h-4 w-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>

          {stock <= 0 && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-4 py-2">
                {t('Out of Stock', 'স্টক আউট')}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/product/${id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-bold text-primary">৳{displayPrice.toLocaleString()}</span>
          {hasDiscount && (
            <span className="text-sm line-through text-muted-foreground">
              ৳{price.toLocaleString()}
            </span>
          )}
        </div>

        <Button 
          className="w-full" 
          disabled={stock <= 0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(id);
          }}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {stock <= 0 ? t('Out of Stock', 'স্টক আউট') : t('Add to Cart', 'কার্টে যোগ করুন')}
        </Button>
      </CardContent>
    </Card>
  );
}
