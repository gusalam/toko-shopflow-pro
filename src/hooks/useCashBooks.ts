import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';

export interface CashBookEntry {
  id: string;
  type: 'in' | 'out';
  source: 'transaction' | 'purchase' | 'manual';
  amount: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CashBookSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export const useCashBooks = (startDate?: Date, endDate?: Date) => {
  const [entries, setEntries] = useState<CashBookEntry[]>([]);
  const [summary, setSummary] = useState<CashBookSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCashBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('cash_books')
        .select('*')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startOfDay(startDate).toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endOfDay(endDate).toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching cash books:', fetchError);
        setError(fetchError.message);
        return;
      }

      const cashBookData = data || [];
      setEntries(cashBookData as CashBookEntry[]);

      // Calculate summary
      const totalIncome = cashBookData
        .filter((e) => e.type === 'in')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const totalExpense = cashBookData
        .filter((e) => e.type === 'out')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      setSummary({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      });
    } catch (err) {
      console.error('Error in fetchCashBooks:', err);
      setError('Gagal memuat data pembukuan');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchCashBooks();
  }, [fetchCashBooks]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('cash_books_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cash_books',
        },
        () => {
          fetchCashBooks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCashBooks]);

  const addManualEntry = async (
    type: 'in' | 'out',
    amount: number,
    description: string
  ) => {
    try {
      const { error } = await supabase.from('cash_books').insert({
        type,
        source: 'manual' as const,
        amount,
        description,
      });

      if (error) {
        console.error('Error adding cash book entry:', error);
        return { success: false, error: error.message };
      }

      await fetchCashBooks();
      return { success: true };
    } catch (err) {
      console.error('Error in addManualEntry:', err);
      return { success: false, error: 'Gagal menambahkan entri' };
    }
  };

  return {
    entries,
    summary,
    isLoading,
    error,
    refetch: fetchCashBooks,
    addManualEntry,
  };
};

// Hook for getting total cash balance (for dashboard)
export const useCashBalance = () => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cash_books')
        .select('type, amount');

      if (error) {
        console.error('Error fetching cash balance:', error);
        return;
      }

      const totalIn = (data || [])
        .filter((e) => e.type === 'in')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const totalOut = (data || [])
        .filter((e) => e.type === 'out')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      setBalance(totalIn - totalOut);
    } catch (err) {
      console.error('Error in fetchBalance:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();

    // Real-time subscription
    const channel = supabase
      .channel('cash_balance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cash_books',
        },
        () => {
          fetchBalance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBalance]);

  return { balance, isLoading, refetch: fetchBalance };
};
