import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PartSuggestion {
  nome: string;
  tituloML: string;
  precoMinimo?: number;
  precoMaximo?: number;
  precoSugerido: number;
  confianca: "alta" | "media" | "baixa";
  descricao?: string;
}

export function useSuggestPartInfo() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<PartSuggestion | null>(null);
  const { toast } = useToast();

  const suggestFromOEM = useCallback(async (
    codigoOEM: string, 
    vehicleInfo?: string, 
    categoryName?: string
  ): Promise<PartSuggestion | null> => {
    if (!codigoOEM || codigoOEM.trim().length < 3) {
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-part-info", {
        body: { codigoOEM, vehicleInfo, categoryName },
      });

      if (error) {
        console.error("Error suggesting part info:", error);
        toast({
          title: "Erro ao sugerir informações",
          description: error.message || "Não foi possível obter sugestões",
          variant: "destructive",
        });
        return null;
      }

      if (data.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return null;
      }

      setSuggestion(data);
      return data;
    } catch (err) {
      console.error("Error in useSuggestPartInfo:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
  }, []);

  return {
    isLoading,
    suggestion,
    suggestFromOEM,
    clearSuggestion,
  };
}
