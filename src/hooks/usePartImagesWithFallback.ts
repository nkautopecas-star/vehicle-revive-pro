import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PartImageData {
  url: string;
  source: 'part' | 'listing';
}

// Cache for ML pictures - stored in memory and localStorage
const ML_PICTURES_CACHE_KEY = 'ml-pictures-cache';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  pictures: PartImageData[];
  timestamp: number;
}

// In-memory cache
const mlPicturesCache = new Map<string, CacheEntry>();

// Initialize cache from localStorage
function initCacheFromStorage(): void {
  try {
    const stored = localStorage.getItem(ML_PICTURES_CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, CacheEntry>;
      const now = Date.now();
      Object.entries(parsed).forEach(([key, entry]) => {
        // Only load entries that haven't expired
        if (now - entry.timestamp < CACHE_EXPIRY_MS) {
          mlPicturesCache.set(key, entry);
        }
      });
    }
  } catch (e) {
    console.warn('Failed to load ML pictures cache from localStorage:', e);
  }
}

// Save cache to localStorage
function saveCacheToStorage(): void {
  try {
    const cacheObj: Record<string, CacheEntry> = {};
    const now = Date.now();
    mlPicturesCache.forEach((entry, key) => {
      // Only save entries that haven't expired
      if (now - entry.timestamp < CACHE_EXPIRY_MS) {
        cacheObj[key] = entry;
      }
    });
    localStorage.setItem(ML_PICTURES_CACHE_KEY, JSON.stringify(cacheObj));
  } catch (e) {
    console.warn('Failed to save ML pictures cache to localStorage:', e);
  }
}

// Initialize cache on module load
initCacheFromStorage();

function getCachedPictures(externalId: string): PartImageData[] | null {
  const entry = mlPicturesCache.get(externalId);
  if (!entry) return null;
  
  // Check if cache has expired
  if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
    mlPicturesCache.delete(externalId);
    saveCacheToStorage();
    return null;
  }
  
  return entry.pictures;
}

function setCachedPictures(externalId: string, pictures: PartImageData[]): void {
  mlPicturesCache.set(externalId, {
    pictures,
    timestamp: Date.now(),
  });
  saveCacheToStorage();
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

      // Fallback: get all images from linked marketplace listing via API
      const { data: listing, error: listingError } = await supabase
        .from('marketplace_listings')
        .select('id, image_url, external_id')
        .eq('part_id', partId)
        .not('external_id', 'is', null)
        .limit(1)
        .maybeSingle();

      if (listingError || !listing) {
        return [];
      }

      // If we have an external_id, check cache first then try to fetch from ML API
      if (listing.external_id) {
        // Check cache first
        const cached = getCachedPictures(listing.external_id);
        if (cached) {
          console.log(`Using cached ML pictures for ${listing.external_id}`);
          return cached;
        }

        try {
          const { data, error } = await supabase.functions.invoke('ml-item-pictures', {
            body: { listingId: listing.id },
          });

          if (!error && data?.pictures && data.pictures.length > 0) {
            const pictures = data.pictures.map((pic: { url: string }) => ({
              url: pic.url,
              source: 'listing' as const,
            }));
            
            // Cache the result
            setCachedPictures(listing.external_id, pictures);
            console.log(`Cached ML pictures for ${listing.external_id}`);
            
            return pictures;
          }
        } catch (e) {
          console.error('Failed to fetch ML pictures:', e);
        }
      }

      // Final fallback: use the cached image_url from the listing
      if (listing.image_url) {
        return [{
          url: listing.image_url,
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
