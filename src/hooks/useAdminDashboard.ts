import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, startOfMonth, format, eachDayOfInterval, subDays } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

export interface AdminDashboardStats {
  todaySales: number;
  todayTransactions: number;
  monthlySales: number;
  lowStockCount: number;
  totalProducts: number;
  totalCustomers: number;
  cashBalance: number;
  weeklySales: { name: string; sales: number }[];
  topProducts: { name: string; sales: number }[];
}

export const useAdminDashboard = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const monthStart = startOfMonth(today).toISOString();

      // Parallel queries for better performance
      const [
        todayTxResult,
        monthlyTxResult,
        weeklyTxResult,
        productsResult,
        customersResult,
        cashBooksResult,
        topProductsResult,
      ] = await Promise.all([
        // Today's transactions
        supabase
          .from('transactions')
          .select('id, total, status')
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .eq('status', 'success'),
        
        // Monthly transactions
        supabase
          .from('transactions')
          .select('total, status')
          .gte('created_at', monthStart)
          .eq('status', 'success'),
        
        // Weekly transactions (last 7 days)
        supabase
          .from('transactions')
          .select('total, created_at, status')
          .gte('created_at', weekStart.toISOString())
          .eq('status', 'success'),
        
        // Products
        supabase
          .from('products')
          .select('id, stock, min_stock'),
        
        // Customers count
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true }),
        
        // Cash books for balance
        supabase
          .from('cash_books')
          .select('type, amount'),
        
        // Top products from transaction items
        supabase
          .from('transaction_items')
          .select('product_name, qty'),
      ]);

      // Process today's transactions
      const todayTx = todayTxResult.data || [];
      const todaySales = todayTx.reduce((sum, t) => sum + Number(t.total), 0);
      const todayTransactions = todayTx.length;

      // Process monthly sales
      const monthlyTx = monthlyTxResult.data || [];
      const monthlySales = monthlyTx.reduce((sum, t) => sum + Number(t.total), 0);

      // Process weekly sales by day
      const weeklyTx = weeklyTxResult.data || [];
      const last7Days = eachDayOfInterval({
        start: subDays(today, 6),
        end: today,
      });

      const weeklySales = last7Days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const daySales = weeklyTx
          .filter((tx) => format(new Date(tx.created_at), 'yyyy-MM-dd') === dayStr)
          .reduce((sum, tx) => sum + Number(tx.total), 0);

        return {
          name: format(day, 'EEE', { locale: localeID }),
          sales: daySales,
        };
      });

      // Process products
      const products = productsResult.data || [];
      const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length;
      const totalProducts = products.length;

      // Customers count
      const totalCustomers = customersResult.count || 0;

      // Cash balance
      const cashBooks = cashBooksResult.data || [];
      const totalIn = cashBooks
        .filter((e) => e.type === 'in')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const totalOut = cashBooks
        .filter((e) => e.type === 'out')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const cashBalance = totalIn - totalOut;

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
        todayTransactions,
        monthlySales,
        lowStockCount,
        totalProducts,
        totalCustomers,
        cashBalance,
        weeklySales,
        topProducts,
      });
    } catch (err) {
      console.error('Error in fetchStats:', err);
      setError('Gagal memuat statistik dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time subscriptions
  useEffect(() => {
    const transactionsChannel = supabase
      .channel('admin_dashboard_transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchStats()
      )
      .subscribe();

    const productsChannel = supabase
      .channel('admin_dashboard_products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchStats()
      )
      .subscribe();

    const cashBooksChannel = supabase
      .channel('admin_dashboard_cashbooks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_books' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(cashBooksChannel);
    };
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
};
