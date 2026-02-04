import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const REDIRECT_URI = `${window.location.origin}/integracoes`;

export function useMercadoLivre() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch ML accounts
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['ml-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_accounts')
        .select('*')
        .eq('marketplace', 'mercadolivre')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Start OAuth flow
  const startOAuth = async () => {
    setIsConnecting(true);
    try {
      // Get auth URL from edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ml-oauth?action=get_auth_url&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get auth URL:', errorText);
        throw new Error('Failed to get auth URL');
      }

      const result = await response.json();
      
      if (result.auth_url) {
        // In preview/iframe, redirects to external domains may fail.
        // Prefer opening in a new tab (user-initiated click) with a safe fallback.
        const opened = window.open(result.auth_url as string, "_blank", "noopener,noreferrer");

        if (!opened) {
          toast({
            title: "Pop-up bloqueado",
            description: "Permita pop-ups para abrir a página de autorização do Mercado Livre.",
            variant: "destructive",
          });

          // Fallback to same-tab navigation
          window.location.href = result.auth_url as string;
        }

        // Keep UI responsive even if user stays on the app tab.
        setIsConnecting(false);
      } else {
        throw new Error('No auth URL returned');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      toast({
        title: "Erro ao conectar",
        description: "Não foi possível iniciar a conexão com o Mercado Livre",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  // Exchange code for tokens (called after OAuth redirect)
  const exchangeCode = async (code: string) => {
    setIsConnecting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('ml-oauth', {
        body: {
          action: 'exchange_code',
          code,
          redirect_uri: REDIRECT_URI,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Conta conectada!",
          description: `Conta ${data.nickname} foi conectada com sucesso`,
        });
        queryClient.invalidateQueries({ queryKey: ['ml-accounts'] });
        return data;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Exchange code error:', error);
      toast({
        title: "Erro ao conectar",
        description: "Não foi possível finalizar a conexão com o Mercado Livre",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Sync all listings
  const syncMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke('ml-sync', {
        body: {
          action: 'sync_all',
          account_id: accountId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Sincronização concluída",
        description: `${data.synced} de ${data.total} anúncios sincronizados`,
      });
      queryClient.invalidateQueries({ queryKey: ['ml-accounts'] });
    },
    onError: (error) => {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os anúncios",
        variant: "destructive",
      });
    },
  });

  // Create listing from part
  const createListingMutation = useMutation({
    mutationFn: async ({ accountId, partId, listingData }: { 
      accountId: string; 
      partId: string; 
      listingData?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.functions.invoke('ml-sync', {
        body: {
          action: 'create_listing',
          account_id: accountId,
          part_id: partId,
          listing_data: listingData,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Anúncio criado!",
        description: "O anúncio foi publicado no Mercado Livre",
      });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar anúncio",
        description: "Não foi possível publicar no Mercado Livre",
        variant: "destructive",
      });
    },
  });

  // Fetch questions
  const fetchQuestionsMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke('ml-questions', {
        body: {
          action: 'fetch_questions',
          account_id: accountId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.fetched > 0) {
        toast({
          title: "Perguntas atualizadas",
          description: `${data.fetched} novas perguntas encontradas`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['marketplace-questions'] });
    },
  });

  // Answer question
  const answerQuestionMutation = useMutation({
    mutationFn: async ({ accountId, questionId, answer }: {
      accountId: string;
      questionId: string;
      answer: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('ml-questions', {
        body: {
          action: 'answer_question',
          account_id: accountId,
          question_id: questionId,
          answer,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Resposta enviada!",
        description: "Sua resposta foi publicada no Mercado Livre",
      });
      queryClient.invalidateQueries({ queryKey: ['marketplace-questions'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao responder",
        description: "Não foi possível enviar a resposta",
        variant: "destructive",
      });
    },
  });

  return {
    accounts,
    isLoadingAccounts,
    isConnecting,
    startOAuth,
    exchangeCode,
    syncAll: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    createListing: createListingMutation.mutate,
    isCreatingListing: createListingMutation.isPending,
    fetchQuestions: fetchQuestionsMutation.mutate,
    isFetchingQuestions: fetchQuestionsMutation.isPending,
    answerQuestion: answerQuestionMutation.mutate,
    isAnswering: answerQuestionMutation.isPending,
  };
}
