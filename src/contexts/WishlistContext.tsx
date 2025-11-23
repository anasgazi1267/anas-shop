import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserAuth } from './UserAuthContext';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  product_id: string;
  product?: {
    id: string;
    name_en: string;
    name_bn: string;
    price: number;
    discount_price: number | null;
    images: string[];
  };
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUserAuth();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        id,
        product_id,
        product:products(id, name_en, name_bn, price, discount_price, images)
      `)
      .eq('user_id', user.id);

    if (!error && data) {
      setWishlist(data as WishlistItem[]);
    }
    setLoading(false);
  };

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast.error('অনুগ্রহ করে প্রথমে লগইন করুন');
      return;
    }

    const { error } = await supabase
      .from('wishlist')
      .insert({ user_id: user.id, product_id: productId });

    if (error) {
      if (error.code === '23505') {
        toast.error('ইতিমধ্যে wishlist এ আছে');
      } else {
        toast.error('Wishlist এ যোগ করতে সমস্যা হয়েছে');
      }
    } else {
      toast.success('Wishlist এ যোগ করা হয়েছে');
      fetchWishlist();
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (!error) {
      toast.success('Wishlist থেকে সরানো হয়েছে');
      fetchWishlist();
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.product_id === productId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlist,
      loading,
      addToWishlist,
      removeFromWishlist,
      isInWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
