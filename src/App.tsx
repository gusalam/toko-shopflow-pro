import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/layouts/AdminLayout";
import { KasirLayout } from "@/layouts/KasirLayout";
import { useAuthStore } from "@/store/useAuthStore";

// Pages
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminSuppliers from "@/pages/admin/AdminSuppliers";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminFinance from "@/pages/admin/AdminFinance";
import AdminReports from "@/pages/admin/AdminReports";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminUsers from "@/pages/admin/AdminUsers";
import KasirDashboard from "@/pages/kasir/KasirDashboard";
import KasirTransaction from "@/pages/kasir/KasirTransaction";
import KasirHistory from "@/pages/kasir/KasirHistory";
import KasirShift from "@/pages/kasir/KasirShift";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/suppliers" element={<AdminSuppliers />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/finance" element={<AdminFinance />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Kasir Routes - allow admin to access kasir routes too */}
      <Route element={<ProtectedRoute allowedRoles={['kasir', 'admin']} />}>
        <Route element={<KasirLayout />}>
          <Route path="/kasir" element={<KasirDashboard />} />
          <Route path="/kasir/transaksi" element={<KasirTransaction />} />
          <Route path="/kasir/history" element={<KasirHistory />} />
          <Route path="/kasir/shift" element={<KasirShift />} />
        </Route>
      </Route>

      {/* Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
