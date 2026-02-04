import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type VehicleStatus = 'ativo' | 'desmontando' | 'desmontado' | 'finalizado';

export interface Vehicle {
  id: string;
  placa: string;
  chassi: string | null;
  marca: string;
  modelo: string;
  ano: number;
  motorizacao: string | null;
  combustivel: string | null;
  cor: string | null;
  data_entrada: string;
  status: VehicleStatus;
  observacoes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  parts_count?: number;
}

export interface VehicleFormData {
  placa: string;
  chassi?: string;
  marca: string;
  modelo: string;
  ano: number;
  motorizacao?: string;
  combustivel?: string;
  cor?: string;
  data_entrada?: string;
  status?: VehicleStatus;
  observacoes?: string;
}

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          parts:parts(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to include parts_count
      return (data || []).map((vehicle: any) => ({
        ...vehicle,
        parts_count: vehicle.parts?.[0]?.count || 0,
      })) as Vehicle[];
    },
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Vehicle;
    },
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: VehicleFormData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          placa: formData.placa,
          chassi: formData.chassi || null,
          marca: formData.marca,
          modelo: formData.modelo,
          ano: formData.ano,
          motorizacao: formData.motorizacao || null,
          combustivel: formData.combustivel || null,
          cor: formData.cor || null,
          data_entrada: formData.data_entrada || new Date().toISOString().split('T')[0],
          status: formData.status || 'ativo',
          observacoes: formData.observacoes || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo cadastrado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating vehicle:', error);
      toast.error('Erro ao cadastrar veículo. Verifique os dados e tente novamente.');
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: VehicleFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          placa: formData.placa,
          chassi: formData.chassi || null,
          marca: formData.marca,
          modelo: formData.modelo,
          ano: formData.ano,
          motorizacao: formData.motorizacao || null,
          combustivel: formData.combustivel || null,
          cor: formData.cor || null,
          data_entrada: formData.data_entrada,
          status: formData.status,
          observacoes: formData.observacoes || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error updating vehicle:', error);
      toast.error('Erro ao atualizar veículo.');
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error deleting vehicle:', error);
      if (error.message?.includes('permission')) {
        toast.error('Você não tem permissão para excluir veículos.');
      } else {
        toast.error('Erro ao excluir veículo.');
      }
    },
  });
}
