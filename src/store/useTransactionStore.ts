import { create } from 'zustand';
import type { CartItem, Customer } from './useCartStore';

export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'credit';

export interface Transaction {
  id: string;
  receiptNumber: string;
  items: CartItem[];
  customer: Customer | null;
  subtotal: number;
  itemsDiscount: number;
  cartDiscount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  cashierId: string;
  cashierName: string;
  shiftId: string;
  createdAt: Date;
  notes: string;
  status: 'completed' | 'refunded' | 'partial_refund';
}

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'receiptNumber' | 'createdAt'>) => Transaction;
  getTransactionsByShift: (shiftId: string) => Transaction[];
  getTransactionsByCashier: (cashierId: string) => Transaction[];
  getTodayTransactions: () => Transaction[];
  getTodaySales: () => number;
  refundTransaction: (transactionId: string) => void;
  clearTransactions: () => void;
}

// Generate receipt number
const generateReceiptNumber = (): string => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${dateStr}-${random}`;
};

// No dummy data - use Supabase as single source of truth
export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],

  addTransaction: (transactionData) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
      receiptNumber: generateReceiptNumber(),
      createdAt: new Date(),
    };

    set((state) => ({
      transactions: [newTransaction, ...state.transactions],
    }));

    return newTransaction;
  },

  getTransactionsByShift: (shiftId: string) => {
    return get().transactions.filter((t) => t.shiftId === shiftId);
  },

  getTransactionsByCashier: (cashierId: string) => {
    return get().transactions.filter((t) => t.cashierId === cashierId);
  },

  getTodayTransactions: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return get().transactions.filter((t) => {
      const transDate = new Date(t.createdAt);
      transDate.setHours(0, 0, 0, 0);
      return transDate.getTime() === today.getTime();
    });
  },

  getTodaySales: () => {
    return get().getTodayTransactions().reduce((total, t) => total + t.total, 0);
  },

  refundTransaction: (transactionId: string) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transactionId ? { ...t, status: 'refunded' as const } : t
      ),
    }));
  },

  clearTransactions: () => {
    set({ transactions: [] });
  },
}));
