import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReactivateListingsInput {
  partId: string;
}

/**
 * Hook to reactivate paused marketplace listings when stock is added back.
 * This is called when a part with zero stock receives new inventory.
 */
export function useReactivateListings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partId }: ReactivateListingsInput) => {
      // Find paused listings for this part
      const { data: pausedListings, error: fetchError } = await supabase
        .from("marketplace_listings")
        .select(`
          id,
          external_id,
          marketplace_account:marketplace_accounts(id, access_token)
        `)
        .eq("part_id", partId)
        .eq("status", "paused");

      if (fetchError) throw fetchError;

      if (!pausedListings || pausedListings.length === 0) {
        return { reactivated: 0 };
      }

      // Reactivate each listing via the ML API
      const reactivationPromises = pausedListings.map(async (listing) => {
        try {
          const { data, error } = await supabase.functions.invoke("ml-sync", {
            body: {
              action: "update_listing",
              account_id: listing.marketplace_account?.id,
              listing_id: listing.id,
              status: "active",
            },
          });

          if (error) {
            console.error(`Failed to reactivate listing ${listing.id}:`, error);
            return { success: false, listingId: listing.id };
          }

          return { success: true, listingId: listing.id };
        } catch (err) {
          console.error(`Error reactivating listing ${listing.id}:`, err);
          return { success: false, listingId: listing.id };
        }
      });

      const results = await Promise.all(reactivationPromises);
      const successCount = results.filter((r) => r.success).length;

      return { reactivated: successCount, total: pausedListings.length };
    },
    onSuccess: (result, variables) => {
      if (result.reactivated > 0) {
        toast.success(
          `${result.reactivated} anúncio(s) reativado(s) automaticamente!`
        );
        queryClient.invalidateQueries({ queryKey: ["part-ml-listings", variables.partId] });
        queryClient.invalidateQueries({ queryKey: ["parts-ml-status"] });
        queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      }
    },
    onError: (error) => {
      console.error("Error reactivating listings:", error);
    },
  });
}
