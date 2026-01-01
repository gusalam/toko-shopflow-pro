import { useState, useEffect } from 'react';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  FileText,
  Download,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useCashBooks, CashBookEntry } from '@/hooks/useCashBooks';
import { startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const sourceLabels: Record<string, string> = {
  transaction: 'Penjualan',
  purchase: 'Pembelian Supplier',
  manual: 'Manual',
};

const AdminFinance = () => {
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'transaction' | 'purchase' | 'manual'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'in' as 'in' | 'out',
    description: '',
    amount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { entries, summary, isLoading, error, refetch, addManualEntry } = useCashBooks(startDate, endDate);

  const filteredEntries = entries.filter((e) => {
    const typeMatch = filterType === 'all' || e.type === filterType;
    const sourceMatch = filterSource === 'all' || e.source === filterSource;
    return typeMatch && sourceMatch;
  });

  const handleExportPDF = () => {
    const exportData = {
      title: 'Laporan Pembukuan',
      filename: 'laporan_pembukuan',
      columns: [
        { header: 'Tanggal', key: 'dateStr', width: 15 },
        { header: 'Tipe', key: 'typeStr', width: 12 },
        { header: 'Sumber', key: 'source', width: 18 },
        { header: 'Deskripsi', key: 'description', width: 25 },
        { header: 'Jumlah', key: 'amount', width: 18 },
      ],
      data: filteredEntries.map((e) => ({
        dateStr: format(new Date(e.created_at), 'd MMM yyyy HH:mm', { locale: localeID }),
        typeStr: e.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
        source: sourceLabels[e.source] || e.source,
        description: e.description || '-',
        amount: e.amount,
      })),
      summary: [
        { label: 'Total Pemasukan', value: formatCurrency(summary.totalIncome) },
        { label: 'Total Pengeluaran', value: formatCurrency(summary.totalExpense) },
        { label: 'Saldo', value: formatCurrency(summary.balance) },
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
        { header: 'Tanggal', key: 'dateStr', width: 20 },
        { header: 'Tipe', key: 'typeStr', width: 12 },
        { header: 'Sumber', key: 'source', width: 18 },
        { header: 'Deskripsi', key: 'description', width: 30 },
        { header: 'Referensi', key: 'reference', width: 15 },
        { header: 'Jumlah', key: 'amount', width: 18 },
      ],
      data: filteredEntries.map((e) => ({
        dateStr: format(new Date(e.created_at), 'd MMM yyyy HH:mm', { locale: localeID }),
        typeStr: e.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
        source: sourceLabels[e.source] || e.source,
        description: e.description || '-',
        reference: e.reference_id || '-',
        amount: e.amount,
      })),
      summary: [
        { label: 'Total Pemasukan', value: formatCurrency(summary.totalIncome) },
        { label: 'Total Pengeluaran', value: formatCurrency(summary.totalExpense) },
        { label: 'Saldo', value: formatCurrency(summary.balance) },
      ],
    };

    exportToExcel(exportData);
    toast.success('Laporan Excel berhasil diunduh');
  };

  const openAddModal = (type: 'in' | 'out') => {
    setFormData({
      type,
      description: '',
      amount: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.description.trim()) {
      toast.error('Masukkan deskripsi');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Masukkan jumlah yang valid');
      return;
    }

    setIsSubmitting(true);
    const result = await addManualEntry(
      formData.type,
      parseFloat(formData.amount),
      formData.description.trim()
    );

    if (result.success) {
      toast.success('Entri berhasil ditambahkan');
      setShowModal(false);
    } else {
      toast.error(result.error || 'Gagal menambahkan entri');
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Memuat data pembukuan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Pembukuan</h1>
          <p className="text-muted-foreground">Data real-time dari database</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={refetch}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-muted-foreground" />
          </button>
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
            onClick={() => openAddModal('in')}
            className="btn-pos-success flex items-center gap-2"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Pemasukan</span>
          </button>
          <button
            onClick={() => openAddModal('out')}
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
              <p className="text-2xl font-bold text-success">{formatCurrency(summary.totalIncome)}</p>
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
              <p className="text-2xl font-bold text-destructive">{formatCurrency(summary.totalExpense)}</p>
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
              <p className={cn('text-2xl font-bold', summary.balance >= 0 ? 'text-primary' : 'text-destructive')}>
                {formatCurrency(summary.balance)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-4">
        {/* Filter Tipe */}
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-muted-foreground">Tipe:</span>
          <div className="flex gap-2 overflow-x-auto">
            {(['all', 'in', 'out'] as const).map((type) => (
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
                {type === 'in' && <ArrowUpRight className="w-4 h-4" />}
                {type === 'out' && <ArrowDownRight className="w-4 h-4" />}
                {type === 'all' ? 'Semua' : type === 'in' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Sumber */}
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-muted-foreground">Sumber:</span>
          <div className="flex gap-2 overflow-x-auto">
            {(['all', 'transaction', 'purchase', 'manual'] as const).map((source) => (
              <button
                key={source}
                onClick={() => setFilterSource(source)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  filterSource === source
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {source === 'all' ? 'Semua Sumber' : sourceLabels[source]}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Tanggal */}
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-muted-foreground">Tanggal:</span>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            {(startDate || endDate || filterType !== 'all' || filterSource !== 'all') && (
              <button
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setFilterType('all');
                  setFilterSource('all');
                }}
                className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-sm"
              >
                Reset Semua
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Tanggal</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Sumber</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Deskripsi</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-muted-foreground">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{format(new Date(entry.created_at), 'd MMM yyyy HH:mm', { locale: localeID })}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        entry.type === 'in' ? 'badge-success' : 'badge-danger'
                      )}
                    >
                      {sourceLabels[entry.source] || entry.source}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{entry.description || '-'}</td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className={cn(
                        'font-semibold flex items-center justify-end gap-1',
                        entry.type === 'in' ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {entry.type === 'in' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {formatCurrency(entry.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="py-12 text-center">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada data pembukuan</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">
                {formData.type === 'in' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipe</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'in' }))}
                    className={cn(
                      'flex-1 py-2 rounded-xl font-medium transition-colors',
                      formData.type === 'in'
                        ? 'bg-success/20 text-success border-2 border-success'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'out' }))}
                    className={cn(
                      'flex-1 py-2 rounded-xl font-medium transition-colors',
                      formData.type === 'out'
                        ? 'bg-destructive/20 text-destructive border-2 border-destructive'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deskripsi</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Contoh: Gaji karyawan"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Jumlah</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-xl font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 btn-pos-secondary"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  formData.type === 'in' ? 'btn-pos-success' : 'btn-pos-danger'
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinance;
