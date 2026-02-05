 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";

export interface PartWithCompatibility {
  partId: string;
  compatibilities: Array<{
    marca: string;
    modelo: string;
    ano_inicio: number | null;
    ano_fim: number | null;
  }>;
}

export function useAllPartCompatibilities() {
  return useQuery({
    queryKey: ['all-part-compatibilities'],
    queryFn: async (): Promise<Map<string, PartWithCompatibility['compatibilities']>> => {
      const { data, error } = await supabase
        .from('part_compatibilities')
        .select('part_id, marca, modelo, ano_inicio, ano_fim');

      if (error) throw error;

      const compatibilityMap = new Map<string, PartWithCompatibility['compatibilities']>();
      
      data?.forEach((compat) => {
        const existing = compatibilityMap.get(compat.part_id) || [];
        existing.push({
          marca: compat.marca,
          modelo: compat.modelo,
          ano_inicio: compat.ano_inicio,
          ano_fim: compat.ano_fim,
        });
        compatibilityMap.set(compat.part_id, existing);
      });

      return compatibilityMap;
    },
  });
}

export interface AdvancedCompatibilityFilter {
  marca: string;
  modelo: string;
  ano: number | null;
}

export function filterPartsByCompatibility(
  partIds: string[],
  compatibilityMap: Map<string, PartWithCompatibility['compatibilities']>,
  searchTerm: string
): Set<string> {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return new Set(partIds);

  const matchingPartIds = new Set<string>();

  partIds.forEach(partId => {
    const compatibilities = compatibilityMap.get(partId) || [];
    
    const hasMatch = compatibilities.some(compat => {
      const marcaMatch = compat.marca.toLowerCase().includes(term);
      const modeloMatch = compat.modelo.toLowerCase().includes(term);
      const fullMatch = `${compat.marca} ${compat.modelo}`.toLowerCase().includes(term);
      
      // Check year if term is numeric
      let yearMatch = false;
      const yearNum = parseInt(term);
      if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
        const anoInicio = compat.ano_inicio || 0;
        const anoFim = compat.ano_fim || 9999;
        yearMatch = yearNum >= anoInicio && yearNum <= anoFim;
      }
      
      return marcaMatch || modeloMatch || fullMatch || yearMatch;
    });

    if (hasMatch) {
      matchingPartIds.add(partId);
    }
  });

  return matchingPartIds;
}
 
 export interface CreateCompatibilityData {
   part_id: string;
   marca: string;
   modelo: string;
   ano_inicio: number | null;
   ano_fim: number | null;
   observacoes?: string;
 }
 
 export function useCreatePartCompatibility() {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (data: CreateCompatibilityData) => {
       const { error } = await supabase
         .from('part_compatibilities')
         .insert({
           part_id: data.part_id,
           marca: data.marca,
           modelo: data.modelo,
           ano_inicio: data.ano_inicio,
           ano_fim: data.ano_fim,
           observacoes: data.observacoes || null,
         });
 
       if (error) {
         throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['part-compatibilities'] });
       queryClient.invalidateQueries({ queryKey: ['all-part-compatibilities'] });
     },
     onError: (error) => {
       console.error('Error creating compatibility:', error);
       toast.error('Erro ao adicionar compatibilidade.');
     },
   });
 }

export function filterPartsByAdvancedCompatibility(
  partIds: string[],
  compatibilityMap: Map<string, PartWithCompatibility['compatibilities']>,
  filter: AdvancedCompatibilityFilter
): Set<string> {
  // If no filter is set, return all parts
  if (!filter.marca && !filter.modelo && !filter.ano) {
    return new Set(partIds);
  }

  const matchingPartIds = new Set<string>();

  partIds.forEach(partId => {
    const compatibilities = compatibilityMap.get(partId) || [];
    
    const hasMatch = compatibilities.some(compat => {
      // Check brand match
      const marcaMatch = !filter.marca || 
        compat.marca.toLowerCase() === filter.marca.toLowerCase();
      
      // Check model match
      const modeloMatch = !filter.modelo || 
        compat.modelo.toLowerCase() === filter.modelo.toLowerCase();
      
      // Check year match (year must be within the compatibility range)
      let yearMatch = true;
      if (filter.ano) {
        const anoInicio = compat.ano_inicio || 0;
        const anoFim = compat.ano_fim || 9999;
        yearMatch = filter.ano >= anoInicio && filter.ano <= anoFim;
      }
      
      return marcaMatch && modeloMatch && yearMatch;
    });

    if (hasMatch) {
      matchingPartIds.add(partId);
    }
  });

  return matchingPartIds;
}
