import { useState } from 'react';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  X,
  Calendar,
  Filter,
  FileText,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { DateRangePicker } from '@/components/DateRangePicker';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: Date;
  reference?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const incomeCategories = ['Penjualan', 'Pendapatan Lain', 'Retur Pembelian'];
const expenseCategories = ['Pembelian Stok', 'Gaji Karyawan', 'Sewa', 'Listrik & Air', 'Operasional', 'Lainnya'];

const dummyTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    category: 'Penjualan',
    description: 'Penjualan harian',
    amount: 2500000,
    date: new Date('2024-12-28'),
    reference: 'TRX-001',
  },
  {
    id: '2',
    type: 'expense',
    category: 'Pembelian Stok',
    description: 'Pembelian stok beras dari supplier',
    amount: 1500000,
    date: new Date('2024-12-27'),
    reference: 'PO-001',
  },
  {
    id: '3',
    type: 'income',
    category: 'Penjualan',
    description: 'Penjualan harian',
    amount: 1800000,
    date: new Date('2024-12-27'),
    reference: 'TRX-002',
  },
  {
    id: '4',
    type: 'expense',
    category: 'Gaji Karyawan',
    description: 'Gaji kasir bulan Desember',
    amount: 3000000,
    date: new Date('2024-12-25'),
  },
  {
    id: '5',
    type: 'expense',
    category: 'Listrik & Air',
    description: 'Pembayaran listrik bulan Desember',
    amount: 450000,
    date: new Date('2024-12-20'),
  },
  {
    id: '6',
    type: 'income',
    category: 'Penjualan',
    description: 'Penjualan harian',
    amount: 3200000,
    date: new Date('2024-12-26'),
    reference: 'TRX-003',
  },
];

const AdminFinance = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(dummyTransactions);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
  });

  const filteredTransactions = transactions
    .filter((t) => filterType === 'all' || t.type === filterType)
    .filter((t) => {
      if (!startDate && !endDate) return true;
      if (startDate && endDate) {
        return isWithinInterval(t.date, { start: startOfDay(startDate), end: endOfDay(endDate) });
      }
      if (startDate) return t.date >= startOfDay(startDate);
      if (endDate) return t.date <= endOfDay(endDate);
      return true;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const handleExportPDF = () => {
    const exportData = {
      title: 'Laporan Pembukuan',
      filename: 'laporan_pembukuan',
      columns: [
        { header: 'Tanggal', key: 'dateStr', width: 15 },
        { header: 'Tipe', key: 'typeStr', width: 12 },
        { header: 'Kategori', key: 'category', width: 18 },
        { header: 'Deskripsi', key: 'description', width: 25 },
        { header: 'Jumlah', key: 'amount', width: 18 },
      ],
      data: filteredTransactions.map((t) => ({
        dateStr: t.date.toLocaleDateString('id-ID'),
        typeStr: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        category: t.category,
        description: t.description,
        amount: t.amount,
      })),
      summary: [
        { label: 'Total Pemasukan', value: formatCurrency(totalIncome) },
        { label: 'Total Pengeluaran', value: formatCurrency(totalExpense) },
        { label: 'Saldo', value: formatCurrency(balance) },
      ],
    };

    exportToPDF(exportData);
    toast.success('Laporan PDF berhasil diunduh');
  };

  const handleExportExcel = () => {
    const exportData = {
      title: 'Laporan Pembukuan',
      filename: 'laporan_pembukuan',
      columns: [
        { header: 'Tanggal', key: 'dateStr', width: 15 },
        { header: 'Tipe', key: 'typeStr', width: 12 },
        { header: 'Kategori', key: 'category', width: 18 },
        { header: 'Deskripsi', key: 'description', width: 25 },
        { header: 'Referensi', key: 'reference', width: 15 },
        { header: 'Jumlah', key: 'amount', width: 18 },
      ],
      data: filteredTransactions.map((t) => ({
        dateStr: t.date.toLocaleDateString('id-ID'),
        typeStr: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        category: t.category,
        description: t.description,
        reference: t.reference || '-',
        amount: t.amount,
      })),
      summary: [
        { label: 'Total Pemasukan', value: formatCurrency(totalIncome) },
        { label: 'Total Pengeluaran', value: formatCurrency(totalExpense) },
        { label: 'Saldo', value: formatCurrency(balance) },
      ],
    };

    exportToExcel(exportData);
    toast.success('Laporan Excel berhasil diunduh');
  };

  const openAddModal = (type: 'income' | 'expense') => {
    setEditingTransaction(null);
    setFormData({
      type,
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
    });
    setShowModal(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount.toString(),
      date: transaction.date.toISOString().split('T')[0],
      reference: transaction.reference || '',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.category) {
      toast.error('Pilih kategori');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Masukkan jumlah yang valid');
      return;
    }

    if (editingTransaction) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTransaction.id
            ? {
                ...t,
                type: formData.type,
                category: formData.category,
                description: formData.description,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date),
                reference: formData.reference || undefined,
              }
            : t
        )
      );
      toast.success('Transaksi berhasil diperbarui');
    } else {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: formData.type,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
        reference: formData.reference || undefined,
      };
      setTransactions((prev) => [...prev, newTransaction]);
      toast.success('Transaksi berhasil ditambahkan');
    }

    setShowModal(false);
    setEditingTransaction(null);
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setShowDeleteConfirm(null);
    toast.success('Transaksi berhasil dihapus');
  };

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Pembukuan</h1>
          <p className="text-muted-foreground">Kelola pemasukan dan pengeluaran</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span> PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl bg-success/20 text-success hover:bg-success/30 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span> Excel
          </button>
          <button
            onClick={() => openAddModal('income')}
            className="btn-pos-success flex items-center gap-2"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Pemasukan</span>
          </button>
          <button
            onClick={() => openAddModal('expense')}
            className="btn-pos-danger flex items-center gap-2"
          >
            <ArrowDownRight className="w-5 h-5" />
            <span>Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Pemasukan</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Saldo</p>
              <p className={cn('text-2xl font-bold', balance >= 0 ? 'text-primary' : 'text-destructive')}>
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2',
                filterType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {type === 'all' && <Filter className="w-4 h-4" />}
              {type === 'income' && <ArrowUpRight className="w-4 h-4" />}
              {type === 'expense' && <ArrowDownRight className="w-4 h-4" />}
              {type === 'all' ? 'Semua' : type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
              className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-sm"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Tanggal</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Kategori</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Deskripsi</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Referensi</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-muted-foreground">Jumlah</th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{transaction.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        transaction.type === 'income' ? 'badge-success' : 'badge-danger'
                      )}
                    >
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{transaction.description}</td>
                  <td className="px-4 py-4">
                    {transaction.reference && (
                      <span className="font-mono text-sm text-muted-foreground">{transaction.reference}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className={cn(
                        'font-semibold flex items-center justify-end gap-1',
                        transaction.type === 'income' ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(transaction)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(transaction.id)}
                        className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Tidak ada transaksi</p>
            <p className="text-muted-foreground">Mulai catat pemasukan dan pengeluaran Anda</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setEditingTransaction(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border animate-scale-in overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                {formData.type === 'income' ? (
                  <ArrowUpRight className="w-5 h-5 text-success" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-destructive" />
                )}
                {editingTransaction ? 'Edit Transaksi' : formData.type === 'income' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTransaction(null);
                }}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                    formData.type === 'income'
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                    formData.type === 'expense'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Pengeluaran
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Jumlah</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tanggal</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan transaksi..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Referensi (opsional)</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="No. invoice, PO, dll"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 sm:p-6 border-t border-border shrink-0">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTransaction(null);
                }}
                className="flex-1 btn-pos-secondary"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className={cn(
                  'flex-1 btn-pos',
                  formData.type === 'income' ? 'btn-pos-success' : 'btn-pos-danger'
                )}
              >
                {editingTransaction ? 'Simpan Perubahan' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border p-6 animate-scale-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-bold mb-2">Hapus Transaksi?</h3>
              <p className="text-muted-foreground mb-6">
                Transaksi yang dihapus tidak dapat dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 btn-pos-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 btn-pos-danger"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinance;
