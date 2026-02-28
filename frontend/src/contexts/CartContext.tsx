import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface CartItem {
  id: string;
  frameId: string;
  name: string;
  price: number;
  image: string;
  color?: string;
  size?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (frameId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_PREFIX = 'safetyglasses_cart_';
const LEGACY_CART_KEY = 'safetyglasses_cart'; // Old shared key - no longer used

function getCartStorageKey(userId: string | undefined): string | null {
  return userId ? `${CART_STORAGE_PREFIX}${userId}` : null;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart for current user when user changes (login/logout/switch)
  useEffect(() => {
    const key = getCartStorageKey(user?.id);
    if (!key) {
      setItems([]); // Not logged in: empty cart
      return;
    }
    // Remove legacy shared cart key (one-time cleanup)
    try {
      localStorage.removeItem(LEGACY_CART_KEY);
    } catch {
      /* ignore */
    }
    const stored = localStorage.getItem(key);
    setItems(stored ? JSON.parse(stored) : []);
  }, [user?.id]);

  // Persist cart to user-specific storage when items change (only when logged in)
  useEffect(() => {
    const key = getCartStorageKey(user?.id);
    if (key) {
      localStorage.setItem(key, JSON.stringify(items));
    }
  }, [items, user?.id]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.frameId === item.frameId);
      if (existing) {
        return prev.map((i) =>
          i.frameId === item.frameId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, id: generateUUID(), quantity }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setItems([]);

  const isInCart = (frameId: string) => items.some((item) => item.frameId === frameId);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
