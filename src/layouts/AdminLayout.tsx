import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  UserCheck,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Produk & Inventory', icon: Package },
  { path: '/admin/suppliers', label: 'Supplier', icon: Truck },
  { path: '/admin/customers', label: 'Pelanggan', icon: UserCheck },
  { path: '/admin/users', label: 'Manajemen User', icon: Users },
  { path: '/admin/finance', label: 'Pembukuan', icon: Wallet },
  { path: '/admin/reports', label: 'Laporan', icon: BarChart3 },
  { path: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-lg text-sidebar-foreground">TokoSembako</h1>
                <p className="text-2xs text-muted-foreground">Point of Sale</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <ChevronRight
              className={cn(
                'w-5 h-5 text-muted-foreground transition-transform',
                !sidebarOpen && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium animate-fade-in">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold">{user?.name.charAt(0)}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="font-medium text-sm text-sidebar-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <header className="h-16 bg-pos-header border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-bold text-lg">TokoSembako</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 bg-background/95 backdrop-blur-sm animate-fade-in">
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-4 rounded-xl transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Keluar</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 min-h-screen lg:p-0 pt-16 lg:pt-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
