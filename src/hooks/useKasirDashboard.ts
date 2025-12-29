import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { startOfDay, endOfDay } from 'date-fns';

export interface KasirTransaction {
  id: string;
  invoice: string;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export interface KasirDashboardStats {
  todaySales: number;
  todayTransactionCount: number;
  avgTransaction: number;
  paymentBreakdown: Record<string, number>;
  recentTransactions: KasirTransaction[];
}

export const useKasirDashboard = () => {
  const { user, currentShift } = useAuthStore();
  const [stats, setStats] = useState<KasirDashboardStats>({
    todaySales: 0,
    todayTransactionCount: 0,
    avgTransaction: 0,
    paymentBreakdown: {},
    recentTransactions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();

      // Fetch today's transactions for this cashier
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, invoice, total, payment_method, status, created_at')
        .eq('cashier_id', user.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .eq('status', 'success')
        .order('created_at', { ascending: false });

      if (txError) {
        console.error('Error fetching transactions:', txError);
        setError(txError.message);
        return;
      }

      const txData = transactions || [];

      // Calculate stats
      const todaySales = txData.reduce((sum, tx) => sum + Number(tx.total), 0);
      const todayTransactionCount = txData.length;
      const avgTransaction = todayTransactionCount > 0 ? Math.round(todaySales / todayTransactionCount) : 0;

      // Payment breakdown
      const paymentBreakdown: Record<string, number> = {};
      txData.forEach((tx) => {
        const method = tx.payment_method;
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(tx.total);
      });

      // Recent transactions (last 5)
      const recentTransactions = txData.slice(0, 5);

      setStats({
        todaySales,
        todayTransactionCount,
        avgTransaction,
        paymentBreakdown,
        recentTransactions,
      });
    } catch (err) {
      console.error('Error in fetchStats:', err);
      setError('Gagal memuat statistik');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time subscription for transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('kasir_transactions_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          // Refetch stats when transactions change
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchStats]);

  return {
    stats,
    currentShift,
    isLoading,
    error,
    refetch: fetchStats,
  };
};
