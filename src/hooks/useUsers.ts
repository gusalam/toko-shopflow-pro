import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'kasir';
  is_active: boolean;
  created_at: string;
}

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Gagal memuat data user');
        return;
      }

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Combine profiles with roles
      const usersWithRoles: UserProfile[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          name: profile.name,
          email: '', // Email not stored in profiles, would need auth.users access
          role: (userRole?.role as 'admin' | 'kasir') || 'kasir',
          is_active: profile.is_active,
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    // Real-time subscription for profiles
    const channel = supabase
      .channel('users-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        () => {
          fetchUsers(); // Refetch all to get roles
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          fetchUsers(); // Refetch all to get roles
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  const updateUserStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        toast.error(error.message || 'Gagal mengupdate status user');
        return false;
      }

      toast.success('Status user berhasil diubah');
      return true;
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'kasir'): Promise<boolean> => {
    try {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating role:', error);
          toast.error(error.message || 'Gagal mengupdate role');
          return false;
        }
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) {
          console.error('Error inserting role:', error);
          toast.error(error.message || 'Gagal menambah role');
          return false;
        }
      }

      await fetchUsers();
      toast.success('Role user berhasil diubah');
      return true;
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  return {
    users,
    isLoading,
    updateUserStatus,
    updateUserRole,
    refetch: fetchUsers,
  };
}
