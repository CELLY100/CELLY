import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, LicenseTierKey } from '../types';
import { LICENSE_TIERS, MASTERING_PRICE, MASTERING_SERVICE_NAME } from '../lib/licenseConstants';

export interface MasteringCartItem {
  itemType: 'mastering';
  songTitle: string;
  notes?: string;
  price: number;
}

export type AnyCartItem =
  | ({ itemType: 'beat_license' } & CartItem)
  | MasteringCartItem;

interface CartContextType {
  items: AnyCartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  discountCode: string;
  discountError: string | null;
  addBeatLicense: (beatId: string, beatTitle: string, beatSlug: string, artworkUrl: string, tier: LicenseTierKey) => void;
  addMasteringOrder: (songTitle: string, notes?: string) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  applyDiscount: (code: string) => Promise<boolean>;
  removeDiscount: () => void;
  validateCartWithServer: () => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<AnyCartItem[]>(() => {
    try {
      const stored = localStorage.getItem('celly_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [discountCode, setDiscountCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountError, setDiscountError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('celly_cart', JSON.stringify(items));
  }, [items]);

  const subtotal = items.reduce((acc, item) => acc + item.price, 0);
  const total = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

  const addBeatLicense = (
    beatId: string,
    beatTitle: string,
    beatSlug: string,
    artworkUrl: string,
    tier: LicenseTierKey
  ) => {
    const tierInfo = LICENSE_TIERS[tier];
    // Check if duplicate
    const exists = items.some(
      (it) => it.itemType === 'beat_license' && it.beatId === beatId && it.licenseTier === tier
    );
    if (exists) return;

    const newItem: AnyCartItem = {
      itemType: 'beat_license',
      beatId,
      beatTitle,
      beatSlug,
      artworkUrl,
      licenseTier: tier,
      licenseName: tierInfo.name,
      price: tierInfo.price,
    };

    setItems((prev) => [...prev, newItem]);
  };

  const addMasteringOrder = (songTitle: string, notes?: string) => {
    const newItem: AnyCartItem = {
      itemType: 'mastering',
      songTitle: songTitle.trim() || 'Untitled Stereo Mix',
      notes: notes || '',
      price: MASTERING_PRICE,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const clearCart = () => {
    setItems([]);
    setDiscountCode('');
    setDiscountAmount(0);
    setDiscountError(null);
    localStorage.removeItem('celly_cart');
  };

  const applyDiscount = async (code: string): Promise<boolean> => {
    try {
      setDiscountError(null);
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setDiscountError(data.error || 'Invalid discount code');
        return false;
      }
      setDiscountCode(data.code);
      setDiscountAmount(data.discountAmount);
      return true;
    } catch {
      setDiscountError('Unable to validate discount code at this time');
      return false;
    }
  };

  const removeDiscount = () => {
    setDiscountCode('');
    setDiscountAmount(0);
    setDiscountError(null);
  };

  const validateCartWithServer = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, discountCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        alert(data.error || 'One or more items in your cart are no longer available.');
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount: items.length,
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        total,
        discountCode,
        discountError,
        addBeatLicense,
        addMasteringOrder,
        removeItem,
        clearCart,
        applyDiscount,
        removeDiscount,
        validateCartWithServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
