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
}

// Generate receipt number
const generateReceiptNumber = (): string => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${dateStr}-${random}`;
};

// Dummy transactions for demo
const dummyTransactions: Transaction[] = [
  {
    id: '1',
    receiptNumber: 'INV-20241228-0001',
    items: [],
    customer: null,
    subtotal: 125000,
    itemsDiscount: 0,
    cartDiscount: 0,
    tax: 0,
    total: 125000,
    paymentMethod: 'cash',
    amountPaid: 130000,
    change: 5000,
    cashierId: '2',
    cashierName: 'Kasir Budi',
    shiftId: '1',
    createdAt: new Date(Date.now() - 3600000),
    notes: '',
    status: 'completed',
  },
  {
    id: '2',
    receiptNumber: 'INV-20241228-0002',
    items: [],
    customer: null,
    subtotal: 87500,
    itemsDiscount: 5000,
    cartDiscount: 0,
    tax: 0,
    total: 82500,
    paymentMethod: 'qris',
    amountPaid: 82500,
    change: 0,
    cashierId: '2',
    cashierName: 'Kasir Budi',
    shiftId: '1',
    createdAt: new Date(Date.now() - 1800000),
    notes: '',
    status: 'completed',
  },
  {
    id: '3',
    receiptNumber: 'INV-20241228-0003',
    items: [],
    customer: null,
    subtotal: 250000,
    itemsDiscount: 0,
    cartDiscount: 10000,
    tax: 0,
    total: 240000,
    paymentMethod: 'cash',
    amountPaid: 250000,
    change: 10000,
    cashierId: '2',
    cashierName: 'Kasir Budi',
    shiftId: '1',
    createdAt: new Date(Date.now() - 900000),
    notes: 'Pelanggan langganan',
    status: 'completed',
  },
];

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: dummyTransactions,

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
}));
