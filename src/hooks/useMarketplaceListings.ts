import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketplaceListing {
  id: string;
  external_id: string | null;
  titulo: string;
  preco: number;
  status: "active" | "paused" | "sold" | "deleted";
  last_sync: string | null;
  created_at: string;
  updated_at: string;
  part_id: string | null;
  marketplace_account_id: string;
  marketplace_account?: {
    id: string;
    nome_conta: string;
    marketplace: string;
  };
  part?: {
    id: string;
    nome: string;
    codigo_interno: string | null;
  } | null;
}

interface UseMarketplaceListingsOptions {
  accountId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedListingsResult {
  data: MarketplaceListing[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useMarketplaceListings(options: UseMarketplaceListingsOptions = {}) {
  const { accountId, status, search, page = 1, pageSize = 20 } = options;

  return useQuery({
    queryKey: ["marketplace-listings", accountId, status, search, page, pageSize],
    queryFn: async (): Promise<PaginatedListingsResult> => {
      // First, get the total count
      let countQuery = supabase
        .from("marketplace_listings")
        .select("*", { count: "exact", head: true });

      if (accountId) {
        countQuery = countQuery.eq("marketplace_account_id", accountId);
      }

      if (status && status !== "all") {
        countQuery = countQuery.eq("status", status as "active" | "paused" | "sold" | "deleted");
      }

      if (search) {
        countQuery = countQuery.ilike("titulo", `%${search}%`);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Then get the paginated data
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("marketplace_listings")
        .select(`
          *,
          marketplace_account:marketplace_accounts(id, nome_conta, marketplace),
          part:parts(id, nome, codigo_interno)
        `)
        .order("created_at", { ascending: false })
        .range(from, to);

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

      return {
        data: data as MarketplaceListing[],
        totalCount,
        page,
        pageSize,
        totalPages,
      };
    },
  });
}

export function useMarketplaceAccounts() {
  return useQuery({
    queryKey: ["marketplace-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_accounts")
        .select("id, nome_conta, marketplace, status")
        .order("nome_conta");

      if (error) throw error;
      return data;
    },
  });
}

export function useLinkListingToPart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      partId,
    }: {
      listingId: string;
      partId: string | null;
    }) => {
      const { error } = await supabase
        .from("marketplace_listings")
        .update({ part_id: partId })
        .eq("id", listingId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      if (variables.partId) {
        toast.success("Anúncio vinculado à peça com sucesso!");
      } else {
        toast.success("Vínculo removido com sucesso!");
      }
    },
    onError: (error) => {
      console.error("Error linking listing to part:", error);
      toast.error("Erro ao vincular anúncio. Verifique suas permissões.");
    },
  });
}
