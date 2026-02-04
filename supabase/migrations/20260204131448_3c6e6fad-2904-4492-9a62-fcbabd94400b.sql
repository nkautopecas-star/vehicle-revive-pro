
-- =============================================
-- FIX 1: Set search_path for trigger function
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- =============================================
-- FIX 2: Replace overly permissive UPDATE policy on marketplace_questions
-- Only allow answering (updating answer field) for authenticated users
-- =============================================

DROP POLICY IF EXISTS "All authenticated users can answer questions" ON public.marketplace_questions;

CREATE POLICY "Authenticated users can answer questions"
  ON public.marketplace_questions FOR UPDATE
  TO authenticated
  USING (status = 'pending')
  WITH CHECK (status = 'pending');
