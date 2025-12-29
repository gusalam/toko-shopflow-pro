import { useState } from 'react';
import { BarChart3, FileText, Download, Calendar, TrendingUp, DollarSign, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { DateRangePicker } from '@/components/DateRangePicker';
import { cn } from '@/lib/utils';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const allDailySales = [
  { date: '20 Des', fullDate: new Date('2024-12-20'), sales: 1650000 },
  { date: '21 Des', fullDate: new Date('2024-12-21'), sales: 1920000 },
  { date: '22 Des', fullDate: new Date('2024-12-22'), sales: 1850000 },
  { date: '23 Des', fullDate: new Date('2024-12-23'), sales: 2100000 },
  { date: '24 Des', fullDate: new Date('2024-12-24'), sales: 1750000 },
  { date: '25 Des', fullDate: new Date('2024-12-25'), sales: 3200000 },
  { date: '26 Des', fullDate: new Date('2024-12-26'), sales: 2800000 },
  { date: '27 Des', fullDate: new Date('2024-12-27'), sales: 2450000 },
  { date: '28 Des', fullDate: new Date('2024-12-28'), sales: 1950000 },
];

const paymentMethods = [
  { name: 'Tunai', value: 65, color: 'hsl(173, 80%, 40%)' },
  { name: 'QRIS', value: 25, color: 'hsl(199, 89%, 48%)' },
  { name: 'Transfer', value: 10, color: 'hsl(38, 92%, 50%)' },
];

const topProducts = [
  { name: 'Beras Premium 5kg', qty: 45, revenue: 3375000 },
  { name: 'Indomie Goreng', qty: 120, revenue: 420000 },
  { name: 'Minyak Goreng Bimoli 2L', qty: 38, revenue: 1444000 },
  { name: 'Gula Pasir 1kg', qty: 52, revenue: 780000 },
  { name: 'Telur Ayam 1kg', qty: 28, revenue: 784000 },
];

type PeriodType = 'today' | 'week' | 'month' | 'custom';

const AdminReports = () => {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [startDate, setStartDate] = useState<Date | undefined>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfWeek(new Date(), { weekStartsOn: 1 }));

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    const today = new Date();
    
    switch (newPeriod) {
      case 'today':
        setStartDate(startOfDay(today));
        setEndDate(endOfDay(today));
        break;
      case 'week':
        setStartDate(startOfWeek(today, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case 'month':
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case 'custom':
        // Keep current dates for custom
        break;
    }
  };

  const filteredSales = allDailySales.filter((item) => {
    if (!startDate || !endDate) return true;
    return isWithinInterval(item.fullDate, { start: startOfDay(startDate), end: endOfDay(endDate) });
  });

  const totalSales = filteredSales.reduce((sum, item) => sum + item.sales, 0);
  const totalTransactions = Math.round(totalSales / 103205);
  const avgTransaction = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;

  const handleExportPDF = () => {
    const exportData = {
      title: 'Laporan Penjualan',
      filename: 'laporan_penjualan',
      columns: [
        { header: 'Tanggal', key: 'date', width: 15 },
        { header: 'Total Penjualan', key: 'sales', width: 20 },
      ],
      data: filteredSales.map((item) => ({
        date: item.date,
        sales: item.sales,
      })),
      summary: [
        { label: 'Total Penjualan', value: formatCurrency(totalSales) },
        { label: 'Total Transaksi', value: totalTransactions.toString() },
        { label: 'Rata-rata Transaksi', value: formatCurrency(avgTransaction) },
      ],
    };
    
    exportToPDF(exportData);
    toast.success('Laporan PDF berhasil diunduh');
  };

  const handleExportExcel = () => {
    const exportData = {
      title: 'Laporan Penjualan',
      filename: 'laporan_penjualan',
      columns: [
        { header: 'Tanggal', key: 'date', width: 15 },
        { header: 'Total Penjualan', key: 'sales', width: 20 },
      ],
      data: filteredSales.map((item) => ({
        date: item.date,
        sales: item.sales,
      })),
      summary: [
        { label: 'Total Penjualan', value: formatCurrency(totalSales) },
        { label: 'Total Transaksi', value: totalTransactions.toString() },
        { label: 'Rata-rata Transaksi', value: formatCurrency(avgTransaction) },
      ],
    };
    
    exportToExcel(exportData);
    toast.success('Laporan Excel berhasil diunduh');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Laporan</h1>
          <p className="text-muted-foreground">Analisis penjualan dan performa toko</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl bg-success/20 text-success hover:bg-success/30 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="stat-card flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-wrap">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-5 h-5" />
          <span>Periode:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'week', label: 'Minggu Ini' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'custom', label: 'Custom' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handlePeriodChange(p.id as PeriodType)}
              className={cn(
                'px-4 py-2 rounded-xl transition-colors',
                period === p.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-muted-foreground">Total Penjualan</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalSales)}</p>
          <p className="text-sm text-muted-foreground mt-1">{filteredSales.length} hari data</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-info" />
            </div>
            <span className="text-muted-foreground">Transaksi</span>
          </div>
          <p className="text-3xl font-bold">{totalTransactions}</p>
          <p className="text-sm text-muted-foreground mt-1">Estimasi transaksi</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <span className="text-muted-foreground">Rata-rata Transaksi</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(avgTransaction)}</p>
          <p className="text-sm text-muted-foreground mt-1">Per transaksi</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 stat-card">
          <h3 className="text-lg font-semibold mb-4">Trend Penjualan</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredSales}>
                <defs>
                  <linearGradient id="colorSalesReport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 25%)" />
                <XAxis dataKey="date" stroke="hsl(215, 20%, 65%)" />
                <YAxis stroke="hsl(215, 20%, 65%)" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 14%)',
                    border: '1px solid hsl(217, 33%, 25%)',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Penjualan']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(173, 80%, 40%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSalesReport)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="stat-card">
          <h3 className="text-lg font-semibold mb-4">Metode Pembayaran</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 14%)',
                    border: '1px solid hsl(217, 33%, 25%)',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {paymentMethods.map((method) => (
              <div key={method.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }} />
                  <span className="text-sm">{method.name}</span>
                </div>
                <span className="text-sm font-medium">{method.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Produk Terlaris</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Produk</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">Qty Terjual</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.name} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-warning/20 text-warning' :
                      index === 1 ? 'bg-muted text-muted-foreground' :
                      index === 2 ? 'bg-warning/10 text-warning/70' :
                      'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-right">{product.qty}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
