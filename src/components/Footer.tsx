import { Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-secondary text-secondary-foreground mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">{t('Anas Shop', 'আনাস শপ')}</h3>
            <p className="text-sm opacity-90">
              {t(
                'Your trusted online shopping destination in Bangladesh',
                'বাংলাদেশে আপনার বিশ্বস্ত অনলাইন শপিং গন্তব্য'
              )}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('Quick Links', 'দ্রুত লিঙ্ক')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  {t('Home', 'হোম')}
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">
                  {t('Products', 'পণ্য')}
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-primary transition-colors">
                  {t('Track Order', 'অর্ডার ট্র্যাক')}
                </Link>
              </li>
              <li>
                <Link to="/request-product" className="hover:text-primary transition-colors">
                  {t('Request Product', 'প্রোডাক্ট রিকোয়েস্ট')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('Contact Us', 'যোগাযোগ করুন')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:01401757283" className="hover:text-primary transition-colors">
                  01401757283
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:zenmarket55@gmail.com" className="hover:text-primary transition-colors">
                  zenmarket55@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{t('Bangladesh', 'বাংলাদেশ')}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('Follow Us', 'আমাদের অনুসরণ করুন')}</h4>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <Youtube className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 mt-8 pt-8 text-center text-sm opacity-80">
          <p>
            {t(
              '© 2024 Anas Shop. All rights reserved.',
              '© ২০২৪ আনাস শপ। সকল অধিকার সংরক্ষিত।'
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
