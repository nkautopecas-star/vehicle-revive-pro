-- Allow marketplace_listings to be imported without an immediate part link
ALTER TABLE public.marketplace_listings 
ALTER COLUMN part_id DROP NOT NULL;