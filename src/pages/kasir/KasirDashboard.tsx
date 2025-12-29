import { useKasirDashboard } from '@/hooks/useKasirDashboard';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  ShoppingCart, 
  TrendingUp, 
  Receipt, 
  Clock,
  ArrowUpRight,
  DollarSign,
  CreditCard,
  Wallet,
  Smartphone,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const KasirDashboard = () => {
  const { user, currentShift } = useAuthStore();
  const { stats, isLoading, error, refetch } = useKasirDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Memuat data...</span>
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

  // Calculate total sales from payment breakdown
  const totalSales = Object.values(stats.paymentBreakdown).reduce((sum, val) => sum + val, 0);

  const statCards = [
    {
      label: 'Penjualan Hari Ini',
      value: formatCurrency(stats.todaySales),
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Transaksi Hari Ini',
      value: stats.todayTransactionCount.toString(),
      icon: Receipt,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Rata-rata Transaksi',
      value: formatCurrency(stats.avgTransaction),
      icon: DollarSign,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Status Shift',
      value: currentShift?.isActive ? 'Aktif' : 'Belum Dimulai',
      icon: Clock,
      color: currentShift?.isActive ? 'text-success' : 'text-warning',
      bgColor: currentShift?.isActive ? 'bg-success/10' : 'bg-warning/10',
    },
  ];

  const paymentMethods = [
    { key: 'cash', label: 'Tunai', icon: Wallet, color: 'text-success' },
    { key: 'qris', label: 'QRIS', icon: Smartphone, color: 'text-primary' },
    { key: 'bank', label: 'Transfer', icon: CreditCard, color: 'text-info' },
    { key: 'credit', label: 'Kredit', icon: CreditCard, color: 'text-warning' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Dashboard Kasir</h1>
          <p className="text-muted-foreground">Selamat datang, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5 text-muted-foreground" />
          </button>
          <Link
            to="/kasir/transaksi"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Mulai Transaksi
          </Link>
        </div>
      </div>

      {/* Shift Warning */}
      {!currentShift?.isActive && (
        <div className="p-4 rounded-xl bg-warning/20 border border-warning/50 flex items-center gap-3">
          <Clock className="w-5 h-5 text-warning" />
          <div>
            <p className="font-medium text-warning">Shift Belum Dimulai</p>
            <p className="text-sm text-muted-foreground">
              Silakan buka shift terlebih dahulu sebelum melakukan transaksi
            </p>
          </div>
          <Link
            to="/kasir/shift"
            className="ml-auto px-4 py-2 rounded-lg bg-warning text-warning-foreground font-medium hover:bg-warning/90 transition-colors"
          >
            Buka Shift
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="bg-card border border-border rounded-2xl p-4 lg:p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-xl lg:text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-lg font-semibold mb-4">Metode Pembayaran Hari Ini</h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const amount = stats.paymentBreakdown[method.key] || 0;
              const percentage = totalSales > 0 ? (amount / totalSales) * 100 : 0;
              
              return (
                <div key={method.key} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <method.icon className={`w-4 h-4 ${method.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{method.label}</span>
                      <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          method.key === 'cash' ? 'bg-success' :
                          method.key === 'qris' ? 'bg-primary' :
                          method.key === 'bank' ? 'bg-info' : 'bg-warning'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Transaksi Terakhir</h2>
            <Link 
              to="/kasir/history" 
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Lihat Semua
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          {stats.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Belum ada transaksi hari ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium">{tx.invoice}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(tx.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.payment_method === 'cash' ? 'bg-success/20 text-success' :
                      tx.payment_method === 'qris' ? 'bg-primary/20 text-primary' :
                      'bg-info/20 text-info'
                    }`}>
                      {tx.payment_method.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-lg font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/kasir/transaksi"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-center">Transaksi Baru</span>
          </Link>
          <Link
            to="/kasir/history"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <Receipt className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm font-medium text-center">Riwayat</span>
          </Link>
          <Link
            to="/kasir/shift"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <Clock className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm font-medium text-center">Kelola Shift</span>
          </Link>
          <button
            onClick={refetch}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <RefreshCw className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm font-medium text-center">Refresh Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default KasirDashboard;
