import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Store, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, isAuthenticated, user, isLoading: authLoading } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const from = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/kasir');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          toast.error('Nama harus diisi');
          setIsLoading(false);
          return;
        }
        const result = await signup(email, password, name);
        if (result.success) {
          toast.success(result.error || 'Pendaftaran berhasil! Silakan login.');
          setIsSignUp(false);
          setName('');
        } else {
          toast.error(result.error || 'Pendaftaran gagal');
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          const currentUser = useAuthStore.getState().user;
          toast.success(`Selamat datang, ${currentUser?.name}!`);
          
          const from = location.state?.from?.pathname || (currentUser?.role === 'admin' ? '/admin' : '/kasir');
          navigate(from, { replace: true });
        } else {
          toast.error(result.error || 'Email atau password salah');
        }
      }
    } catch {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-primary/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-info/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary shadow-2xl shadow-primary/30 mb-4">
            <Store className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">TokoSembako</h1>
          <p className="text-muted-foreground mt-2">Point of Sale System</p>
        </div>

        {/* Login/Signup Card */}
        <div className="glass rounded-3xl p-8 shadow-xl">
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-center font-medium rounded-l-xl transition-all ${
                !isSignUp ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-center font-medium rounded-r-xl transition-all ${
                isSignUp ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name (only for signup) */}
            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  required={isSignUp}
                  className="w-full h-14 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@tokosembako.com"
                required
                className="w-full h-14 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  minLength={6}
                  className="w-full h-14 px-4 pr-12 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-pos-primary flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  <span>{isSignUp ? 'Daftar' : 'Masuk'}</span>
                </>
              )}
            </button>
          </form>

          {/* Info for signup */}
          {isSignUp && (
            <div className="mt-4 p-3 rounded-lg bg-info/10 border border-info/20">
              <p className="text-xs text-muted-foreground">
                Akun baru akan mendapat role <strong>kasir</strong>. Hubungi admin untuk mendapat akses admin.
              </p>
            </div>
          )}

          {/* Note about email confirmation */}
          {!isSignUp && (
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-primary hover:underline"
                >
                  Daftar sekarang
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
