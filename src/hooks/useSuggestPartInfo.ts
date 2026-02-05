import { useState, useCallback, useRef } from "react";
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

// Cache global para sugestões de OEM
const suggestionCache = new Map<string, PartSuggestion>();

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

    const cacheKey = `${codigoOEM.trim().toUpperCase()}|${vehicleInfo || ""}|${categoryName || ""}`;
    
    // Verificar cache
    const cached = suggestionCache.get(cacheKey);
    if (cached) {
      console.log("Using cached suggestion for OEM:", codigoOEM);
      setSuggestion(cached);
      return cached;
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

      // Salvar no cache
      suggestionCache.set(cacheKey, data);
      console.log("Cached suggestion for OEM:", codigoOEM);
      
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
