import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Clock, DollarSign, Play, Square, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const KasirShift = () => {
  const { currentShift, startShift, endShift, user, fetchActiveShift } = useAuthStore();
  const [startingCash, setStartingCash] = useState('');
  const [endingCash, setEndingCash] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartShift = async () => {
    if (!startingCash || Number(startingCash) < 0) {
      toast.error('Masukkan saldo awal yang valid');
      return;
    }
    
    setIsLoading(true);
    try {
      const shift = await startShift(Number(startingCash));
      if (shift) {
        toast.success('Shift berhasil dimulai!');
        setStartingCash('');
      } else {
        toast.error('Gagal memulai shift');
      }
    } catch (error) {
      console.error('Error starting shift:', error);
      toast.error('Terjadi kesalahan saat memulai shift');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!endingCash || Number(endingCash) < 0) {
      toast.error('Masukkan saldo akhir yang valid');
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await endShift(Number(endingCash));
      if (success) {
        toast.success('Shift berhasil ditutup!');
        setShowEndModal(false);
        setEndingCash('');
        // Refresh to get null shift
        await fetchActiveShift();
      } else {
        toast.error('Gagal menutup shift');
      }
    } catch (error) {
      console.error('Error ending shift:', error);
      toast.error('Terjadi kesalahan saat menutup shift');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate expected cash
  const expectedCash = currentShift 
    ? currentShift.startingCash + currentShift.totalSales 
    : 0;
  
  // Calculate difference if ending cash is entered
  const cashDifference = endingCash 
    ? Number(endingCash) - expectedCash 
    : 0;

  if (currentShift?.isActive) {
    return (
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold">Shift Aktif</h1>
        
        <div className="stat-card border-success/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="font-semibold">Shift Berjalan</p>
              <p className="text-sm text-muted-foreground">{user?.name}</p>
            </div>
            <div className="ml-auto w-3 h-3 rounded-full bg-success animate-pulse" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground">Waktu Mulai</p>
              <p className="font-bold">{new Date(currentShift.startTime).toLocaleTimeString('id-ID')}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground">Saldo Awal</p>
              <p className="font-bold">{formatCurrency(currentShift.startingCash)}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="font-bold">{currentShift.totalTransactions}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground">Total Penjualan</p>
              <p className="font-bold text-primary">{formatCurrency(currentShift.totalSales)}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 mb-6">
            <p className="text-sm text-muted-foreground">Kas yang Diharapkan</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(expectedCash)}</p>
          </div>

          <button 
            onClick={() => setShowEndModal(true)} 
            className="w-full btn-pos-danger flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <Square className="w-5 h-5" /> Tutup Shift
          </button>
        </div>

        {/* End Shift Modal */}
        {showEndModal && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border animate-scale-in">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold">Tutup Shift</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-warning/20 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Pastikan semua transaksi sudah selesai sebelum menutup shift.</p>
                </div>
                
                <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Saldo Awal</span>
                    <span className="font-medium">{formatCurrency(currentShift.startingCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Penjualan</span>
                    <span className="font-medium text-success">+{formatCurrency(currentShift.totalSales)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-sm font-medium">Kas Diharapkan</span>
                    <span className="font-bold text-primary">{formatCurrency(expectedCash)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Saldo Akhir Kas</label>
                  <input 
                    type="number" 
                    value={endingCash} 
                    onChange={(e) => setEndingCash(e.target.value)} 
                    placeholder="0" 
                    className="w-full h-14 px-4 rounded-xl bg-input border border-border text-xl font-bold"
                    disabled={isLoading}
                  />
                </div>

                {endingCash && (
                  <div className={`p-4 rounded-xl ${cashDifference === 0 ? 'bg-success/20' : cashDifference > 0 ? 'bg-primary/20' : 'bg-destructive/20'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Selisih Kas</span>
                      <span className={`font-bold ${cashDifference === 0 ? 'text-success' : cashDifference > 0 ? 'text-primary' : 'text-destructive'}`}>
                        {cashDifference > 0 ? '+' : ''}{formatCurrency(cashDifference)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cashDifference === 0 ? 'Kas seimbang' : cashDifference > 0 ? 'Kas berlebih' : 'Kas kurang'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-6 border-t border-border">
                <button 
                  onClick={() => {
                    setShowEndModal(false);
                    setEndingCash('');
                  }} 
                  className="flex-1 btn-pos-secondary"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button 
                  onClick={handleEndShift} 
                  className="flex-1 btn-pos-danger flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Memproses...
                    </>
                  ) : (
                    'Tutup Shift'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Buka Shift</h1>

      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Mulai Shift Baru</p>
            <p className="text-sm text-muted-foreground">Masukkan saldo awal kas</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Saldo Awal Kas</label>
          <input 
            type="number" 
            value={startingCash} 
            onChange={(e) => setStartingCash(e.target.value)} 
            placeholder="Contoh: 500000" 
            className="w-full h-14 px-4 rounded-xl bg-input border border-border text-xl font-bold"
            disabled={isLoading}
          />
        </div>

        <button 
          onClick={handleStartShift} 
          className="w-full btn-pos-primary flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Memproses...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" /> Mulai Shift
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default KasirShift;
