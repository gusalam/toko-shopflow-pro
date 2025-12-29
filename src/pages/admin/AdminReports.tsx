import { useState } from 'react';
import { BarChart3, FileText, Download, Calendar, TrendingUp, DollarSign, Package, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { DateRangePicker } from '@/components/DateRangePicker';
import { cn } from '@/lib/utils';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { useReports } from '@/hooks/useReports';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

type PeriodType = 'today' | 'week' | 'month' | 'custom';

const AdminReports = () => {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [startDate, setStartDate] = useState<Date | undefined>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfWeek(new Date(), { weekStartsOn: 1 }));

  const { dailySales, paymentMethods, topProducts, summary, isLoading, error } = useReports(startDate, endDate);

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

  const getDateRangeLabel = () => {
    if (!startDate || !endDate) return '';
    return `${format(startDate, 'd MMM yyyy', { locale: localeID })} - ${format(endDate, 'd MMM yyyy', { locale: localeID })}`;
  };

  const handleExportPDF = () => {
    if (dailySales.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const exportData = {
      title: `Laporan Penjualan (${getDateRangeLabel()})`,
      filename: 'laporan_penjualan',
      columns: [
        { header: 'Tanggal', key: 'date', width: 15 },
        { header: 'Total Penjualan', key: 'sales', width: 20 },
        { header: 'Jumlah Transaksi', key: 'transactions', width: 15 },
      ],
      data: dailySales.map((item) => ({
        date: item.date,
        sales: item.sales,
        transactions: item.transactions,
      })),
      summary: [
        { label: 'Total Penjualan', value: formatCurrency(summary.totalSales) },
        { label: 'Total Transaksi', value: summary.totalTransactions.toString() },
        { label: 'Rata-rata Transaksi', value: formatCurrency(summary.avgTransaction) },
      ],
    };
    
    exportToPDF(exportData);
    toast.success('Laporan PDF berhasil diunduh');
  };

  const handleExportExcel = () => {
    if (dailySales.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const exportData = {
      title: `Laporan Penjualan (${getDateRangeLabel()})`,
      filename: 'laporan_penjualan',
      columns: [
        { header: 'Tanggal', key: 'date', width: 15 },
        { header: 'Total Penjualan', key: 'sales', width: 20 },
        { header: 'Jumlah Transaksi', key: 'transactions', width: 15 },
      ],
      data: dailySales.map((item) => ({
        date: item.date,
        sales: item.sales,
        transactions: item.transactions,
      })),
      summary: [
        { label: 'Total Penjualan', value: formatCurrency(summary.totalSales) },
        { label: 'Total Transaksi', value: summary.totalTransactions.toString() },
        { label: 'Rata-rata Transaksi', value: formatCurrency(summary.avgTransaction) },
      ],
    };
    
    exportToExcel(exportData);
    toast.success('Laporan Excel berhasil diunduh');
  };

  const handleExportProductsPDF = () => {
    if (topProducts.length === 0) {
      toast.error('Tidak ada data produk untuk diekspor');
      return;
    }

    const exportData = {
      title: `Laporan Produk Terlaris (${getDateRangeLabel()})`,
      filename: 'laporan_produk_terlaris',
      columns: [
        { header: 'Nama Produk', key: 'name', width: 30 },
        { header: 'Qty Terjual', key: 'qty', width: 15 },
        { header: 'Pendapatan', key: 'revenue', width: 20 },
      ],
      data: topProducts.map((item) => ({
        name: item.name,
        qty: item.qty,
        revenue: item.revenue,
      })),
      summary: [
        { label: 'Total Produk', value: topProducts.length.toString() },
        { label: 'Total Qty Terjual', value: topProducts.reduce((sum, p) => sum + p.qty, 0).toString() },
        { label: 'Total Pendapatan', value: formatCurrency(topProducts.reduce((sum, p) => sum + p.revenue, 0)) },
      ],
    };
    
    exportToPDF(exportData);
    toast.success('Laporan produk PDF berhasil diunduh');
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
            disabled={isLoading || dailySales.length === 0}
            className="px-4 py-2 rounded-xl bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isLoading || dailySales.length === 0}
            className="px-4 py-2 rounded-xl bg-success/20 text-success hover:bg-success/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Memuat data...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="stat-card bg-destructive/10 border-destructive/20">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground">Total Penjualan</span>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(summary.totalSales)}</p>
              <p className="text-sm text-muted-foreground mt-1">{dailySales.length} hari data</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-info" />
                </div>
                <span className="text-muted-foreground">Transaksi</span>
              </div>
              <p className="text-3xl font-bold">{summary.totalTransactions}</p>
              <p className="text-sm text-muted-foreground mt-1">Total transaksi</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <span className="text-muted-foreground">Rata-rata Transaksi</span>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(summary.avgTransaction)}</p>
              <p className="text-sm text-muted-foreground mt-1">Per transaksi</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend */}
            <div className="lg:col-span-2 stat-card">
              <h3 className="text-lg font-semibold mb-4">Trend Penjualan</h3>
              {dailySales.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySales}>
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
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Tidak ada data penjualan untuk periode ini
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="stat-card">
              <h3 className="text-lg font-semibold mb-4">Metode Pembayaran</h3>
              {paymentMethods.length > 0 ? (
                <>
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
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Tidak ada data
                </div>
              )}
            </div>
          </div>

          {/* Top Products Table */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Produk Terlaris</h3>
              </div>
              {topProducts.length > 0 && (
                <button
                  onClick={handleExportProductsPDF}
                  className="px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors flex items-center gap-2 text-sm"
                >
                  <FileText className="w-3 h-3" />
                  Export
                </button>
              )}
            </div>
            {topProducts.length > 0 ? (
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
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Tidak ada data produk untuk periode ini
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
