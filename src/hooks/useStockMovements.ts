import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface CreateStockMovementInput {
  part_id: string;
  quantidade: number;
  tipo: MovementType;
  motivo: string | null;
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

export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStockMovementInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Insert movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          part_id: input.part_id,
          quantidade: input.quantidade,
          tipo: input.tipo,
          motivo: input.motivo,
          user_id: user.id,
        });

      if (movementError) throw movementError;

      // Update part quantity
      const { data: part, error: partError } = await supabase
        .from('parts')
        .select('quantidade')
        .eq('id', input.part_id)
        .single();

      if (partError) throw partError;

      let newQuantity = part.quantidade;
      if (input.tipo === 'entrada') {
        newQuantity += input.quantidade;
      } else if (input.tipo === 'saida') {
        newQuantity -= input.quantidade;
      } else {
        newQuantity = input.quantidade; // ajuste
      }

      const { error: updateError } = await supabase
        .from('parts')
        .update({ quantidade: Math.max(0, newQuantity) })
        .eq('id', input.part_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
    },
  });
}
