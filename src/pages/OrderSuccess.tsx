import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Package } from 'lucide-react';

export default function OrderSuccess() {
  const { trackingId } = useParams();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-2xl">
                {t('Order Placed Successfully!', 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-muted-foreground mb-4">
                  {t(
                    'Thank you for your order! We will contact you soon.',
                    'আপনার অর্ডারের জন্য ধন্যবাদ! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।'
                  )}
                </p>
                
                <div className="inline-flex items-center gap-2 bg-accent rounded-lg px-6 py-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('Tracking ID', 'ট্র্যাকিং আইডি')}
                    </p>
                    <p className="text-2xl font-bold text-primary">{trackingId}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {t(
                  'Save this tracking ID to track your order status',
                  'আপনার অর্ডার স্ট্যাটাস ট্র্যাক করতে এই ট্র্যাকিং আইডি সংরক্ষণ করুন'
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link to="/">
                    {t('Back to Home', 'হোমে ফিরুন')}
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/track-order">
                    {t('Track Order', 'অর্ডার ট্র্যাক করুন')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
