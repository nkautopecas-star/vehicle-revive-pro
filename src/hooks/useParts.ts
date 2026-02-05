import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type PartCondition = Database["public"]["Enums"]["part_condition"];
type PartStatus = Database["public"]["Enums"]["part_status"];

export interface Part {
  id: string;
  nome: string;
  codigo_interno: string | null;
  codigo_oem: string | null;
  categoria_id: string | null;
  categoria_nome?: string;
  condicao: PartCondition;
  vehicle_id: string | null;
  veiculo_info?: string;
  quantidade: number;
  quantidade_minima: number;
  localizacao: string | null;
  preco_custo: number | null;
  preco_venda: number | null;
  observacoes: string | null;
  status: PartStatus;
   peso_gramas: number | null;
   comprimento_cm: number | null;
   largura_cm: number | null;
   altura_cm: number | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PartFormData {
  nome: string;
  codigo_interno?: string;
  codigo_oem?: string;
  categoria_id?: string;
  condicao: PartCondition;
  vehicle_id?: string;
  quantidade: number;
  quantidade_minima?: number;
  localizacao?: string;
  preco_custo?: number;
  preco_venda?: number;
  observacoes?: string;
  status?: PartStatus;
 }
 
 export interface ExtendedPartFormData extends PartFormData {
   peso_gramas?: number;
   comprimento_cm?: number;
   largura_cm?: number;
   altura_cm?: number;
}

export function useParts() {
  return useQuery({
    queryKey: ['parts'],
    queryFn: async (): Promise<Part[]> => {
      const { data: parts, error: partsError } = await supabase
        .from('parts')
        .select(`
          *,
          categories(name),
          vehicles(marca, modelo, ano, placa)
        `)
        .order('created_at', { ascending: false });

      if (partsError) {
        throw partsError;
      }

      return parts.map((part: any) => ({
        ...part,
        categoria_nome: part.categories?.name || null,
        veiculo_info: part.vehicles 
          ? `${part.vehicles.marca} ${part.vehicles.modelo} ${part.vehicles.ano} - ${part.vehicles.placa}`
          : null,
         peso_gramas: part.peso_gramas || null,
         comprimento_cm: part.comprimento_cm || null,
         largura_cm: part.largura_cm || null,
         altura_cm: part.altura_cm || null,
      }));
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return data;
    },
  });
}

export function useVehiclesForSelect() {
  return useQuery({
    queryKey: ['vehicles-for-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, marca, modelo, ano, placa')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(v => ({
        id: v.id,
        label: `${v.marca} ${v.modelo} ${v.ano} - ${v.placa}`,
      }));
    },
  });
}

export function useCreatePart() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
      mutationFn: async (data: ExtendedPartFormData): Promise<string> => {
      if (!user) throw new Error('Usuário não autenticado');

       const { data: insertedPart, error } = await supabase
        .from('parts')
        .insert({
          nome: data.nome,
          codigo_interno: data.codigo_interno || null,
          codigo_oem: data.codigo_oem || null,
          categoria_id: data.categoria_id || null,
          condicao: data.condicao,
          vehicle_id: data.vehicle_id || null,
          quantidade: data.quantidade,
          quantidade_minima: data.quantidade_minima || 0,
          localizacao: data.localizacao || null,
          preco_custo: data.preco_custo || null,
          preco_venda: data.preco_venda || null,
          observacoes: data.observacoes || null,
          status: data.status || 'ativa',
          user_id: user.id,
           peso_gramas: data.peso_gramas || null,
           comprimento_cm: data.comprimento_cm || null,
           largura_cm: data.largura_cm || null,
           altura_cm: data.altura_cm || null,
          })
          .select('id')
          .single();

      if (error) {
        throw error;
      }
       
       return insertedPart.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Peça cadastrada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating part:', error);
      toast.error('Erro ao cadastrar peça. Verifique suas permissões.');
    },
  });
}

export function useUpdatePart() {
  const queryClient = useQueryClient();

  return useMutation({
     mutationFn: async ({ id, data }: { id: string; data: Partial<ExtendedPartFormData> }) => {
      const { error } = await supabase
        .from('parts')
        .update({
          nome: data.nome,
          codigo_interno: data.codigo_interno || null,
          codigo_oem: data.codigo_oem || null,
          categoria_id: data.categoria_id || null,
          condicao: data.condicao,
          vehicle_id: data.vehicle_id || null,
          quantidade: data.quantidade,
          quantidade_minima: data.quantidade_minima,
          localizacao: data.localizacao || null,
          preco_custo: data.preco_custo || null,
          preco_venda: data.preco_venda || null,
          observacoes: data.observacoes || null,
          status: data.status,
           peso_gramas: data.peso_gramas || null,
           comprimento_cm: data.comprimento_cm || null,
           largura_cm: data.largura_cm || null,
           altura_cm: data.altura_cm || null,
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Peça atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating part:', error);
      toast.error('Erro ao atualizar peça.');
    },
  });
}

export function useDeletePart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Peça excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting part:', error);
      toast.error('Erro ao excluir peça.');
    },
  });
}
