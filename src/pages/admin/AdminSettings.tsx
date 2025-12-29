import { useState } from 'react';
import { Settings, Store, Percent, Printer, Database, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [storeSettings, setStoreSettings] = useState({
    name: 'TokoSembako',
    address: 'Jl. Raya Utama No. 123, Jakarta',
    phone: '021-12345678',
    taxRate: 0,
    defaultDiscount: 0,
    printerEnabled: true,
  });

  const handleSave = () => {
    toast.success('Pengaturan berhasil disimpan');
  };

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

        {/* Printer */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <Printer className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">Printer Struk</h3>
              <p className="text-sm text-muted-foreground">Pengaturan printer thermal</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div>
                <p className="font-medium">Cetak Struk Otomatis</p>
                <p className="text-sm text-muted-foreground">Cetak struk setelah transaksi selesai</p>
              </div>
              <button
                onClick={() => setStoreSettings({ ...storeSettings, printerEnabled: !storeSettings.printerEnabled })}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  storeSettings.printerEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                    storeSettings.printerEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
            <button className="w-full h-12 rounded-xl bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" />
              <span>Test Print</span>
            </button>
          </div>
        </div>

        {/* Backup */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold">Backup & Restore</h3>
              <p className="text-sm text-muted-foreground">Kelola data aplikasi</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground">Backup terakhir:</p>
              <p className="font-medium">28 Desember 2024, 08:00</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toast.success('Backup dimulai...')}
                className="h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4" />
                <span>Backup</span>
              </button>
              <button
                onClick={() => toast.info('Pilih file backup untuk restore')}
                className="h-12 rounded-xl bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4" />
                <span>Restore</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn-pos-primary flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          <span>Simpan Pengaturan</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
