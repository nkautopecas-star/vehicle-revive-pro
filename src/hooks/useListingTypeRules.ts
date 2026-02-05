import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ListingTypeRule {
  id: string;
  marketplace: string;
  listing_type: string;
  listing_type_name: string;
  price_variation_percent: number;
  is_default: boolean;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useListingTypeRules(marketplace: string = 'mercadolivre') {
  return useQuery({
    queryKey: ['listing-type-rules', marketplace],
    queryFn: async (): Promise<ListingTypeRule[]> => {
      const { data, error } = await supabase
        .from('listing_type_rules')
        .select('*')
        .eq('marketplace', marketplace)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data as ListingTypeRule[];
    },
  });
}

export function useEnabledListingTypes(marketplace: string = 'mercadolivre') {
  return useQuery({
    queryKey: ['enabled-listing-types', marketplace],
    queryFn: async (): Promise<ListingTypeRule[]> => {
      const { data, error } = await supabase
        .from('listing_type_rules')
        .select('*')
        .eq('marketplace', marketplace)
        .eq('is_enabled', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data as ListingTypeRule[];
    },
  });
}

export function useUpdateListingTypeRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<ListingTypeRule, 'price_variation_percent' | 'is_enabled'>>;
    }) => {
      const { error } = await supabase
        .from('listing_type_rules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing-type-rules'] });
      queryClient.invalidateQueries({ queryKey: ['enabled-listing-types'] });
      toast.success('Regra atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating listing type rule:', error);
      toast.error('Erro ao atualizar regra');
    },
  });
}

// Calculate price for a specific listing type
export function calculateListingTypePrice(
  basePrice: number,
  variationPercent: number
): number {
  return basePrice * (1 + variationPercent / 100);
}
