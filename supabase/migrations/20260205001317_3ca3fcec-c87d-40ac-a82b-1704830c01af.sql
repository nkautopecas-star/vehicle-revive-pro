-- Add dimension fields to parts table for marketplace listings
ALTER TABLE public.parts
ADD COLUMN IF NOT EXISTS peso_gramas INTEGER NULL,
ADD COLUMN IF NOT EXISTS comprimento_cm NUMERIC(6,1) NULL,
ADD COLUMN IF NOT EXISTS largura_cm NUMERIC(6,1) NULL,
ADD COLUMN IF NOT EXISTS altura_cm NUMERIC(6,1) NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.parts.peso_gramas IS 'Weight in grams for shipping calculations';
COMMENT ON COLUMN public.parts.comprimento_cm IS 'Length in centimeters for shipping';
COMMENT ON COLUMN public.parts.largura_cm IS 'Width in centimeters for shipping';
COMMENT ON COLUMN public.parts.altura_cm IS 'Height in centimeters for shipping';