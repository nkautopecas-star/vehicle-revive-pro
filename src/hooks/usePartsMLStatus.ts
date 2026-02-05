import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PartMLStatus {
  partId: string;
  status: "active" | "paused" | "sold";
  listingCount: number;
}

export function usePartsMLStatus(partIds: string[]) {
  return useQuery({
    queryKey: ["parts-ml-status", partIds],
    queryFn: async (): Promise<Map<string, PartMLStatus>> => {
      if (partIds.length === 0) return new Map();

      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("part_id, status")
        .in("part_id", partIds)
        .neq("status", "deleted");

      if (error) throw error;

      // Group by part_id and count listings, determine best status
      const statusMap = new Map<string, PartMLStatus>();

      for (const listing of data || []) {
        if (!listing.part_id) continue;

        const existing = statusMap.get(listing.part_id);
        if (existing) {
          existing.listingCount++;
          // Priority: active > paused > sold
          if (listing.status === "active") {
            existing.status = "active";
          } else if (listing.status === "paused" && existing.status !== "active") {
            existing.status = "paused";
          }
        } else {
          statusMap.set(listing.part_id, {
            partId: listing.part_id,
            status: listing.status as "active" | "paused" | "sold",
            listingCount: 1,
          });
        }
      }

      return statusMap;
    },
    enabled: partIds.length > 0,
  });
}
