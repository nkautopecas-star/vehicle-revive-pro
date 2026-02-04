import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
