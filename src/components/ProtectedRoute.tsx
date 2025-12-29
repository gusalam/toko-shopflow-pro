import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore, UserRole } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = user.role === 'admin' ? '/admin' : '/kasir';
    return <Navigate to={redirectPath} replace />;
  }

  // Check if user is active
  if (user && !user.isActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Akun Nonaktif</h2>
          <p className="text-muted-foreground">Akun Anda telah dinonaktifkan. Hubungi admin.</p>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
