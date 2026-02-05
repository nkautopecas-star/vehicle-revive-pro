import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { MarketplaceListing } from "./useMarketplaceListings";

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  createdPartIds: string[];
}

export function useImportListingsAsParts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (listings: MarketplaceListing[]): Promise<ImportResult> => {
      if (!user) throw new Error("Usuário não autenticado");

      const result: ImportResult = {
        success: 0,
        failed: 0,
        skipped: 0,
        createdPartIds: [],
      };

      // Filter out listings that are already linked to parts
      const unlinkedListings = listings.filter((l) => !l.part_id);
      result.skipped = listings.length - unlinkedListings.length;

      for (const listing of unlinkedListings) {
        try {
          // Create the part
          const { data: newPart, error: insertError } = await supabase
            .from("parts")
            .insert({
              nome: listing.titulo,
              preco_venda: listing.preco,
              condicao: "usada" as const,
              quantidade: 1,
              quantidade_minima: 0,
              status: listing.status === "sold" ? "vendida" : "ativa",
              user_id: user.id,
            })
            .select("id")
            .single();

          if (insertError) {
            console.error("Error creating part:", insertError);
            result.failed++;
            continue;
          }

          // Link the listing to the new part
          const { error: linkError } = await supabase
            .from("marketplace_listings")
            .update({ part_id: newPart.id })
            .eq("id", listing.id);

          if (linkError) {
            console.error("Error linking listing to part:", linkError);
            // Part was created but linking failed
            result.success++;
            result.createdPartIds.push(newPart.id);
            continue;
          }

          result.success++;
          result.createdPartIds.push(newPart.id);
        } catch (error) {
          console.error("Error importing listing:", error);
          result.failed++;
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-listing-stats"] });

      const messages: string[] = [];
      if (result.success > 0) {
        messages.push(`${result.success} peça(s) criada(s)`);
      }
      if (result.skipped > 0) {
        messages.push(`${result.skipped} já vinculada(s)`);
      }
      if (result.failed > 0) {
        messages.push(`${result.failed} falha(s)`);
      }

      if (result.success > 0) {
        toast.success(`Importação concluída: ${messages.join(", ")}`);
      } else if (result.skipped > 0 && result.failed === 0) {
        toast.info("Todos os anúncios selecionados já estão vinculados a peças");
      } else {
        toast.error("Erro ao importar anúncios");
      }
    },
    onError: (error) => {
      console.error("Error importing listings:", error);
      toast.error("Erro ao importar anúncios");
    },
  });
}

export function useUnlinkedListings() {
  return useQueryClient().getQueryData<{ data: MarketplaceListing[] }>([
    "marketplace-listings",
  ]);
}
