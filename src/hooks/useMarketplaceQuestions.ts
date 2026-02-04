import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarketplaceQuestion {
  id: string;
  external_id: string | null;
  listing_id: string;
  question: string;
  answer: string | null;
  customer_name: string | null;
  status: "pending" | "answered";
  received_at: string;
  answered_at: string | null;
  listing?: {
    id: string;
    titulo: string;
    external_id: string | null;
    preco: number;
    status: string;
    part_id: string | null;
    marketplace_account?: {
      id: string;
      nome_conta: string;
      marketplace: "mercadolivre" | "shopee" | "olx";
    };
    part?: {
      id: string;
      nome: string;
      part_images?: {
        id: string;
        file_path: string;
        order_position: number | null;
      }[];
    };
  };
}

interface UseMarketplaceQuestionsOptions {
  status?: "pending" | "answered" | "all";
  search?: string;
  accountId?: string;
}

export function useMarketplaceQuestions(options: UseMarketplaceQuestionsOptions = {}) {
  const { status, search, accountId } = options;

  return useQuery({
    queryKey: ["marketplace-questions", status, search, accountId],
    queryFn: async (): Promise<MarketplaceQuestion[]> => {
      let query = supabase
        .from("marketplace_questions")
        .select(`
          *,
          listing:marketplace_listings!inner(
            id,
            titulo,
            external_id,
            preco,
            status,
            part_id,
            marketplace_account:marketplace_accounts(
              id,
              nome_conta,
              marketplace
            ),
            part:parts(
              id,
              nome,
              part_images(
                id,
                file_path,
                order_position
              )
            )
          )
        `)
        .eq("listing.status", "active")
        .order("received_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(`question.ilike.%${search}%,customer_name.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by account if needed (need to filter after join)
      let filteredData = data as MarketplaceQuestion[];
      if (accountId) {
        filteredData = filteredData.filter(
          (q) => q.listing?.marketplace_account?.id === accountId
        );
      }

      return filteredData;
    },
  });
}

export function useQuestionStats() {
  return useQuery({
    queryKey: ["marketplace-question-stats"],
    queryFn: async () => {
      const [pendingResult, answeredResult, totalResult] = await Promise.all([
        supabase
          .from("marketplace_questions")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("marketplace_questions")
          .select("*", { count: "exact", head: true })
          .eq("status", "answered"),
        supabase
          .from("marketplace_questions")
          .select("*", { count: "exact", head: true }),
      ]);

      return {
        pending: pendingResult.count || 0,
        answered: answeredResult.count || 0,
        total: totalResult.count || 0,
      };
    },
  });
}

export function useAnswerQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      answer,
      externalId,
    }: {
      questionId: string;
      answer: string;
      externalId?: string | null;
    }) => {
      // First update the local database
      const { error } = await supabase
        .from("marketplace_questions")
        .update({
          answer,
          status: "answered" as const,
          answered_at: new Date().toISOString(),
        })
        .eq("id", questionId);

      if (error) throw error;

      // If there's an external_id, we should also send the answer to the marketplace
      // This would be done via an edge function in a real implementation
      if (externalId) {
        // TODO: Call edge function to send answer to Mercado Livre
        console.log("Would send answer to ML for question:", externalId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-questions"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-question-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
      toast.success("Resposta enviada com sucesso!");
    },
    onError: (error) => {
      console.error("Error answering question:", error);
      toast.error("Erro ao enviar resposta. Tente novamente.");
    },
  });
}
