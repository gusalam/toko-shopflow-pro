import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/store/useCartStore';

export type PaymentMethod = 'cash' | 'qris' | 'bank' | 'credit';

export interface TransactionItem {
  product_id: string;
  product_name: string;
  qty: number;
  price: number;
  discount: number;
  subtotal: number;
}

export interface CreateTransactionParams {
  items: CartItem[];
  customerId?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  changeAmount: number;
  notes?: string;
  shiftId?: string | null;
}

export interface Transaction {
  id: string;
  invoice: string;
  cashier_id: string;
  customer_id: string | null;
  shift_id: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  paid_amount: number;
  change_amount: number;
  status: 'success' | 'refund';
  notes: string | null;
  created_at: string;
}

// Create transaction using Supabase RPC function
export async function createTransaction(params: CreateTransactionParams): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    // Transform cart items to the format expected by the RPC function
    const items = params.items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      qty: item.quantity,
      price: item.product.price,
      discount: item.discount || 0,
      subtotal: item.subtotal,
    }));

    const { data, error } = await supabase.rpc('create_transaction', {
      p_items: JSON.parse(JSON.stringify(items)),
      p_customer_id: params.customerId || null,
      p_subtotal: params.subtotal,
      p_discount: params.discount,
      p_tax: params.tax,
      p_total: params.total,
      p_payment_method: params.paymentMethod,
      p_paid_amount: params.paidAmount,
      p_change_amount: params.changeAmount,
      p_notes: params.notes || null,
      p_shift_id: params.shiftId || null,
    });

    if (error) {
      console.error('Transaction error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, transactionId: data as string };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: 'Terjadi kesalahan saat memproses transaksi' };
  }
}

// Fetch transactions for current user
export async function fetchTransactions(options?: {
  shiftId?: string;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<Transaction[]> {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.shiftId) {
      query = query.eq('shift_id', options.shiftId);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return (data || []) as Transaction[];
  } catch (error) {
    console.error('Error in fetchTransactions:', error);
    return [];
  }
}

// Fetch transaction items
export async function fetchTransactionItems(transactionId: string) {
  try {
    const { data, error } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', transactionId);

    if (error) {
      console.error('Error fetching transaction items:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchTransactionItems:', error);
    return [];
  }
}

// Refund transaction (admin only)
export async function refundTransaction(transactionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'refund' })
      .eq('id', transactionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error refunding transaction:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}
