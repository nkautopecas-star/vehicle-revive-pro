-- Create table for listing type price rules
CREATE TABLE public.listing_type_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marketplace TEXT NOT NULL DEFAULT 'mercadolivre',
  listing_type TEXT NOT NULL, -- 'gold_pro' (Premium), 'gold_special' (Clássico), etc.
  listing_type_name TEXT NOT NULL, -- Display name like 'Anúncio Premium'
  price_variation_percent NUMERIC NOT NULL DEFAULT 0, -- Percentage to add/subtract
  is_default BOOLEAN NOT NULL DEFAULT false, -- If this is the default type when creating
  is_enabled BOOLEAN NOT NULL DEFAULT true, -- If this type should be offered
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(marketplace, listing_type)
);

-- Enable RLS
ALTER TABLE public.listing_type_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view listing type rules"
ON public.listing_type_rules
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage listing type rules"
ON public.listing_type_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_listing_type_rules_updated_at
BEFORE UPDATE ON public.listing_type_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default ML listing types
INSERT INTO public.listing_type_rules (marketplace, listing_type, listing_type_name, price_variation_percent, is_default, is_enabled) VALUES
('mercadolivre', 'gold_special', 'Clássico', 0, true, true),
('mercadolivre', 'gold_pro', 'Premium', 10, false, true);