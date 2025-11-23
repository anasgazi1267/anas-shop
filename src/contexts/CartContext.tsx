import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserAuth } from './UserAuthContext';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: {
    id: string;
    name_en: string;
    name_bn: string;
    price: number;
    discount_price: number | null;
    images: string[];
    stock: number;
  };
}

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUserAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('cart')
      .select(`
        id,
        product_id,
        quantity,
        product:products(id, name_en, name_bn, price, discount_price, images, stock)
      `)
      .eq('user_id', user.id);

    if (!error && data) {
      setCart(data as CartItem[]);
    }
    setLoading(false);
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      toast.error('অনুগ্রহ করে প্রথমে লগইন করুন');
      return;
    }

    const existingItem = cart.find(item => item.product_id === productId);
    
    if (existingItem) {
      await updateQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      const { error } = await supabase
        .from('cart')
        .insert({ user_id: user.id, product_id: productId, quantity });

      if (error) {
        toast.error('কার্টে যোগ করতে সমস্যা হয়েছে');
      } else {
        toast.success('কার্টে যোগ করা হয়েছে');
        fetchCart();
      }
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', cartItemId);

    if (!error) {
      toast.success('কার্ট থেকে সরানো হয়েছে');
      fetchCart();
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }

    const { error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('id', cartItemId);

    if (!error) {
      fetchCart();
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setCart([]);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    if (!item.product) return sum;
    const price = item.product.discount_price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
