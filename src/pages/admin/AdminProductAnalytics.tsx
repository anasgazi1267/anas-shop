import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductAnalytics {
  product_id: string;
  product_name_en: string;
  product_name_bn: string;
  total_views: number;
  recent_views: number;
}

export default function AdminProductAnalytics() {
  const { language, t } = useLanguage();
  const [analytics, setAnalytics] = useState<ProductAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Get product views with product details
      const { data: views, error: viewsError } = await supabase
        .from('product_views')
        .select('product_id, products(name_en, name_bn)');

      if (viewsError) throw viewsError;

      // Calculate analytics
      const productMap = new Map<string, ProductAnalytics>();
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      views?.forEach((view: any) => {
        const productId = view.product_id;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product_id: productId,
            product_name_en: view.products?.name_en || 'Unknown',
            product_name_bn: view.products?.name_bn || 'অজানা',
            total_views: 0,
            recent_views: 0,
          });
        }
        const analytics = productMap.get(productId)!;
        analytics.total_views++;
      });

      // Get recent views (last 24 hours)
      const { data: recentViews } = await supabase
        .from('product_views')
        .select('product_id')
        .gte('viewed_at', oneDayAgo.toISOString());

      recentViews?.forEach((view: any) => {
        const analytics = productMap.get(view.product_id);
        if (analytics) {
          analytics.recent_views++;
        }
      });

      const sortedAnalytics = Array.from(productMap.values()).sort(
        (a, b) => b.total_views - a.total_views
      );

      setAnalytics(sortedAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {t('Product Analytics', 'প্রোডাক্ট এনালিটিক্স')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('View product view statistics', 'প্রোডাক্ট ভিউ পরিসংখ্যান দেখুন')}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analytics.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Eye className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t('No product views yet', 'এখনো কোন প্রোডাক্ট ভিউ নেই')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {analytics.map((item) => (
              <Card key={item.product_id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {language === 'en' ? item.product_name_en : item.product_name_bn}
                    </span>
                    <div className="flex items-center gap-4 text-sm font-normal">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>
                          {t('Total', 'মোট')}: {item.total_views}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <TrendingUp className="h-4 w-4" />
                        <span>
                          {t('Last 24h', 'শেষ ২৪ ঘন্টা')}: {item.recent_views}
                        </span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
