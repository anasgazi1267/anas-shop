import { Search, Menu, Phone, Mail, User, LogOut, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CartDrawer } from './CartDrawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useUserAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="bg-secondary text-secondary-foreground py-2">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <a href="tel:01401757283" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="h-4 w-4" />
              <span>01401757283</span>
            </a>
            <a href="mailto:zenmarket55@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Mail className="h-4 w-4" />
              <span>zenmarket55@gmail.com</span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={language === 'bn' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('bn')}
              className="h-7 px-3"
            >
              বাংলা
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="h-7 px-3"
            >
              English
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">
              {t('Anas Shop', 'আনাস শপ')}
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t('Search products...', 'পণ্য খুঁজুন...')}
                className="w-full px-4 py-2 border rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
              {t('Home', 'হোম')}
            </Link>
            <Link to="/products" className="text-foreground hover:text-primary transition-colors font-medium">
              {t('Products', 'পণ্য')}
            </Link>
            <Link to="/track-order" className="text-foreground hover:text-primary transition-colors font-medium">
              {t('Track Order', 'অর্ডার ট্র্যাক')}
            </Link>
            <Link to="/request-product" className="text-foreground hover:text-primary transition-colors font-medium">
              {t('Request', 'রিকোয়েস্ট')}
            </Link>
            <CartDrawer />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      {t('My Dashboard', 'আমার ড্যাশবোর্ড')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('Logout', 'লগআউট')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  {t('Login', 'লগইন')}
                </Button>
              </Link>
            )}
          </nav>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="text-left">
                  {t('Menu', 'মেনু')}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <Link 
                  to="/" 
                  className="text-foreground hover:text-primary transition-colors font-medium py-2 border-b"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('Home', 'হোম')}
                </Link>
                <Link 
                  to="/products" 
                  className="text-foreground hover:text-primary transition-colors font-medium py-2 border-b"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('Products', 'পণ্য')}
                </Link>
                <Link 
                  to="/track-order" 
                  className="text-foreground hover:text-primary transition-colors font-medium py-2 border-b"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('Track Order', 'অর্ডার ট্র্যাক')}
                </Link>
                <Link 
                  to="/request-product" 
                  className="text-foreground hover:text-primary transition-colors font-medium py-2 border-b"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('Request', 'রিকোয়েস্ট')}
                </Link>
                {user ? (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }} 
                    className="w-full justify-start mt-4"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('Logout', 'লগআউট')}
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="default" className="w-full justify-start mt-4">
                      <User className="h-4 w-4 mr-2" />
                      {t('Login', 'লগইন')}
                    </Button>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="md:hidden mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('Search products...', 'পণ্য খুঁজুন...')}
              className="w-full px-4 py-2 border rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
