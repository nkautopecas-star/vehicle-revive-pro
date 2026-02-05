import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const REDIRECT_URI = `${window.location.origin}/integracoes`;

export function useOLX() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch OLX accounts
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['olx-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_accounts')
        .select('*')
        .eq('marketplace', 'olx')
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/olx-oauth?action=get_auth_url&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get OLX auth URL:', errorText);
        throw new Error('Failed to get auth URL');
      }

      const result = await response.json();
      
      if (result.auth_url) {
        // Open in a new tab to avoid iframe restrictions
        const opened = window.open(result.auth_url as string, "_blank", "noopener,noreferrer");

        if (!opened) {
          toast({
            title: "Pop-up bloqueado",
            description: "Permita pop-ups para abrir a página de autorização da OLX.",
            variant: "destructive",
          });

          // Fallback to same-tab navigation
          window.location.href = result.auth_url as string;
        }

        setIsConnecting(false);
      } else {
        throw new Error('No auth URL returned');
      }
    } catch (error) {
      console.error('OLX OAuth error:', error);
      toast({
        title: "Erro ao conectar",
        description: "Não foi possível iniciar a conexão com a OLX",
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

      const { data, error } = await supabase.functions.invoke('olx-oauth', {
        body: {
          action: 'exchange_code',
          code,
          redirect_uri: REDIRECT_URI,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Conta OLX conectada!",
          description: `Conta ${data.nome_conta} foi conectada com sucesso`,
        });
        queryClient.invalidateQueries({ queryKey: ['olx-accounts'] });
        return data;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('OLX Exchange code error:', error);
      toast({
        title: "Erro ao conectar",
        description: "Não foi possível finalizar a conexão com a OLX",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    accounts,
    isLoadingAccounts,
    isConnecting,
    startOAuth,
    exchangeCode,
  };
}
