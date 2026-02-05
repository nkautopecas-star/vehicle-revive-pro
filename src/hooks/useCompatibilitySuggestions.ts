 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
 interface CompatibilitySuggestion {
   marca: string;
   modelo: string;
 }
 
 export function useCompatibilitySuggestions() {
   return useQuery({
     queryKey: ["compatibility-suggestions"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("part_compatibilities")
         .select("marca, modelo")
         .order("marca")
         .order("modelo");
 
       if (error) throw error;
 
       // Get unique marca values
       const marcasSet = new Set<string>();
       // Get unique marca+modelo combinations
       const modelosByMarca = new Map<string, Set<string>>();
 
       (data || []).forEach((item: CompatibilitySuggestion) => {
         marcasSet.add(item.marca);
         if (!modelosByMarca.has(item.marca)) {
           modelosByMarca.set(item.marca, new Set());
         }
         modelosByMarca.get(item.marca)!.add(item.modelo);
       });
 
       const marcas = Array.from(marcasSet).sort();
       const modelos: Record<string, string[]> = {};
       modelosByMarca.forEach((models, marca) => {
         modelos[marca] = Array.from(models).sort();
       });
 
       // All unique models for when no marca is selected
       const allModelos = Array.from(
         new Set((data || []).map((item: CompatibilitySuggestion) => item.modelo))
       ).sort();
 
       return { marcas, modelos, allModelos };
     },
     staleTime: 5 * 60 * 1000, // Cache for 5 minutes
   });
 }