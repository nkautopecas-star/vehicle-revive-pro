import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PartCondition = Database["public"]["Enums"]["part_condition"];
type PartStatus = Database["public"]["Enums"]["part_status"];

export interface PartDetails {
  id: string;
  nome: string;
  codigo_interno: string | null;
  codigo_oem: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  condicao: PartCondition;
  vehicle_id: string | null;
  veiculo_info: string | null;
  quantidade: number;
  quantidade_minima: number;
  localizacao: string | null;
  preco_custo: number | null;
  preco_venda: number | null;
  observacoes: string | null;
  status: PartStatus;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function usePartDetails(partId: string | undefined) {
  return useQuery({
    queryKey: ['part-details', partId],
    queryFn: async (): Promise<PartDetails | null> => {
      if (!partId) return null;
      
      const { data, error } = await supabase
        .from('parts')
        .select(`
          *,
          categories(name),
          vehicles(marca, modelo, ano, placa)
        `)
        .eq('id', partId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        ...data,
        categoria_nome: (data as any).categories?.name || null,
        veiculo_info: (data as any).vehicles 
          ? `${(data as any).vehicles.marca} ${(data as any).vehicles.modelo} ${(data as any).vehicles.ano} - ${(data as any).vehicles.placa}`
          : null,
      };
    },
    enabled: !!partId,
  });
}
