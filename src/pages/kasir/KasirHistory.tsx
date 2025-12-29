import { useState, useRef } from 'react';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Receipt, 
  Printer, 
  Eye, 
  Search, 
  Calendar,
  X,
  Package,
  User,
  CreditCard,
  Clock,
  FileText,
  Download,
  Filter,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const KasirHistory = () => {
  const { transactions, isLoading } = useTransactions();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'refunded'>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.invoice.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    const matchesPayment = filterPayment === 'all' || tx.payment_method === filterPayment;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handlePrintReceipt = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setTimeout(() => {
      const printContent = receiptRef.current;
      if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Struk - ${tx.invoice}</title>
                <style>
                  body { 
                    font-family: 'Courier New', monospace; 
                    padding: 20px; 
                    max-width: 300px; 
                    margin: 0 auto;
                    font-size: 12px;
                  }
                  .header { text-align: center; margin-bottom: 20px; }
                  .header h1 { font-size: 18px; margin: 0; }
                  .header p { margin: 4px 0; color: #666; }
                  .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
                  .row { display: flex; justify-content: space-between; margin: 4px 0; }
                  .item { margin: 8px 0; }
                  .item-name { font-weight: bold; }
                  .item-detail { color: #666; font-size: 11px; }
                  .total { font-size: 16px; font-weight: bold; }
                  .footer { text-align: center; margin-top: 20px; color: #666; }
                  @media print {
                    body { padding: 0; }
                  }
                </style>
              </head>
              <body>
                ${printContent.innerHTML}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }
      }
      toast.success('Struk berhasil dicetak');
    }, 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-success/20 text-success';
      case 'refunded':
        return 'bg-destructive/20 text-destructive';
      case 'cancelled':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success':
        return 'Selesai';
      case 'refunded':
        return 'Refund';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Tunai';
      case 'qris':
        return 'QRIS';
      case 'bank':
        return 'Transfer';
      default:
        return method;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Riwayat Transaksi</h1>
          <p className="text-muted-foreground">
            {filteredTransactions.length} transaksi ditemukan
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari nomor invoice..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-input border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 h-12 rounded-xl border transition-colors ${
              showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filter</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-card border border-border rounded-xl animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="h-10 px-3 rounded-lg bg-input border border-border text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="success">Selesai</option>
                <option value="refunded">Refund</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Pembayaran</label>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="h-10 px-3 rounded-lg bg-input border border-border text-sm"
              >
                <option value="all">Semua Metode</option>
                <option value="cash">Tunai</option>
                <option value="qris">QRIS</option>
                <option value="bank">Transfer</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Belum ada transaksi</p>
          <p className="text-sm text-muted-foreground">Transaksi Anda akan muncul di sini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div 
              key={tx.id} 
              className="bg-card border border-border rounded-2xl p-4 lg:p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between sm:justify-start gap-3">
                    <div>
                      <p className="font-mono text-primary font-semibold">{tx.invoice}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(tx.created_at).toLocaleString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(tx.status)}`}>
                      {getStatusLabel(tx.status)}
                    </span>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold">{formatCurrency(tx.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Metode</p>
                      <p className="font-medium capitalize">{getPaymentLabel(tx.payment_method)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dibayar</p>
                      <p className="font-medium">{formatCurrency(tx.paid_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Kembalian</p>
                      <p className="font-medium">{formatCurrency(tx.change_amount)}</p>
                    </div>
                  </div>

                  {tx.notes && (
                    <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-muted-foreground">{tx.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex sm:flex-col gap-2">
                  <button 
                    onClick={() => setSelectedTransaction(tx)} 
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">Detail</span>
                  </button>
                  <button 
                    onClick={() => handlePrintReceipt(tx)} 
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="text-sm font-medium">Cetak</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Detail Transaksi
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              {/* Receipt Preview */}
              <div 
                ref={receiptRef} 
                className="bg-card border border-border rounded-xl p-5 font-mono text-sm"
              >
                <div className="header text-center mb-4">
                  <h1 className="text-lg font-bold">TokoSembako</h1>
                  <p className="text-xs text-muted-foreground">Jl. Contoh No. 123</p>
                  <p className="text-xs text-muted-foreground">Telp: 021-1234567</p>
                </div>

                <div className="divider border-t border-dashed border-border my-3" />

                <div className="space-y-1 text-xs">
                  <div className="row flex justify-between">
                    <span>No. Invoice</span>
                    <span className="font-medium">{selectedTransaction.invoice}</span>
                  </div>
                  <div className="row flex justify-between">
                    <span>Tanggal</span>
                    <span>{new Date(selectedTransaction.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="row flex justify-between">
                    <span>Waktu</span>
                    <span>{new Date(selectedTransaction.created_at).toLocaleTimeString('id-ID')}</span>
                  </div>
                </div>

                <div className="divider border-t border-dashed border-border my-3" />

                {/* Items */}
                {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTransaction.items.map((item, idx) => (
                      <div key={idx} className="item">
                        <div className="item-name font-medium">{item.product_name}</div>
                        <div className="item-detail flex justify-between text-muted-foreground">
                          <span>{item.qty} x {formatCurrency(item.price)}</span>
                          <span>{formatCurrency(item.subtotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-2">Detail item tidak tersedia</p>
                )}

                <div className="divider border-t border-dashed border-border my-3" />

                {/* Totals */}
                <div className="space-y-1 text-xs">
                  <div className="row flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                  </div>
                  {selectedTransaction.discount > 0 && (
                    <div className="row flex justify-between text-success">
                      <span>Diskon</span>
                      <span>-{formatCurrency(selectedTransaction.discount)}</span>
                    </div>
                  )}
                  {selectedTransaction.tax > 0 && (
                    <div className="row flex justify-between">
                      <span>Pajak</span>
                      <span>{formatCurrency(selectedTransaction.tax)}</span>
                    </div>
                  )}
                </div>

                <div className="divider border-t border-dashed border-border my-3" />

                <div className="space-y-1">
                  <div className="row flex justify-between text-base font-bold">
                    <span>TOTAL</span>
                    <span>{formatCurrency(selectedTransaction.total)}</span>
                  </div>
                  <div className="row flex justify-between text-xs">
                    <span>Bayar ({getPaymentLabel(selectedTransaction.payment_method)})</span>
                    <span>{formatCurrency(selectedTransaction.paid_amount)}</span>
                  </div>
                  <div className="row flex justify-between text-xs">
                    <span>Kembalian</span>
                    <span>{formatCurrency(selectedTransaction.change_amount)}</span>
                  </div>
                </div>

                <div className="divider border-t border-dashed border-border my-3" />

                <div className="footer text-center text-xs text-muted-foreground">
                  <p>Terima kasih atas kunjungan Anda!</p>
                  <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handlePrintReceipt(selectedTransaction)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Cetak Ulang Struk
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KasirHistory;
