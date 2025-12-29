import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  address: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching customers:', error);
        toast.error('Gagal memuat pelanggan');
        return;
      }

      setCustomers((data || []) as Customer[]);
    } catch (error) {
      console.error('Error in fetchCustomers:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();

    // Real-time subscription
    const channel = supabase
      .channel('customers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCustomers((prev) => [...prev, payload.new as Customer].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === 'UPDATE') {
            setCustomers((prev) => prev.map((c) => (c.id === payload.new.id ? (payload.new as Customer) : c)));
          } else if (payload.eventType === 'DELETE') {
            setCustomers((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCustomers]);

  const addCustomer = async (data: CustomerFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from('customers').insert({
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
      });

      if (error) {
        console.error('Error adding customer:', error);
        toast.error(error.message || 'Gagal menambah pelanggan');
        return false;
      }

      toast.success('Pelanggan berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addCustomer:', error);
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  const updateCustomer = async (id: string, data: Partial<CustomerFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating customer:', error);
        toast.error(error.message || 'Gagal mengupdate pelanggan');
        return false;
      }

      toast.success('Pelanggan berhasil diperbarui');
      return true;
    } catch (error) {
      console.error('Error in updateCustomer:', error);
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);

      if (error) {
        console.error('Error deleting customer:', error);
        toast.error(error.message || 'Gagal menghapus pelanggan');
        return false;
      }

      toast.success('Pelanggan berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error in deleteCustomer:', error);
      toast.error('Terjadi kesalahan');
      return false;
    }
  };

  return {
    customers,
    isLoading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
}
