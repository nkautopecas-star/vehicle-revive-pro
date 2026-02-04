import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePartFirstImage(partId: string) {
  return useQuery({
    queryKey: ['part-first-image', partId],
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from('part_images')
        .select('file_path')
        .eq('part_id', partId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return supabase.storage.from('part-images').getPublicUrl(data.file_path).data.publicUrl;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
