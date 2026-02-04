-- Add order_position column to part_images table
ALTER TABLE public.part_images 
ADD COLUMN order_position integer DEFAULT 0;

-- Update existing images to have sequential positions based on created_at
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY part_id ORDER BY created_at) - 1 as pos
  FROM public.part_images
)
UPDATE public.part_images 
SET order_position = ranked.pos
FROM ranked
WHERE public.part_images.id = ranked.id;