import { useState } from 'react';
import { useUsers, UserProfile } from '@/hooks/useUsers';
import { Users, Plus, Edit, Shield, ShieldCheck, X, Search, UserCheck, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { users, isLoading, updateUserStatus, updateUserRole } = useUsers();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'kasir'>('kasir');

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    await updateUserStatus(userId, !currentStatus);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    
    const success = await updateUserRole(editingUser.id, selectedRole);
    if (success) {
      setShowModal(false);
      setEditingUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Manajemen User</h1>
          <p className="text-muted-foreground">{users.length} user terdaftar</p>
        </div>
        <p className="text-sm text-muted-foreground bg-muted px-4 py-2 rounded-lg">
          User baru dibuat melalui halaman Login &gt; Daftar
        </p>
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
            <p className="text-2xl font-bold">{users.filter((u) => u.is_active).length}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
            <UserX className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">User Nonaktif</p>
            <p className="text-2xl font-bold">{users.filter((u) => !u.is_active).length}</p>
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
                <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">Terdaftar</th>
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
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.is_active
                          ? 'badge-success hover:bg-success/30'
                          : 'badge-warning hover:bg-warning/30'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-success' : 'bg-warning'}`} />
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground text-sm">
                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setSelectedRole(user.role);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit Role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Tidak ada user ditemukan</p>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {showModal && editingUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">Edit Role User</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">User</p>
                <p className="font-semibold">{editingUser.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'kasir')}
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border"
                >
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 btn-pos-secondary"
              >
                Batal
              </button>
              <button
                onClick={handleSaveRole}
                className="flex-1 btn-pos-primary"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
