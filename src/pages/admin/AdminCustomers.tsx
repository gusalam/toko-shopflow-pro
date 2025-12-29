import { useState } from 'react';
import {
  Search,
  Plus,
  Users,
  Edit,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  Star,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  points: number;
  totalTransactions: number;
  totalSpent: number;
  memberSince: Date;
  status: 'active' | 'inactive';
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const dummyCustomers: Customer[] = [
  {
    id: '1',
    name: 'Ahmad Fauzi',
    phone: '081234567890',
    email: 'ahmad@email.com',
    address: 'Jl. Merdeka No. 123, Jakarta',
    points: 1250,
    totalTransactions: 45,
    totalSpent: 2500000,
    memberSince: new Date('2024-01-15'),
    status: 'active',
  },
  {
    id: '2',
    name: 'Siti Rahayu',
    phone: '082345678901',
    email: 'siti@email.com',
    address: 'Jl. Sudirman No. 45, Bandung',
    points: 850,
    totalTransactions: 32,
    totalSpent: 1800000,
    memberSince: new Date('2024-02-20'),
    status: 'active',
  },
  {
    id: '3',
    name: 'Budi Hartono',
    phone: '083456789012',
    email: 'budi@email.com',
    address: 'Jl. Diponegoro No. 78, Surabaya',
    points: 2100,
    totalTransactions: 67,
    totalSpent: 4200000,
    memberSince: new Date('2023-11-10'),
    status: 'active',
  },
  {
    id: '4',
    name: 'Dewi Lestari',
    phone: '084567890123',
    email: 'dewi@email.com',
    address: 'Jl. Gatot Subroto No. 56, Semarang',
    points: 450,
    totalTransactions: 18,
    totalSpent: 950000,
    memberSince: new Date('2024-03-05'),
    status: 'inactive',
  },
];

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>(dummyCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCustomers = customers.filter((c) => c.status === 'active').length;
  const totalPoints = customers.reduce((sum, c) => sum + c.points, 0);
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      status: customer.status,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Nama pelanggan tidak boleh kosong');
      return;
    }

    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id ? { ...c, ...formData } : c
        )
      );
      toast.success('Pelanggan berhasil diperbarui');
    } else {
      const newCustomer: Customer = {
        ...formData,
        id: Date.now().toString(),
        points: 0,
        totalTransactions: 0,
        totalSpent: 0,
        memberSince: new Date(),
      };
      setCustomers((prev) => [...prev, newCustomer]);
      toast.success('Pelanggan berhasil ditambahkan');
    }

    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleDelete = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setShowDeleteConfirm(null);
    toast.success('Pelanggan berhasil dihapus');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Pelanggan</h1>
          <p className="text-muted-foreground">
            {customers.length} pelanggan, {activeCustomers} aktif
          </p>
        </div>
        <button onClick={openAddModal} className="btn-pos-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-sm text-muted-foreground">Total Pelanggan</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Poin</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {customers.reduce((sum, c) => sum + c.totalTransactions, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <span className="text-xl font-bold text-warning">Rp</span>
            </div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-muted-foreground">Total Belanja</p>
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
          placeholder="Cari pelanggan..."
          className="w-full h-12 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

      {/* Customers Table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Pelanggan</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Kontak</th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-muted-foreground">Poin</th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-muted-foreground">Transaksi</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-muted-foreground">Total Belanja</th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Member sejak {customer.memberSince.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium badge-success">
                      <Star className="w-3 h-3" />
                      {customer.points.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center font-medium">
                    {customer.totalTransactions}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-primary">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        customer.status === 'active' ? 'badge-success' : 'badge-warning'
                      )}
                    >
                      {customer.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(customer.id)}
                        className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Tidak ada pelanggan ditemukan</p>
            <p className="text-muted-foreground">Coba ubah kata kunci pencarian</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setEditingCustomer(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border animate-scale-in overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCustomer(null);
                }}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Pelanggan</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama lengkap"
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
                    placeholder="email@contoh.com"
                    className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Alamat</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
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
            <div className="flex gap-3 p-4 sm:p-6 border-t border-border shrink-0">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCustomer(null);
                }}
                className="flex-1 btn-pos-secondary"
              >
                Batal
              </button>
              <button onClick={handleSave} className="flex-1 btn-pos-primary">
                {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
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
              <h3 className="text-lg font-bold mb-2">Hapus Pelanggan?</h3>
              <p className="text-muted-foreground mb-6">
                Data pelanggan yang dihapus tidak dapat dikembalikan.
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

export default AdminCustomers;
