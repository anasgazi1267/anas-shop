import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function CartDrawer() {
  const { cart, totalItems, totalPrice, updateQuantity, removeFromCart } = useCart();
  const { language, t } = useLanguage();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t('Shopping Cart', 'শপিং কার্ট')}</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full pt-6">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
              <ShoppingCart className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground">{t('Your cart is empty', 'আপনার কার্ট খালি')}</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto space-y-4">
                {cart.map((item) => {
                  if (!item.product) return null;
                  const price = item.product.discount_price || item.product.price;
                  
                  return (
                    <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                      <img
                        src={item.product.images[0]}
                        alt={language === 'bn' ? item.product.name_bn : item.product.name_en}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-1">
                          {language === 'bn' ? item.product.name_bn : item.product.name_en}
                        </h4>
                        <p className="text-primary font-bold">৳{price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 ml-auto"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('Total', 'মোট')}:</span>
                  <span>৳{totalPrice.toFixed(2)}</span>
                </div>
                <Link to="/checkout">
                  <Button className="w-full" size="lg">
                    {t('Proceed to Checkout', 'চেকআউট করুন')}
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
