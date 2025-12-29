import { useState } from 'react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useProducts } from '@/hooks/useProducts';
import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  X,
  PackageX,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const AdminDashboard = () => {
  const { stats, isLoading, error, refetch } = useAdminDashboard();
  const { products } = useProducts();
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  const lowStockProducts = products
    .filter((p) => p.stock <= p.min_stock)
    .sort((a, b) => a.stock - b.stock); // Sort by stock ascending (lowest first)
  
  const outOfStockProducts = lowStockProducts.filter((p) => p.stock === 0);
  const criticalStockProducts = lowStockProducts.filter((p) => p.stock > 0 && p.stock <= p.min_stock / 2);
  const warningStockProducts = lowStockProducts.filter((p) => p.stock > p.min_stock / 2 && p.stock <= p.min_stock);

  if (isLoading || !stats) {
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

  const statCards = [
    {
      title: 'Penjualan Hari Ini',
      value: formatCurrency(stats.todaySales),
      change: stats.todaySales > 0 ? '+' : '',
      trend: 'up',
      icon: TrendingUp,
      color: 'primary',
    },
    {
      title: 'Jumlah Transaksi',
      value: stats.todayTransactions.toString(),
      change: stats.todayTransactions > 0 ? 'Hari ini' : 'Belum ada',
      trend: 'up',
      icon: ShoppingCart,
      color: 'info',
    },
    {
      title: 'Saldo Kas',
      value: formatCurrency(stats.cashBalance),
      change: stats.cashBalance > 0 ? 'Total' : '',
      trend: stats.cashBalance >= 0 ? 'up' : 'down',
      icon: Wallet,
      color: stats.cashBalance >= 0 ? 'success' : 'warning',
    },
    {
      title: 'Stok Menipis',
      value: stats.lowStockCount.toString(),
      change: stats.lowStockCount > 5 ? 'Perlu restock!' : 'Normal',
      trend: stats.lowStockCount > 5 ? 'down' : 'up',
      icon: AlertTriangle,
      color: stats.lowStockCount > 5 ? 'warning' : 'success',
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Selamat datang! Data real-time dari database.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="stat-card animate-slide-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    stat.color === 'primary'
                      ? 'bg-primary/20 text-primary'
                      : stat.color === 'info'
                      ? 'bg-info/20 text-info'
                      : stat.color === 'success'
                      ? 'bg-success/20 text-success'
                      : 'bg-warning/20 text-warning'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-success' : 'text-warning'
                  }`}
                >
                  {stat.change}
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 stat-card">
          <h3 className="text-lg font-semibold mb-4">Grafik Penjualan 7 Hari Terakhir</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklySales}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}jt` : `${(value / 1000).toFixed(0)}rb`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Penjualan']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="stat-card">
          <h3 className="text-lg font-semibold mb-4">Produk Terlaris</h3>
          <div className="h-[300px]">
            {stats.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number) => [`${value} terjual`, 'Qty']}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Belum ada data penjualan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="stat-card border-warning/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">Peringatan Stok Menipis</h3>
                <p className="text-sm text-muted-foreground">
                  {outOfStockProducts.length > 0 && (
                    <span className="text-destructive font-medium">{outOfStockProducts.length} habis</span>
                  )}
                  {outOfStockProducts.length > 0 && (criticalStockProducts.length > 0 || warningStockProducts.length > 0) && ' • '}
                  {criticalStockProducts.length > 0 && (
                    <span className="text-warning font-medium">{criticalStockProducts.length} kritis</span>
                  )}
                  {criticalStockProducts.length > 0 && warningStockProducts.length > 0 && ' • '}
                  {warningStockProducts.length > 0 && (
                    <span className="text-yellow-500 font-medium">{warningStockProducts.length} menipis</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLowStockModal(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-warning/20 text-warning hover:bg-warning/30 transition-colors"
            >
              Lihat Semua ({lowStockProducts.length})
            </button>
          </div>
          
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-1">
                <PackageX className="w-4 h-4 text-destructive" />
                <span className="text-xs font-medium text-destructive">Stok Habis</span>
              </div>
              <p className="text-2xl font-bold text-destructive">{outOfStockProducts.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-xs font-medium text-warning">Kritis</span>
              </div>
              <p className="text-2xl font-bold text-warning">{criticalStockProducts.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium text-yellow-500">Menipis</span>
              </div>
              <p className="text-2xl font-bold text-yellow-500">{warningStockProducts.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className={`p-3 rounded-xl flex items-center gap-3 ${
                  product.stock === 0 
                    ? 'bg-destructive/10 border border-destructive/20' 
                    : product.stock <= product.min_stock / 2
                    ? 'bg-warning/10 border border-warning/20'
                    : 'bg-muted/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  product.stock === 0 
                    ? 'bg-destructive/20' 
                    : product.stock <= product.min_stock / 2
                    ? 'bg-warning/20'
                    : 'bg-yellow-500/20'
                }`}>
                  {product.stock === 0 ? (
                    <PackageX className="w-5 h-5 text-destructive" />
                  ) : (
                    <Package className={`w-5 h-5 ${product.stock <= product.min_stock / 2 ? 'text-warning' : 'text-yellow-500'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stok: <span className={`font-medium ${
                      product.stock === 0 ? 'text-destructive' : product.stock <= product.min_stock / 2 ? 'text-warning' : 'text-yellow-500'
                    }`}>{product.stock}</span> / Min: {product.min_stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {lowStockProducts.length > 6 && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              +{lowStockProducts.length - 6} produk lainnya
            </p>
          )}
        </div>
      )}

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowLowStockModal(false)}
        >
          <div className="w-full max-w-4xl max-h-[85vh] bg-card rounded-2xl shadow-2xl border border-border animate-scale-in overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold">Ringkasan Stok Menipis</h2>
                <p className="text-sm text-muted-foreground">{lowStockProducts.length} produk perlu diperhatikan</p>
              </div>
              <button
                onClick={() => setShowLowStockModal(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 p-4 sm:p-6 border-b border-border">
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                <PackageX className="w-8 h-8 mx-auto mb-2 text-destructive" />
                <p className="text-3xl font-bold text-destructive">{outOfStockProducts.length}</p>
                <p className="text-sm text-destructive/80">Stok Habis</p>
              </div>
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-warning" />
                <p className="text-3xl font-bold text-warning">{criticalStockProducts.length}</p>
                <p className="text-sm text-warning/80">Stok Kritis</p>
              </div>
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-3xl font-bold text-yellow-500">{warningStockProducts.length}</p>
                <p className="text-sm text-yellow-600/80">Stok Menipis</p>
              </div>
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <table className="w-full">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border">
                    <th className="px-3 py-3 text-left text-sm font-semibold text-muted-foreground">Produk</th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-muted-foreground">Kategori</th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-muted-foreground">Stok</th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-muted-foreground">Min</th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-muted-foreground">Perlu Restock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((product) => {
                    const restockNeeded = Math.max(0, product.min_stock * 2 - product.stock);
                    const status = product.stock === 0 
                      ? { label: 'Habis', color: 'text-destructive bg-destructive/10' }
                      : product.stock <= product.min_stock / 2
                      ? { label: 'Kritis', color: 'text-warning bg-warning/10' }
                      : { label: 'Menipis', color: 'text-yellow-500 bg-yellow-500/10' };
                    
                    return (
                      <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              product.stock === 0 ? 'bg-destructive/20' : 'bg-muted'
                            }`}>
                              {product.stock === 0 ? (
                                <PackageX className="w-4 h-4 text-destructive" />
                              ) : (
                                <Package className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                            {product.category || 'Lainnya'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-bold ${
                            product.stock === 0 ? 'text-destructive' : product.stock <= product.min_stock / 2 ? 'text-warning' : 'text-yellow-500'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-muted-foreground">
                          {product.min_stock}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-semibold text-primary">+{restockNeeded}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {lowStockProducts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Semua stok dalam kondisi aman</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Produk</p>
            <p className="text-xl font-bold">{stats.totalProducts}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pelanggan</p>
            <p className="text-xl font-bold">{stats.totalCustomers}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Penjualan Bulan Ini</p>
            <p className="text-xl font-bold">{formatCurrency(stats.monthlySales)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
