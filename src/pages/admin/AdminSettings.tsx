import { useState, useEffect } from 'react';
import { Settings, Store, Percent, Printer, Database, Save, Bluetooth, Loader2, RefreshCw, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { usePrinter } from '@/hooks/usePrinter';
import { cn } from '@/lib/utils';

const AdminSettings = () => {
  const [storeSettings, setStoreSettings] = useState({
    name: 'TOKO SEMBAKO',
    address: 'Jl. Raya Utama No. 123, Jakarta',
    phone: '021-12345678',
    taxRate: 0,
    defaultDiscount: 0,
  });

  const {
    isScanning,
    isPrinting,
    isConnected,
    isAutoConnecting,
    connectedDevice,
    availableDevices,
    settings: printerSettings,
    isNative,
    scanDevices,
    connectDevice,
    disconnectDevice,
    updateSettings,
    testPrint,
  } = usePrinter();

  const handleSave = () => {
    localStorage.setItem('store_settings', JSON.stringify(storeSettings));
    toast.success('Pengaturan berhasil disimpan');
  };

  // Load saved store settings
  useEffect(() => {
    const saved = localStorage.getItem('store_settings');
    if (saved) {
      try {
        setStoreSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading store settings:', e);
      }
    }
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Konfigurasi toko dan sistem POS</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Profile */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Profil Toko</h3>
              <p className="text-sm text-muted-foreground">Informasi dasar toko</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nama Toko</label>
              <input
                type="text"
                value={storeSettings.name}
                onChange={(e) => setStoreSettings({ ...storeSettings, name: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-input border border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Alamat</label>
              <textarea
                value={storeSettings.address}
                onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                rows={2}
                className="w-full p-4 rounded-xl bg-input border border-border resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telepon</label>
              <input
                type="text"
                value={storeSettings.phone}
                onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-input border border-border"
              />
            </div>
          </div>
        </div>

        {/* Bluetooth Printer */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <Bluetooth className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">Printer Bluetooth</h3>
              <p className="text-sm text-muted-foreground">Pengaturan printer thermal</p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className={cn(
            "p-4 rounded-xl mb-4",
            isAutoConnecting ? "bg-warning/10 border border-warning/30" : 
            isConnected ? "bg-success/10 border border-success/30" : "bg-muted/30"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium flex items-center gap-2">
                  {isAutoConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-warning" />
                      Menghubungkan Otomatis...
                    </>
                  ) : isConnected ? (
                    <>
                      <Check className="w-4 h-4 text-success" />
                      Terhubung
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-muted-foreground" />
                      Tidak Terhubung
                    </>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isAutoConnecting ? 'Mencoba terhubung ke printer terakhir...' :
                   isConnected && connectedDevice ? connectedDevice.name : 'Pilih printer untuk menghubungkan'}
                </p>
              </div>
              {isConnected && (
                <button
                  onClick={disconnectDevice}
                  className="px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-sm"
                >
                  Putuskan
                </button>
              )}
            </div>
          </div>

          {/* Paper Width */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Lebar Kertas</label>
            <div className="flex gap-2">
              {(['58mm', '80mm'] as const).map((width) => (
                <button
                  key={width}
                  onClick={() => updateSettings({ paperWidth: width })}
                  className={cn(
                    "flex-1 py-2 rounded-xl font-medium transition-colors",
                    printerSettings.paperWidth === width
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {width}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Connect Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 mb-4">
            <div>
              <p className="font-medium">Auto Connect</p>
              <p className="text-sm text-muted-foreground">Hubungkan otomatis saat aplikasi dibuka</p>
            </div>
            <button
              onClick={() => updateSettings({ autoConnect: !printerSettings.autoConnect })}
              className={cn(
                "w-14 h-8 rounded-full transition-colors relative",
                printerSettings.autoConnect ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "absolute top-1 w-6 h-6 rounded-full bg-white transition-transform",
                printerSettings.autoConnect ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          {/* Auto Cut Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 mb-4">
            <div>
              <p className="font-medium">Auto Cut Paper</p>
              <p className="text-sm text-muted-foreground">Potong kertas otomatis setelah cetak</p>
            </div>
            <button
              onClick={() => updateSettings({ autoCut: !printerSettings.autoCut })}
              className={cn(
                "w-14 h-8 rounded-full transition-colors relative",
                printerSettings.autoCut ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "absolute top-1 w-6 h-6 rounded-full bg-white transition-transform",
                printerSettings.autoCut ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          {/* Scan & Connect */}
          {isNative && (
            <div className="space-y-3">
              <button
                onClick={scanDevices}
                disabled={isScanning}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mencari Printer...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Scan Printer Bluetooth
                  </>
                )}
              </button>

              {/* Device List */}
              {availableDevices.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => connectDevice(device)}
                      className="w-full p-3 rounded-xl bg-muted/50 hover:bg-muted text-left flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground">{device.address}</p>
                      </div>
                      <Bluetooth className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isNative && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Fitur printer Bluetooth hanya tersedia di aplikasi Android
            </p>
          )}

          {/* Test Print */}
          <button
            onClick={testPrint}
            disabled={isPrinting}
            className="w-full h-12 mt-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mencetak...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                Test Print
              </>
            )}
          </button>
        </div>

        {/* Tax & Discount */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
              <Percent className="w-5 h-5 text-info" />
            </div>
            <div>
              <h3 className="font-semibold">Pajak & Diskon</h3>
              <p className="text-sm text-muted-foreground">Pengaturan default transaksi</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pajak Default (%)</label>
              <input
                type="number"
                value={storeSettings.taxRate}
                onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: Number(e.target.value) })}
                className="w-full h-12 px-4 rounded-xl bg-input border border-border"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">Sembako umumnya 0% PPN</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Diskon Default (%)</label>
              <input
                type="number"
                value={storeSettings.defaultDiscount}
                onChange={(e) => setStoreSettings({ ...storeSettings, defaultDiscount: Number(e.target.value) })}
                className="w-full h-12 px-4 rounded-xl bg-input border border-border"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Backup */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold">Data & Backup</h3>
              <p className="text-sm text-muted-foreground">Data tersimpan di Supabase cloud</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Semua data transaksi, produk, dan pelanggan tersimpan secara real-time di cloud Supabase. 
              Data aman dan dapat diakses dari perangkat manapun.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-pos-primary flex items-center gap-2">
          <Save className="w-5 h-5" />
          <span>Simpan Pengaturan</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
