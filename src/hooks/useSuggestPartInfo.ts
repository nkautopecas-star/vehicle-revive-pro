import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CompatibilitySuggestion {
  marca: string;
  modelo: string;
  ano_inicio?: number;
  ano_fim?: number;
  observacoes?: string;
}

export interface PartSuggestion {
  nome: string;
  tituloML: string;
  precoMinimo?: number;
  precoMaximo?: number;
  precoSugerido: number;
  confianca: "alta" | "media" | "baixa";
  descricao?: string;
  compatibilidades?: CompatibilitySuggestion[];
}

const CACHE_KEY = "oem-suggestions-cache";
const CACHE_EXPIRY_DAYS = 7;

// Load cache from localStorage
function loadCache(): Map<string, { suggestion: PartSuggestion; timestamp: number }> {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const now = Date.now();
      const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      
      // Filter out expired entries
      const validEntries = Object.entries(parsed).filter(
        ([_, value]: [string, any]) => now - value.timestamp < expiryMs
      );
      
      return new Map(validEntries as [string, { suggestion: PartSuggestion; timestamp: number }][]);
    }
  } catch (e) {
    console.warn("Failed to load OEM suggestion cache:", e);
  }
  return new Map();
}

// Save cache to localStorage
function saveCache(cache: Map<string, { suggestion: PartSuggestion; timestamp: number }>) {
  try {
    const obj = Object.fromEntries(cache);
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn("Failed to save OEM suggestion cache:", e);
  }
}

// Global cache with localStorage persistence
const suggestionCache = loadCache();

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
      setSuggestion(cached.suggestion);
      return cached.suggestion;
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

      // Salvar no cache com timestamp
      suggestionCache.set(cacheKey, { suggestion: data, timestamp: Date.now() });
      saveCache(suggestionCache);
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
