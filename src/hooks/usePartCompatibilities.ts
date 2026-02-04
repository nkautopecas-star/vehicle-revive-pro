import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PartCompatibility {
  id: string;
  part_id: string;
  marca: string;
  modelo: string;
  ano_inicio: number | null;
  ano_fim: number | null;
  observacoes: string | null;
  created_at: string;
}

export interface CompatibilityFormData {
  marca: string;
  modelo: string;
  ano_inicio?: number;
  ano_fim?: number;
  observacoes?: string;
}

export function usePartCompatibilities(partId: string | undefined) {
  return useQuery({
    queryKey: ['part-compatibilities', partId],
    queryFn: async (): Promise<PartCompatibility[]> => {
      if (!partId) return [];
      
      const { data, error } = await supabase
        .from('part_compatibilities')
        .select('*')
        .eq('part_id', partId)
        .order('marca', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!partId,
  });
}

export function useCreateCompatibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partId, data }: { partId: string; data: CompatibilityFormData }) => {
      const { error } = await supabase
        .from('part_compatibilities')
        .insert({
          part_id: partId,
          marca: data.marca,
          modelo: data.modelo,
          ano_inicio: data.ano_inicio || null,
          ano_fim: data.ano_fim || null,
          observacoes: data.observacoes || null,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['part-compatibilities', variables.partId] });
      toast.success('Compatibilidade adicionada!');
    },
    onError: (error) => {
      console.error('Error creating compatibility:', error);
      toast.error('Erro ao adicionar compatibilidade.');
    },
  });
}

export function useUpdateCompatibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      partId, 
      data 
    }: { 
      id: string; 
      partId: string; 
      data: CompatibilityFormData 
    }) => {
      const { error } = await supabase
        .from('part_compatibilities')
        .update({
          marca: data.marca,
          modelo: data.modelo,
          ano_inicio: data.ano_inicio || null,
          ano_fim: data.ano_fim || null,
          observacoes: data.observacoes || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['part-compatibilities', variables.partId] });
      toast.success('Compatibilidade atualizada!');
    },
    onError: (error) => {
      console.error('Error updating compatibility:', error);
      toast.error('Erro ao atualizar compatibilidade.');
    },
  });
}

export function useDeleteCompatibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, partId }: { id: string; partId: string }) => {
      const { error } = await supabase
        .from('part_compatibilities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['part-compatibilities', variables.partId] });
      toast.success('Compatibilidade removida!');
    },
    onError: (error) => {
      console.error('Error deleting compatibility:', error);
      toast.error('Erro ao remover compatibilidade.');
    },
  });
}
