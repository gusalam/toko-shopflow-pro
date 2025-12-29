import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

export interface TransactionItem {
  id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  price: number;
  discount: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  invoice: string;
  cashier_id: string;
  cashier_name?: string;
  customer_id: string | null;
  shift_id: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'qris' | 'bank';
  paid_amount: number;
  change_amount: number;
  status: 'success' | 'refunded' | 'cancelled';
  notes: string | null;
  created_at: string;
  items?: TransactionItem[];
}

export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  weeklySales: { name: string; sales: number }[];
  topProducts: { name: string; sales: number }[];
  totalProducts: number;
  totalCustomers: number;
  monthlySales: number;
  lowStockCount: number;
}

export const useTransactions = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build query based on user role
      let query = supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (*)
        `)
        .order('created_at', { ascending: false });

      // Kasir only sees their own transactions
      if (user.role === 'kasir') {
        query = query.eq('cashier_id', user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching transactions:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Map to our Transaction interface
      const mapped: Transaction[] = (data || []).map((t) => ({
        id: t.id,
        invoice: t.invoice,
        cashier_id: t.cashier_id,
        customer_id: t.customer_id,
        shift_id: t.shift_id,
        subtotal: Number(t.subtotal),
        discount: Number(t.discount),
        tax: Number(t.tax),
        total: Number(t.total),
        payment_method: t.payment_method as 'cash' | 'qris' | 'bank',
        paid_amount: Number(t.paid_amount),
        change_amount: Number(t.change_amount),
        status: t.status as 'success' | 'refunded' | 'cancelled',
        notes: t.notes,
        created_at: t.created_at,
        items: t.transaction_items?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          qty: item.qty,
          price: Number(item.price),
          discount: Number(item.discount),
          subtotal: Number(item.subtotal),
        })),
      }));

      setTransactions(mapped);
    } catch (err) {
      console.error('Error in fetchTransactions:', err);
      setError('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const getTodayTransactions = useCallback(() => {
    const today = new Date().toDateString();
    return transactions.filter(
      (t) => new Date(t.created_at).toDateString() === today
    );
  }, [transactions]);

  const getTodaySales = useCallback(() => {
    return getTodayTransactions()
      .filter((t) => t.status === 'success')
      .reduce((sum, t) => sum + t.total, 0);
  }, [getTodayTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    getTodayTransactions,
    getTodaySales,
  };
};

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);

    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Get start of week
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfWeekISO = startOfWeek.toISOString();

      // Get start of month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfMonthISO = startOfMonth.toISOString();

      // Fetch all data in parallel
      const [
        todayResult,
        weeklyResult,
        monthlyResult,
        productsResult,
        customersResult,
        topProductsResult,
      ] = await Promise.all([
        // Today's transactions
        supabase
          .from('transactions')
          .select('total, status')
          .gte('created_at', todayISO),

        // Weekly transactions (last 7 days)
        supabase
          .from('transactions')
          .select('total, status, created_at')
          .gte('created_at', startOfWeekISO),

        // Monthly transactions
        supabase
          .from('transactions')
          .select('total, status')
          .gte('created_at', startOfMonthISO),

        // Products count and low stock
        supabase
          .from('products')
          .select('id, stock, min_stock'),

        // Customers count
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true }),

        // Top products from transaction items
        supabase
          .from('transaction_items')
          .select('product_name, qty'),
      ]);

      // Calculate today's stats
      const todayTransactions = todayResult.data || [];
      const todaySales = todayTransactions
        .filter((t) => t.status === 'success')
        .reduce((sum, t) => sum + Number(t.total), 0);

      // Calculate weekly sales by day
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const weeklySales = dayNames.map((name, idx) => {
        const dayTransactions = (weeklyResult.data || []).filter((t) => {
          const date = new Date(t.created_at);
          return date.getDay() === idx && t.status === 'success';
        });
        return {
          name,
          sales: dayTransactions.reduce((sum, t) => sum + Number(t.total), 0),
        };
      });

      // Monthly sales
      const monthlySales = (monthlyResult.data || [])
        .filter((t) => t.status === 'success')
        .reduce((sum, t) => sum + Number(t.total), 0);

      // Products stats
      const products = productsResult.data || [];
      const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length;

      // Top products
      const productSalesMap = new Map<string, number>();
      (topProductsResult.data || []).forEach((item) => {
        const current = productSalesMap.get(item.product_name) || 0;
        productSalesMap.set(item.product_name, current + item.qty);
      });
      const topProducts = Array.from(productSalesMap.entries())
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      setStats({
        todaySales,
        todayTransactions: todayTransactions.length,
        weeklySales,
        topProducts,
        totalProducts: products.length,
        totalCustomers: customersResult.count || 0,
        monthlySales,
        lowStockCount,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refetch: fetchStats };
};
