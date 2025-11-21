import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

export default function RequestProduct() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    product_name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_phone || !formData.product_name) {
      toast.error(t('Please fill all required fields', 'সকল প্রয়োজনীয় ক্ষেত্র পূরণ করুন'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('product_requests').insert([formData]);

    if (error) {
      toast.error(t('Failed to submit request', 'রিকোয়েস্ট সাবমিট ব্যর্থ হয়েছে'));
    } else {
      toast.success(
        t(
          'Request submitted successfully! We will contact you soon.',
          'রিকোয়েস্ট সফলভাবে সাবমিট হয়েছে! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।'
        )
      );
      setFormData({
        customer_name: '',
        customer_phone: '',
        product_name: '',
        description: '',
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">
            {t('Request a Product', 'প্রোডাক্ট রিকোয়েস্ট করুন')}
          </h1>

          <Card>
            <CardHeader>
              <CardTitle>
                {t('Product Request Form', 'প্রোডাক্ট রিকোয়েস্ট ফর্ম')}
              </CardTitle>
              <CardDescription>
                {t(
                  "Can't find what you're looking for? Let us know and we'll try to get it for you!",
                  'আপনি যা খুঁজছেন তা পাচ্ছেন না? আমাদের জানান এবং আমরা এটি আপনার জন্য আনার চেষ্টা করব!'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('Your Name', 'আপনার নাম')} *
                  </label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('Phone Number', 'ফোন নম্বর')} *
                  </label>
                  <Input
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('Product Name', 'প্রোডাক্ট নাম')} *
                  </label>
                  <Input
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('Description', 'বিবরণ')}
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    placeholder={t(
                      'Please provide details about the product you want...',
                      'আপনি যে পণ্য চান তার বিস্তারিত তথ্য দিন...'
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('Submit Request', 'রিকোয়েস্ট সাবমিট করুন')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
