import { create } from 'zustand';
import type { SupabaseProduct } from '@/hooks/useProducts';

// Product type that works with both local and Supabase products
export interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string | null;
  categoryId?: string;
  categoryName?: string;
  category?: string | null;
  price: number;
  costPrice?: number;
  buy_price?: number;
  sell_price?: number;
  stock: number;
  unit: string;
  minStock?: number;
  min_stock?: number;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  discountType: 'percent' | 'fixed';
  subtotal: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  currentDebt: number;
}

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  discountType: 'percent' | 'fixed';
  taxRate: number;
  notes: string;
  addItem: (product: Product | SupabaseProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setItemDiscount: (productId: string, discount: number, type: 'percent' | 'fixed') => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (discount: number, type: 'percent' | 'fixed') => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemsDiscount: () => number;
  getCartDiscount: () => number;
  getTax: () => number;
  getTotal: () => number;
  getTotalItems: () => number;
}

// Normalize product from different sources
const normalizeProduct = (product: Product | SupabaseProduct): Product => {
  const supabaseProduct = product as SupabaseProduct;
  
  return {
    id: product.id,
    name: product.name,
    sku: (product as Product).sku,
    barcode: supabaseProduct.barcode || (product as Product).barcode,
    categoryId: (product as Product).categoryId,
    categoryName: (product as Product).categoryName || supabaseProduct.category || undefined,
    category: supabaseProduct.category,
    price: supabaseProduct.sell_price || (product as Product).price,
    costPrice: supabaseProduct.buy_price || (product as Product).costPrice,
    buy_price: supabaseProduct.buy_price,
    sell_price: supabaseProduct.sell_price,
    stock: product.stock,
    unit: product.unit,
    minStock: supabaseProduct.min_stock || (product as Product).minStock,
    min_stock: supabaseProduct.min_stock,
  };
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  discount: 0,
  discountType: 'percent',
  taxRate: 0, // 0% tax for sembako
  notes: '',

  addItem: (product: Product | SupabaseProduct, quantity = 1) => {
    const normalizedProduct = normalizeProduct(product);
    const items = get().items;
    const existingItem = items.find((item) => item.product.id === normalizedProduct.id);

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.product.id === normalizedProduct.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.product.price,
              }
            : item
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            product: normalizedProduct,
            quantity,
            discount: 0,
            discountType: 'percent',
            subtotal: quantity * normalizedProduct.price,
          },
        ],
      });
    }
  },

  removeItem: (productId: string) => {
    set({
      items: get().items.filter((item) => item.product.id !== productId),
    });
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set({
      items: get().items.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.product.price,
            }
          : item
      ),
    });
  },

  setItemDiscount: (productId: string, discount: number, type: 'percent' | 'fixed') => {
    set({
      items: get().items.map((item) =>
        item.product.id === productId
          ? { ...item, discount, discountType: type }
          : item
      ),
    });
  },

  setCustomer: (customer: Customer | null) => {
    set({ customer });
  },

  setDiscount: (discount: number, type: 'percent' | 'fixed') => {
    set({ discount, discountType: type });
  },

  setNotes: (notes: string) => {
    set({ notes });
  },

  clearCart: () => {
    set({
      items: [],
      customer: null,
      discount: 0,
      discountType: 'percent',
      notes: '',
    });
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.subtotal, 0);
  },

  getItemsDiscount: () => {
    return get().items.reduce((total, item) => {
      if (item.discountType === 'percent') {
        return total + (item.subtotal * item.discount) / 100;
      }
      return total + item.discount * item.quantity;
    }, 0);
  },

  getCartDiscount: () => {
    const subtotalAfterItemDiscount = get().getSubtotal() - get().getItemsDiscount();
    const { discount, discountType } = get();
    
    if (discountType === 'percent') {
      return (subtotalAfterItemDiscount * discount) / 100;
    }
    return discount;
  },

  getTax: () => {
    const subtotalAfterDiscount = get().getSubtotal() - get().getItemsDiscount() - get().getCartDiscount();
    return (subtotalAfterDiscount * get().taxRate) / 100;
  },

  getTotal: () => {
    return get().getSubtotal() - get().getItemsDiscount() - get().getCartDiscount() + get().getTax();
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
}));
