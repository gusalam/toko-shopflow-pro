import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, format, eachDayOfInterval, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

export interface DailySalesData {
  date: string;
  fullDate: Date;
  sales: number;
  transactions: number;
}

export interface PaymentMethodData {
  name: string;
  value: number;
  color: string;
}

export interface TopProductData {
  name: string;
  qty: number;
  revenue: number;
}

export interface ReportSummary {
  totalSales: number;
  totalTransactions: number;
  avgTransaction: number;
}

interface UseReportsResult {
  dailySales: DailySalesData[];
  paymentMethods: PaymentMethodData[];
  topProducts: TopProductData[];
  summary: ReportSummary;
  isLoading: boolean;
  error: string | null;
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cash: 'hsl(173, 80%, 40%)',
  qris: 'hsl(199, 89%, 48%)',
  bank: 'hsl(38, 92%, 50%)',
  credit: 'hsl(280, 70%, 50%)',
};

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  bank: 'Transfer',
  credit: 'Kredit',
};

export const useReports = (startDate: Date | undefined, endDate: Date | undefined): UseReportsResult => {
  const [dailySales, setDailySales] = useState<DailySalesData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({
    totalSales: 0,
    totalTransactions: 0,
    avgTransaction: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = useCallback(async () => {
    if (!startDate || !endDate) return;

    setIsLoading(true);
    setError(null);

    try {
      const startISO = startOfDay(startDate).toISOString();
      const endISO = endOfDay(endDate).toISOString();

      // Fetch transactions within date range
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          total,
          payment_method,
          status,
          created_at,
          transaction_items (
            product_name,
            qty,
            subtotal
          )
        `)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .eq('status', 'success');

      if (txError) {
        console.error('Error fetching transactions:', txError);
        setError(txError.message);
        return;
      }

      const txData = transactions || [];

      // Calculate daily sales
      const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyMap = new Map<string, { sales: number; transactions: number }>();
      
      daysInRange.forEach((day) => {
        const key = format(day, 'yyyy-MM-dd');
        dailyMap.set(key, { sales: 0, transactions: 0 });
      });

      txData.forEach((tx) => {
        const dateKey = format(parseISO(tx.created_at), 'yyyy-MM-dd');
        const existing = dailyMap.get(dateKey);
        if (existing) {
          existing.sales += Number(tx.total);
          existing.transactions += 1;
        }
      });

      const dailySalesData: DailySalesData[] = Array.from(dailyMap.entries()).map(([key, value]) => ({
        date: format(parseISO(key), 'd MMM', { locale: localeID }),
        fullDate: parseISO(key),
        sales: value.sales,
        transactions: value.transactions,
      }));

      setDailySales(dailySalesData);

      // Calculate payment method distribution
      const paymentMap = new Map<string, number>();
      txData.forEach((tx) => {
        const method = tx.payment_method;
        paymentMap.set(method, (paymentMap.get(method) || 0) + 1);
      });

      const totalTx = txData.length;
      const paymentMethodsData: PaymentMethodData[] = Array.from(paymentMap.entries())
        .map(([method, count]) => ({
          name: PAYMENT_METHOD_NAMES[method] || method,
          value: totalTx > 0 ? Math.round((count / totalTx) * 100) : 0,
          color: PAYMENT_METHOD_COLORS[method] || 'hsl(200, 50%, 50%)',
        }))
        .sort((a, b) => b.value - a.value);

      setPaymentMethods(paymentMethodsData);

      // Calculate top products
      const productMap = new Map<string, { qty: number; revenue: number }>();
      txData.forEach((tx) => {
        const items = tx.transaction_items || [];
        items.forEach((item: { product_name: string; qty: number; subtotal: number }) => {
          const existing = productMap.get(item.product_name);
          if (existing) {
            existing.qty += item.qty;
            existing.revenue += Number(item.subtotal);
          } else {
            productMap.set(item.product_name, {
              qty: item.qty,
              revenue: Number(item.subtotal),
            });
          }
        });
      });

      const topProductsData: TopProductData[] = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);

      setTopProducts(topProductsData);

      // Calculate summary
      const totalSales = txData.reduce((sum, tx) => sum + Number(tx.total), 0);
      const totalTransactions = txData.length;
      const avgTransaction = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;

      setSummary({
        totalSales,
        totalTransactions,
        avgTransaction,
      });
    } catch (err) {
      console.error('Error in fetchReportData:', err);
      setError('Gagal memuat data laporan');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  return {
    dailySales,
    paymentMethods,
    topProducts,
    summary,
    isLoading,
    error,
  };
};
