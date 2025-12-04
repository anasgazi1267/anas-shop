import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Facebook, Instagram, Youtube, MessageCircle, Save, Globe } from 'lucide-react';

interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  whatsapp: string;
  tiktok: string;
  website: string;
}

export default function AdminSocialLinks() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [links, setLinks] = useState<SocialLinks>({
    facebook: '',
    instagram: '',
    youtube: '',
    whatsapp: '',
    tiktok: '',
    website: '',
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['social_facebook', 'social_instagram', 'social_youtube', 'social_whatsapp', 'social_tiktok', 'social_website']);

      if (error) throw error;
      
      const linksMap: SocialLinks = {
        facebook: '',
        instagram: '',
        youtube: '',
        whatsapp: '',
        tiktok: '',
        website: '',
      };

      data?.forEach(item => {
        const key = item.key.replace('social_', '') as keyof SocialLinks;
        if (key in linksMap) {
          linksMap[key] = item.value;
        }
      });

      setLinks(linksMap);
    } catch (error: any) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updates = Object.entries(links).map(([key, value]) => ({
        key: `social_${key}`,
        value: value || '',
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('settings')
          .upsert(update, { onConflict: 'key' });

        if (error) throw error;
      }

      toast.success('সোশ্যাল লিংক আপডেট হয়েছে');
    } catch (error: any) {
      toast.error('সমস্যা হয়েছে: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const socialItems = [
    { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourpage' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourpage' },
    { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourchannel' },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: 'https://wa.me/880XXXXXXXXXX' },
    { key: 'tiktok', label: 'TikTok', icon: Globe, placeholder: 'https://tiktok.com/@yourpage' },
    { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">সোশ্যাল মিডিয়া লিংক</h1>
          <p className="text-muted-foreground mt-2">সোশ্যাল মিডিয়া লিংক ম্যানেজ করুন</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>সোশ্যাল লিংক সেটিংস</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">লোড হচ্ছে...</div>
            ) : (
              <>
                {socialItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Label>
                      <Input
                        value={links[item.key as keyof SocialLinks]}
                        onChange={(e) => setLinks({ ...links, [item.key]: e.target.value })}
                        placeholder={item.placeholder}
                      />
                    </div>
                  );
                })}

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
