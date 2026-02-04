-- Create storage bucket for part images
INSERT INTO storage.buckets (id, name, public)
VALUES ('part-images', 'part-images', true);

-- Create table to track part images
CREATE TABLE public.part_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.part_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for part_images
CREATE POLICY "Anyone authenticated can view part images"
ON public.part_images FOR SELECT
USING (true);

CREATE POLICY "Admins can manage part images"
ON public.part_images FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for part-images bucket
CREATE POLICY "Anyone can view part images"
ON storage.objects FOR SELECT
USING (bucket_id = 'part-images');

CREATE POLICY "Admins can upload part images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'part-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update part images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'part-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete part images"
ON storage.objects FOR DELETE
USING (bucket_id = 'part-images' AND has_role(auth.uid(), 'admin'::app_role));