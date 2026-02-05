import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useFetchQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get all active marketplace accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("marketplace_accounts")
        .select("id, nome_conta")
        .eq("status", "active");

      if (accountsError) throw accountsError;

      if (!accounts || accounts.length === 0) {
        throw new Error("Nenhuma conta de marketplace conectada");
      }

      let totalFetched = 0;
      let totalSaved = 0;

      // Fetch questions for each account
      for (const account of accounts) {
        const { data, error } = await supabase.functions.invoke("ml-questions", {
          body: {
            action: "fetch_questions",
            account_id: account.id,
          },
        });

        if (error) {
          console.error(`Error fetching questions for ${account.nome_conta}:`, error);
          continue;
        }

        if (data?.fetched) totalFetched += data.fetched;
        if (data?.saved) totalSaved += data.saved;
      }

      return { fetched: totalFetched, saved: totalSaved };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-questions"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-question-stats"] });
      
      if (data.saved > 0) {
        toast.success(`${data.saved} nova(s) pergunta(s) importada(s)!`);
      } else {
        toast.info("Nenhuma nova pergunta encontrada");
      }
    },
    onError: (error) => {
      console.error("Error fetching questions:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao buscar perguntas");
    },
  });
}
