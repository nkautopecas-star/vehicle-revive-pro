import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PartImageData {
  url: string;
  source: 'part' | 'listing';
}

export function usePartImagesWithFallback(partId: string) {
  return useQuery({
    queryKey: ['part-images-with-fallback', partId],
    queryFn: async (): Promise<PartImageData[]> => {
      // First try to get images from part_images table
      const { data: partImages, error: partError } = await supabase
        .from('part_images')
        .select('file_path')
        .eq('part_id', partId)
        .order('order_position', { ascending: true });

      if (!partError && partImages && partImages.length > 0) {
        return partImages.map(img => ({
          url: supabase.storage.from('part-images').getPublicUrl(img.file_path).data.publicUrl,
          source: 'part' as const,
        }));
      }

      // Fallback: get image from linked marketplace listing
      const { data: listings, error: listingError } = await supabase
        .from('marketplace_listings')
        .select('image_url, external_id')
        .eq('part_id', partId)
        .not('image_url', 'is', null)
        .limit(1);

      if (!listingError && listings && listings.length > 0 && listings[0].image_url) {
        return [{
          url: listings[0].image_url,
          source: 'listing' as const,
        }];
      }

      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePartFirstImageWithFallback(partId: string) {
  return useQuery({
    queryKey: ['part-first-image-fallback', partId],
    queryFn: async (): Promise<{ url: string; source: 'part' | 'listing' } | null> => {
      // First try to get image from part_images table
      const { data: partImage, error: partError } = await supabase
        .from('part_images')
        .select('file_path')
        .eq('part_id', partId)
        .order('order_position', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!partError && partImage) {
        return {
          url: supabase.storage.from('part-images').getPublicUrl(partImage.file_path).data.publicUrl,
          source: 'part',
        };
      }

      // Fallback: get image from linked marketplace listing
      const { data: listing, error: listingError } = await supabase
        .from('marketplace_listings')
        .select('image_url')
        .eq('part_id', partId)
        .not('image_url', 'is', null)
        .limit(1)
        .maybeSingle();

      if (!listingError && listing?.image_url) {
        return {
          url: listing.image_url,
          source: 'listing',
        };
      }

      return null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
