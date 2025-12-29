import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupabaseProduct {
  id: string;
  name: string;
  category: string | null;
  buy_price: number;
  sell_price: number;
  unit: string;
  barcode: string | null;
  stock: number;
  min_stock: number;
  created_at: string;
}

export interface ProductFormData {
  name: string;
  category: string;
  buy_price: number;
  sell_price: number;
  unit: string;
  barcode: string;
  stock: number;
  min_stock: number;
}

export function useProducts() {
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        toast.error('Gagal memuat produk');
        return;
      }

      setProducts((data || []) as SupabaseProduct[]);
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check stock level and show notification
  const checkStockNotification = useCallback((product: SupabaseProduct, oldStock?: number) => {
    // Only notify if stock decreased
    if (oldStock !== undefined && product.stock >= oldStock) return;
    
    if (product.stock === 0) {
      toast.error(`⚠️ STOK HABIS: ${product.name}`, {
        description: 'Segera lakukan restok!',
        duration: 8000,
      });
    } else if (product.stock <= product.min_stock) {
      toast.warning(`📦 Stok Menipis: ${product.name}`, {
        description: `Tersisa ${product.stock} ${product.unit}. Min: ${product.min_stock}`,
        duration: 6000,
      });
    }
  }, []);

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchProducts();

    // Subscribe to real-time changes on products table
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Product change detected:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const newProduct = payload.new as SupabaseProduct;
            setProducts((prev) => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
            // Check if new product has low stock
            if (newProduct.stock <= newProduct.min_stock) {
              checkStockNotification(newProduct);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedProduct = payload.new as SupabaseProduct;
            const oldProduct = payload.old as { stock?: number };
            
            setProducts((prev) =>
              prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
            );
            
            // Check stock notification on update
            checkStockNotification(updatedProduct, oldProduct.stock);
          } else if (payload.eventType === 'DELETE') {
            setProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts, checkStockNotification]);

  const getFilteredProducts = useCallback(() => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.includes(query))
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const getCategories = useCallback(() => {
    const categorySet = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(categorySet) as string[];
  }, [products]);

  const getLowStockProducts = useCallback(() => {
    return products.filter((p) => p.stock <= p.min_stock);
  }, [products]);

  const addProduct = async (productData: ProductFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from('products').insert({
        name: productData.name,
        category: productData.category || null,
        buy_price: productData.buy_price,
        sell_price: productData.sell_price,
        unit: productData.unit || 'pcs',
        barcode: productData.barcode || null,
        stock: productData.stock || 0,
        min_stock: productData.min_stock || 0,
      });

      if (error) {
        console.error('Error adding product:', error);
        toast.error(error.message || 'Gagal menambah produk');
        return false;
      }

      await fetchProducts();
      toast.success('Produk berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addProduct:', error);
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  const updateProduct = async (id: string, productData: Partial<ProductFormData>): Promise<boolean> => {
    try {
      const updates: Record<string, unknown> = {};
      if (productData.name !== undefined) updates.name = productData.name;
      if (productData.category !== undefined) updates.category = productData.category || null;
      if (productData.buy_price !== undefined) updates.buy_price = productData.buy_price;
      if (productData.sell_price !== undefined) updates.sell_price = productData.sell_price;
      if (productData.unit !== undefined) updates.unit = productData.unit;
      if (productData.barcode !== undefined) updates.barcode = productData.barcode || null;
      if (productData.stock !== undefined) updates.stock = productData.stock;
      if (productData.min_stock !== undefined) updates.min_stock = productData.min_stock;

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating product:', error);
        toast.error(error.message || 'Gagal mengupdate produk');
        return false;
      }

      await fetchProducts();
      toast.success('Produk berhasil diperbarui');
      return true;
    } catch (error) {
      console.error('Error in updateProduct:', error);
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        toast.error(error.message || 'Gagal menghapus produk');
        return false;
      }

      await fetchProducts();
      toast.success('Produk berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  const getProductByBarcode = useCallback((barcode: string) => {
    return products.find((p) => p.barcode === barcode);
  }, [products]);

  return {
    products,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    getFilteredProducts,
    getCategories,
    getLowStockProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductByBarcode,
    refetch: fetchProducts,
  };
}
