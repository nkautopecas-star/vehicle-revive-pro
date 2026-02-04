-- Create sync_jobs table to track synchronization progress
CREATE TABLE public.sync_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marketplace_account_id UUID NOT NULL REFERENCES public.marketplace_accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'error')),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  imported_items INTEGER DEFAULT 0,
  updated_items INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view sync jobs"
ON public.sync_jobs
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage sync jobs"
ON public.sync_jobs
FOR ALL
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_sync_jobs_account_id ON public.sync_jobs(marketplace_account_id);
CREATE INDEX idx_sync_jobs_status ON public.sync_jobs(status);