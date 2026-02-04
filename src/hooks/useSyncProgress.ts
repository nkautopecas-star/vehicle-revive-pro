import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SyncJob {
  id: string;
  marketplace_account_id: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  total_items: number;
  processed_items: number;
  imported_items: number;
  updated_items: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export function useSyncProgress(accountId: string | null) {
  const [syncJob, setSyncJob] = useState<SyncJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchLatestJob = useCallback(async () => {
    if (!accountId) return null;

    const { data, error } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('marketplace_account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching sync job:', error);
      return null;
    }

    return data as SyncJob | null;
  }, [accountId]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Poll for updates when syncing
  useEffect(() => {
    if (!isPolling || !accountId) return;

    const pollInterval = setInterval(async () => {
      const job = await fetchLatestJob();
      setSyncJob(job);

      // Stop polling when job is completed or errored
      if (job && (job.status === 'completed' || job.status === 'error')) {
        setIsPolling(false);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [isPolling, accountId, fetchLatestJob]);

  // Initial fetch
  useEffect(() => {
    if (accountId) {
      fetchLatestJob().then(setSyncJob);
    }
  }, [accountId, fetchLatestJob]);

  const progressPercent = syncJob?.total_items 
    ? Math.round((syncJob.processed_items / syncJob.total_items) * 100)
    : 0;

  return {
    syncJob,
    progressPercent,
    isPolling,
    startPolling,
    stopPolling,
    refetch: fetchLatestJob,
  };
}
