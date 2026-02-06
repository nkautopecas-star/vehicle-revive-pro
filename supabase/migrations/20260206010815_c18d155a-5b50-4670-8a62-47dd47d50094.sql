-- Add listing_type column to store the ML listing type (classico, premium, etc.)
ALTER TABLE public.marketplace_listings 
ADD COLUMN listing_type text;

-- Add index for grouping queries
CREATE INDEX idx_marketplace_listings_part_id ON public.marketplace_listings(part_id);
CREATE INDEX idx_marketplace_listings_listing_type ON public.marketplace_listings(listing_type);