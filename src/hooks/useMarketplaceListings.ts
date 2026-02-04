import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export function useMarketplaceListings(options: UseMarketplaceListingsOptions = {}) {
  const { accountId, status, search } = options;

  return useQuery({
    queryKey: ["marketplace-listings", accountId, status, search],
    queryFn: async () => {
      let query = supabase
        .from("marketplace_listings")
        .select(`
          *,
          marketplace_account:marketplace_accounts(id, nome_conta, marketplace),
          part:parts(id, nome, codigo_interno)
        `)
        .order("created_at", { ascending: false });

      if (accountId) {
        query = query.eq("marketplace_account_id", accountId);
      }

      if (status && status !== "all") {
        query = query.eq("status", status as "active" | "paused" | "sold" | "deleted");
      }

      if (search) {
        query = query.ilike("titulo", `%${search}%`);
      }

      // Limit to avoid performance issues
      query = query.limit(500);

      const { data, error } = await query;

      if (error) throw error;
      return data as MarketplaceListing[];
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
