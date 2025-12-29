import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'kasir';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface Shift {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  startingCash: number;
  endingCash?: number;
  totalSales: number;
  totalTransactions: number;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentShift: Shift | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
  startShift: (startingCash: number) => Promise<Shift | null>;
  endShift: (endingCash: number) => Promise<boolean>;
  fetchActiveShift: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  currentShift: null,

  initialize: async () => {
    set({ isLoading: true });

    // Set up auth state listener
    supabase.auth.onAuthStateChange(
      (event, session) => {
        set({ session, isAuthenticated: !!session });
        
        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            get().fetchUserProfile(session.user.id);
            get().fetchActiveShift();
          }, 0);
        } else {
          set({ user: null, currentShift: null });
        }
      }
    );

    // Check existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({ session, isAuthenticated: true });
      await get().fetchUserProfile(session.user.id);
      await get().fetchActiveShift();
    }

    set({ isLoading: false });
  },

  fetchUserProfile: async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, name, is_active')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (!profile) {
        console.error('Profile not found');
        return;
      }

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      const session = get().session;
      const user: User = {
        id: profile.id,
        name: profile.name,
        email: session?.user?.email || '',
        role: (roleData?.role as UserRole) || 'kasir',
        isActive: profile.is_active,
      };

      set({ user });
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  },

  login: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        set({ session: data.session, isAuthenticated: true });
        await get().fetchUserProfile(data.user.id);
        await get().fetchActiveShift();
        return { success: true };
      }

      return { success: false, error: 'Login gagal' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Terjadi kesalahan' };
    }
  },

  signup: async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        return { success: true, error: 'Silakan cek email untuk verifikasi' };
      }

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Terjadi kesalahan' };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false, currentShift: null });
  },

  fetchActiveShift: async () => {
    const user = get().user;
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('cashier_id', user.id)
        .is('closed_at', null)
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching shift:', error);
        return;
      }

      if (data) {
        const shift: Shift = {
          id: data.id,
          userId: data.cashier_id,
          startTime: new Date(data.opened_at),
          endTime: data.closed_at ? new Date(data.closed_at) : undefined,
          startingCash: Number(data.start_cash),
          endingCash: data.end_cash ? Number(data.end_cash) : undefined,
          totalSales: Number(data.total_sales) || 0,
          totalTransactions: data.total_transactions || 0,
          isActive: !data.closed_at,
        };
        set({ currentShift: shift });
      } else {
        set({ currentShift: null });
      }
    } catch (error) {
      console.error('Error in fetchActiveShift:', error);
    }
  },

  startShift: async (startingCash: number) => {
    const user = get().user;
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          cashier_id: user.id,
          start_cash: startingCash,
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting shift:', error);
        return null;
      }

      const shift: Shift = {
        id: data.id,
        userId: data.cashier_id,
        startTime: new Date(data.opened_at),
        startingCash: Number(data.start_cash),
        totalSales: 0,
        totalTransactions: 0,
        isActive: true,
      };

      set({ currentShift: shift });
      return shift;
    } catch (error) {
      console.error('Error in startShift:', error);
      return null;
    }
  },

  endShift: async (endingCash: number) => {
    const currentShift = get().currentShift;
    if (!currentShift) return false;

    try {
      const { data, error } = await supabase.rpc('close_shift', {
        p_shift_id: currentShift.id,
        p_end_cash: endingCash,
      });

      if (error) {
        console.error('Error closing shift:', error);
        return false;
      }

      if (data) {
        set({
          currentShift: {
            ...currentShift,
            endTime: new Date(),
            endingCash,
            isActive: false,
          },
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in endShift:', error);
      return false;
    }
  },
}));
