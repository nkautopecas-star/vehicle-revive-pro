-- Add image_url column to cache Mercado Livre product images
ALTER TABLE public.marketplace_listings 
ADD COLUMN image_url TEXT;

-- Add comment explaining the column purpose
COMMENT ON COLUMN public.marketplace_listings.image_url IS 'Cached image URL from the marketplace (e.g., Mercado Livre thumbnail)';