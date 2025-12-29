import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface SupplierFormData {
  name: string;
  phone: string;
  address: string;
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching suppliers:', error);
        toast.error('Gagal memuat supplier');
        return;
      }

      setSuppliers((data || []) as Supplier[]);
    } catch (error) {
      console.error('Error in fetchSuppliers:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();

    // Real-time subscription
    const channel = supabase
      .channel('suppliers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'suppliers' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSuppliers((prev) => [...prev, payload.new as Supplier].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'UPDATE') {
            setSuppliers((prev) => prev.map((s) => (s.id === payload.new.id ? (payload.new as Supplier) : s)));
          } else if (payload.eventType === 'DELETE') {
            setSuppliers((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSuppliers]);

  const addSupplier = async (data: SupplierFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from('suppliers').insert({
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
      });

      if (error) {
        console.error('Error adding supplier:', error);
        toast.error(error.message || 'Gagal menambah supplier');
        return false;
      }

      toast.success('Supplier berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addSupplier:', error);
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  const updateSupplier = async (id: string, data: Partial<SupplierFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating supplier:', error);
        toast.error(error.message || 'Gagal mengupdate supplier');
        return false;
      }

      toast.success('Supplier berhasil diperbarui');
      return true;
    } catch (error) {
      console.error('Error in updateSupplier:', error);
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  const deleteSupplier = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);

      if (error) {
        console.error('Error deleting supplier:', error);
        toast.error(error.message || 'Gagal menghapus supplier');
        return false;
      }

      toast.success('Supplier berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error in deleteSupplier:', error);
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  return {
    suppliers,
    isLoading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: fetchSuppliers,
  };
}
