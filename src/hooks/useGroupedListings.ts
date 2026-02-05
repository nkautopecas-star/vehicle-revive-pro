import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MarketplaceListing } from "./useMarketplaceListings";

export interface GroupedListing {
  groupKey: string; // part_id or listing.id for orphans
  part: {
    id: string;
    nome: string;
    codigo_interno: string | null;
  } | null;
  listings: MarketplaceListing[];
  minPrice: number;
  maxPrice: number;
  hasMultiple: boolean;
}

interface UseGroupedListingsOptions {
  accountId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'updated_at' | 'preco' | 'titulo';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedGroupedResult {
  data: GroupedListing[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useGroupedListings(options: UseGroupedListingsOptions = {}) {
  const { 
    accountId, 
    status, 
    search, 
    page = 1, 
    pageSize = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  return useQuery({
    queryKey: ["grouped-listings", accountId, status, search, page, pageSize, sortBy, sortOrder],
    queryFn: async (): Promise<PaginatedGroupedResult> => {
      // Build query
      let query = supabase
        .from("marketplace_listings")
        .select(`
          *,
          marketplace_account:marketplace_accounts(id, nome_conta, marketplace),
          part:parts(id, nome, codigo_interno)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (accountId) {
        query = query.eq("marketplace_account_id", accountId);
      }

      if (status && status !== "all") {
        query = query.eq("status", status as "active" | "paused" | "sold" | "deleted");
      }

      if (search) {
        query = query.ilike("titulo", `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const listings = data as MarketplaceListing[];

      // Group listings by part_id
      const groupsMap = new Map<string, GroupedListing>();

      for (const listing of listings) {
        const groupKey = listing.part_id || `orphan-${listing.id}`;
        
        const existing = groupsMap.get(groupKey);
        if (existing) {
          existing.listings.push(listing);
          existing.minPrice = Math.min(existing.minPrice, listing.preco);
          existing.maxPrice = Math.max(existing.maxPrice, listing.preco);
          existing.hasMultiple = true;
        } else {
          groupsMap.set(groupKey, {
            groupKey,
            part: listing.part || null,
            listings: [listing],
            minPrice: listing.preco,
            maxPrice: listing.preco,
            hasMultiple: false,
          });
        }
      }

      // Convert to array and sort
      let groups = Array.from(groupsMap.values());

      // Sort groups by the first listing's sort field
      groups.sort((a, b) => {
        const aListing = a.listings[0];
        const bListing = b.listings[0];
        
        if (sortBy === 'preco') {
          const aVal = a.minPrice;
          const bVal = b.minPrice;
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        if (sortBy === 'titulo') {
          const aVal = aListing.titulo.toLowerCase();
          const bVal = bListing.titulo.toLowerCase();
          return sortOrder === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        // Default: date sorting
        const aDate = new Date(aListing[sortBy] || aListing.created_at).getTime();
        const bDate = new Date(bListing[sortBy] || bListing.created_at).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      });

      const totalCount = groups.length;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Paginate
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      groups = groups.slice(from, to);

      return {
        data: groups,
        totalCount,
        page,
        pageSize,
        totalPages,
      };
    },
  });
}
