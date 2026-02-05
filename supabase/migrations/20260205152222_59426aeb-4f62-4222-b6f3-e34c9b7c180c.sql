-- Add unique constraint on external_id for marketplace_listings to allow upsert
ALTER TABLE public.marketplace_listings 
ADD CONSTRAINT marketplace_listings_external_id_account_unique 
UNIQUE (external_id, marketplace_account_id);