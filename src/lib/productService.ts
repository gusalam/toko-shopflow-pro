import { supabase } from '@/integrations/supabase/client';

export interface Product {
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

// Fetch all products
export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return (data || []) as Product[];
  } catch (error) {
    console.error('Error in fetchProducts:', error);
    return [];
  }
}

// Fetch product by barcode
export async function fetchProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product by barcode:', error);
      return null;
    }

    return data as Product | null;
  } catch (error) {
    console.error('Error in fetchProductByBarcode:', error);
    return null;
  }
}

// Create product (admin only)
export async function createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Product; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Product };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Update product (admin only)
export async function updateProduct(id: string, updates: Partial<Product>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Delete product (admin only)
export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Get low stock products
export async function fetchLowStockProducts(): Promise<Product[]> {
  try {
    // Fetch all and filter client-side since we can't use computed filter
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('stock');
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return ((data || []) as Product[]).filter(p => p.stock <= p.min_stock);
  } catch (error) {
    console.error('Error in fetchLowStockProducts:', error);
    return [];
  }
}
