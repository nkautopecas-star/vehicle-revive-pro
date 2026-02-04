import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type MovementType = Database["public"]["Enums"]["movement_type"];

export interface StockMovement {
  id: string;
  part_id: string;
  quantidade: number;
  tipo: MovementType;
  motivo: string | null;
  user_id: string;
  created_at: string;
}

export function usePartStockMovements(partId: string | undefined) {
  return useQuery({
    queryKey: ['stock-movements', partId],
    queryFn: async (): Promise<StockMovement[]> => {
      if (!partId) return [];
      
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('part_id', partId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!partId,
  });
}
