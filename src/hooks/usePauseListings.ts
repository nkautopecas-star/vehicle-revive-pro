import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PauseListingsInput {
  partId: string;
}

/**
 * Hook to pause all active marketplace listings when stock reaches zero.
 * This ensures all listings (regardless of listing type) are paused together.
 */
export function usePauseListings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partId }: PauseListingsInput) => {
      // Find all active listings for this part
      const { data: activeListings, error: fetchError } = await supabase
        .from("marketplace_listings")
        .select(`
          id,
          external_id,
          titulo,
          marketplace_account:marketplace_accounts(id)
        `)
        .eq("part_id", partId)
        .eq("status", "active");

      if (fetchError) throw fetchError;

      if (!activeListings || activeListings.length === 0) {
        return { paused: 0 };
      }

      // Pause each listing via the ML API
      const pausePromises = activeListings.map(async (listing) => {
        try {
          const { data, error } = await supabase.functions.invoke("ml-sync", {
            body: {
              action: "update_listing",
              account_id: listing.marketplace_account?.id,
              listing_id: listing.id,
              status: "paused",
            },
          });

          if (error) {
            console.error(`Failed to pause listing ${listing.id}:`, error);
            return { success: false, listingId: listing.id, title: listing.titulo };
          }

          return { success: true, listingId: listing.id, title: listing.titulo };
        } catch (err) {
          console.error(`Error pausing listing ${listing.id}:`, err);
          return { success: false, listingId: listing.id, title: listing.titulo };
        }
      });

      const results = await Promise.all(pausePromises);
      const successCount = results.filter((r) => r.success).length;

      return { paused: successCount, total: activeListings.length };
    },
    onSuccess: (result, variables) => {
      if (result.paused > 0) {
        toast.warning(
          `Estoque zerado: ${result.paused} anúncio(s) pausado(s) automaticamente!`,
          { duration: 5000 }
        );
        queryClient.invalidateQueries({ queryKey: ["part-ml-listings", variables.partId] });
        queryClient.invalidateQueries({ queryKey: ["parts-ml-status"] });
        queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      }
    },
    onError: (error) => {
      console.error("Error pausing listings:", error);
    },
  });
}
