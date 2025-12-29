import { useDashboardStats } from '@/hooks/useTransactions';
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
  const { stats, isLoading } = useDashboardStats();
  const { products } = useProducts();

  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      title: 'Penjualan Bulan Ini',
      value: formatCurrency(stats.monthlySales),
      change: stats.monthlySales > 0 ? '+' : '',
      trend: 'up',
      icon: Wallet,
      color: 'success',
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
            Selamat datang! Berikut ringkasan toko hari ini.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
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
          <h3 className="text-lg font-semibold mb-4">Grafik Penjualan Minggu Ini</h3>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold">Peringatan Stok Menipis</h3>
              <p className="text-sm text-muted-foreground">
                {lowStockProducts.length} produk perlu restock segera
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="p-3 rounded-xl bg-muted/30 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stok: <span className="text-warning font-medium">{product.stock}</span> / Min: {product.min_stock}
                  </p>
                </div>
              </div>
            ))}
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
