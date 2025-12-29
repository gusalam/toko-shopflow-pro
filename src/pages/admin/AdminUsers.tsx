import { useState } from 'react';
import { Users, Plus, Edit, Trash2, Shield, ShieldCheck, X, Eye, EyeOff, Search, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'kasir';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const dummyUsers: User[] = [
  { id: '1', name: 'Admin Toko', email: 'admin@tokosembako.com', role: 'admin', isActive: true, lastLogin: '28 Des 2024, 08:00', createdAt: '01 Jan 2024' },
  { id: '2', name: 'Kasir Budi', email: 'budi@tokosembako.com', role: 'kasir', isActive: true, lastLogin: '28 Des 2024, 07:30', createdAt: '15 Feb 2024' },
  { id: '3', name: 'Kasir Siti', email: 'siti@tokosembako.com', role: 'kasir', isActive: true, lastLogin: '27 Des 2024, 14:00', createdAt: '20 Mar 2024' },
  { id: '4', name: 'Kasir Andi', email: 'andi@tokosembako.com', role: 'kasir', isActive: false, lastLogin: '15 Des 2024, 10:00', createdAt: '01 Apr 2024' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState(dummyUsers);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map((user) =>
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
    toast.success('Status user berhasil diubah');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Manajemen User</h1>
          <p className="text-muted-foreground">{users.length} user terdaftar</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="btn-pos-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah User</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari user..."
          className="w-full h-12 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total User</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">User Aktif</p>
            <p className="text-2xl font-bold">{users.filter((u) => u.isActive).length}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
            <UserX className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">User Nonaktif</p>
            <p className="text-2xl font-bold">{users.filter((u) => !u.isActive).length}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">User</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Role</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Login Terakhir</th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-info/20 text-info'
                    }`}>
                      {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                      {user.role === 'admin' ? 'Admin' : 'Kasir'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.isActive
                          ? 'badge-success hover:bg-success/30'
                          : 'badge-warning hover:bg-warning/30'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-success' : 'bg-warning'}`} />
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground text-sm">{user.lastLogin || '-'}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toast.info('Reset password link dikirim ke email user')}
                        className="p-2 rounded-lg hover:bg-info/20 text-muted-foreground hover:text-info transition-colors"
                        title="Reset Password"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => toast.error('Fitur hapus user belum tersedia')}
                          className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">
                {editingUser ? 'Edit User' : 'Tambah User Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama</label>
                <input
                  type="text"
                  defaultValue={editingUser?.name}
                  placeholder="Nama lengkap"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={editingUser?.email}
                  placeholder="email@example.com"
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  defaultValue={editingUser?.role || 'kasir'}
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border"
                >
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full h-12 px-4 rounded-xl bg-input border border-border"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 btn-pos-secondary"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  toast.success(editingUser ? 'User berhasil diperbarui' : 'User berhasil ditambahkan');
                  setShowModal(false);
                }}
                className="flex-1 btn-pos-primary"
              >
                {editingUser ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
