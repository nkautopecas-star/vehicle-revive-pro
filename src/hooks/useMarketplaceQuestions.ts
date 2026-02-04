import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
    image_url: string | null;
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
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('marketplace-questions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_questions',
        },
        (payload) => {
          console.log('Realtime question update:', payload.eventType);
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ["marketplace-questions"] });
          queryClient.invalidateQueries({ queryKey: ["marketplace-question-stats"] });
          
          // Show toast for new questions
          if (payload.eventType === 'INSERT') {
            toast.info("Nova pergunta recebida!", {
              description: "Uma nova pergunta foi adicionada.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
            image_url,
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
      // Get the question with listing and account info to send to ML
      const { data: question, error: questionError } = await supabase
        .from("marketplace_questions")
        .select(`
          id,
          external_id,
          listing:marketplace_listings(
            marketplace_account_id
          )
        `)
        .eq("id", questionId)
        .single();

      if (questionError || !question) {
        throw new Error("Pergunta não encontrada");
      }

      const accountId = question.listing?.marketplace_account_id;

      // If we have an external_id and account, send to Mercado Livre first
      if (question.external_id && accountId) {
        const { data, error: mlError } = await supabase.functions.invoke("ml-questions", {
          body: {
            action: "answer_question",
            account_id: accountId,
            question_id: questionId,
            answer,
          },
        });

        if (mlError) {
          console.error("ML API Error:", mlError);
          throw new Error("Erro ao enviar resposta para o Mercado Livre");
        }

        if (data?.error) {
          console.error("ML API Error:", data.error, data.details);
          throw new Error(data.details || data.error || "Erro ao enviar resposta para o Mercado Livre");
        }

        // The edge function already updates the database, so we're done
        return;
      }

      // Fallback: If no external_id, just update the local database
      const { error } = await supabase
        .from("marketplace_questions")
        .update({
          answer,
          status: "answered" as const,
          answered_at: new Date().toISOString(),
        })
        .eq("id", questionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-questions"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-question-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
      toast.success("Resposta enviada com sucesso para o Mercado Livre!");
    },
    onError: (error) => {
      console.error("Error answering question:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar resposta. Tente novamente.");
    },
  });
}
