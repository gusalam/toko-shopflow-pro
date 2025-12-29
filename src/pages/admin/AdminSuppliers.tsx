import { useState } from 'react';
import {
  Search,
  Plus,
  Truck,
  Edit,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

const dummySuppliers: Supplier[] = [
  {
    id: '1',
    name: 'PT Beras Nusantara',
    contactPerson: 'Budi Santoso',
    phone: '081234567890',
    email: 'budi@berasnusantara.com',
    address: 'Jl. Industri No. 123',
    city: 'Jakarta',
    notes: 'Supplier utama beras dan tepung',
    status: 'active',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'CV Minyak Jaya',
    contactPerson: 'Andi Wijaya',
    phone: '082345678901',
    email: 'andi@minyakjaya.com',
    address: 'Jl. Raya Industri No. 45',
    city: 'Surabaya',
    notes: 'Supplier minyak goreng',
    status: 'active',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'UD Sembako Makmur',
    contactPerson: 'Dewi Lestari',
    phone: '083456789012',
    email: 'dewi@sembakomakmur.com',
    address: 'Jl. Pasar Baru No. 78',
    city: 'Bandung',
    notes: 'Supplier gula, kopi, dan bumbu dapur',
    status: 'active',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    name: 'PT Minuman Segar',
    contactPerson: 'Rudi Hartono',
    phone: '084567890123',
    email: 'rudi@minumansegar.com',
    address: 'Jl. Industri Kecil No. 56',
    city: 'Semarang',
    notes: 'Supplier minuman kemasan',
    status: 'inactive',
    createdAt: new Date('2024-01-05'),
  },
];

const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(dummySuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
    status: 'active' as 'active' | 'inactive',
  });

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSuppliers = suppliers.filter((s) => s.status === 'active').length;

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      notes: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      city: supplier.city,
      notes: supplier.notes,
      status: supplier.status,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Nama supplier tidak boleh kosong');
      return;
    }

    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplier.id ? { ...s, ...formData } : s
        )
      );
      toast.success('Supplier berhasil diperbarui');
    } else {
      const newSupplier: Supplier = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      setSuppliers((prev) => [...prev, newSupplier]);
      toast.success('Supplier berhasil ditambahkan');
    }

    setShowModal(false);
    setEditingSupplier(null);
  };

  const handleDelete = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setShowDeleteConfirm(null);
    toast.success('Supplier berhasil dihapus');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Supplier</h1>
          <p className="text-muted-foreground">
            {suppliers.length} supplier, {activeSuppliers} aktif
          </p>
        </div>
        <button onClick={openAddModal} className="btn-pos-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Tambah Supplier</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{suppliers.length}</p>
              <p className="text-sm text-muted-foreground">Total Supplier</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeSuppliers}</p>
              <p className="text-sm text-muted-foreground">Supplier Aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari supplier..."
          className="w-full h-12 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="stat-card hover:border-primary/50 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{supplier.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {supplier.contactPerson}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  supplier.status === 'active'
                    ? 'badge-success'
                    : 'badge-warning'
                )}
              >
                {supplier.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{supplier.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{supplier.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{supplier.city}</span>
              </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditModal(supplier)}
                className="flex-1 py-2 px-3 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(supplier.id)}
                className="py-2 px-3 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="py-12 text-center">
          <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Tidak ada supplier ditemukan</p>
          <p className="text-muted-foreground">Coba ubah kata kunci pencarian</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setEditingSupplier(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border animate-scale-in overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSupplier(null);
                }}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Supplier</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="PT Contoh Supplier"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nama Kontak</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Nama contact person"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Telepon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@supplier.com"
                    className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Alamat</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kota</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Kota"
                    className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Catatan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan tambahan..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 sm:p-6 border-t border-border shrink-0">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSupplier(null);
                }}
                className="flex-1 btn-pos-secondary"
              >
                Batal
              </button>
              <button onClick={handleSave} className="flex-1 btn-pos-primary">
                {editingSupplier ? 'Simpan Perubahan' : 'Tambah Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border p-6 animate-scale-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-bold mb-2">Hapus Supplier?</h3>
              <p className="text-muted-foreground mb-6">
                Supplier yang dihapus tidak dapat dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 btn-pos-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 btn-pos-danger"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSuppliers;
