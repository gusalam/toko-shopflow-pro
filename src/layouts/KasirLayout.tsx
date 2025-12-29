import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import {
  Store,
  ShoppingCart,
  History,
  Clock,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { LayoutDashboard } from 'lucide-react';

const navItems = [
  { path: '/kasir', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/kasir/transaksi', label: 'Transaksi', icon: ShoppingCart },
  { path: '/kasir/history', label: 'Riwayat', icon: History },
  { path: '/kasir/shift', label: 'Shift', icon: Clock },
];

export const KasirLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, currentShift } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

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
                <p className="text-2xs text-muted-foreground">Mode Kasir</p>
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

        {/* Shift Status */}
        <div className="p-4 border-b border-sidebar-border">
          {currentShift?.isActive ? (
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg bg-success/20 text-success',
              !sidebarOpen && 'justify-center px-2'
            )}>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Shift Aktif</span>}
            </div>
          ) : (
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/20 text-warning',
              !sidebarOpen && 'justify-center px-2'
            )}>
              <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Shift Belum Dimulai</span>}
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="w-5 h-5" />
                  {item.path === '/kasir/transaksi' && totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </div>
                {sidebarOpen && <span className="font-medium animate-fade-in">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">{user?.name.charAt(0)}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="font-medium text-sm text-sidebar-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground">Kasir</p>
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
            <div>
              <h1 className="font-bold text-lg">TokoSembako</h1>
              <p className="text-2xs text-muted-foreground">Mode Kasir</p>
            </div>
          </div>
          
          {/* Shift Status Badge */}
          {currentShift?.isActive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/20 text-success">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium hidden sm:inline">Shift Aktif</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/20 text-warning">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-xs font-medium hidden sm:inline">Belum Shift</span>
            </div>
          )}
          
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
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-4 rounded-xl transition-all relative',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {item.path === '/kasir/transaksi' && totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                          {totalItems > 99 ? '99+' : totalItems}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* User Info in Mobile */}
              <div className="pt-4 mt-4 border-t border-border">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold">{user?.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">Kasir</p>
                  </div>
                </div>
              </div>
              
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
