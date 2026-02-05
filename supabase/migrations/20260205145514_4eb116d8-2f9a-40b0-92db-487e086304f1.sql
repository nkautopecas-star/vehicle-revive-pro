-- 1) Deduplicate marketplace_listings to stop exponential growth during re-sync
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY marketplace_account_id, external_id
      ORDER BY
        (part_id IS NOT NULL) DESC,
        updated_at DESC,
        created_at DESC,
        id DESC
    ) AS rn
  FROM public.marketplace_listings
  WHERE external_id IS NOT NULL
)
DELETE FROM public.marketplace_listings ml
USING ranked r
WHERE ml.id = r.id
  AND r.rn > 1;

-- 2) Make the listing mapping idempotent (one row per account + external_id)
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_listings_account_external_uidx
  ON public.marketplace_listings (marketplace_account_id, external_id)
  WHERE external_id IS NOT NULL;

-- 3) Helpful index for sync lookups (also helps even if unique index can't be used for some queries)
CREATE INDEX IF NOT EXISTS marketplace_listings_account_external_idx
  ON public.marketplace_listings (marketplace_account_id, external_id);

-- 4) Persist resumable cursor state for long-running syncs
ALTER TABLE public.sync_jobs
  ADD COLUMN IF NOT EXISTS cursor jsonb,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS sync_jobs_account_status_created_at_idx
  ON public.sync_jobs (marketplace_account_id, status, created_at);