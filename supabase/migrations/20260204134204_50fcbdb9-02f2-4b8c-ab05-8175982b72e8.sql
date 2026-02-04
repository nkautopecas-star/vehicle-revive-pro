-- 1. Primeiro, atualizar qualquer usuário com role 'operador' para 'vendedor'
UPDATE public.user_roles 
SET role = 'vendedor' 
WHERE role = 'operador';

-- 2. Atualizar políticas RLS que usam 'operador'

-- vehicles
DROP POLICY IF EXISTS "Admins and operators can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins and operators can update vehicles" ON public.vehicles;

CREATE POLICY "Admins can insert vehicles" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- parts
DROP POLICY IF EXISTS "Admins and operators can insert parts" ON public.parts;
DROP POLICY IF EXISTS "Admins and operators can update parts" ON public.parts;

CREATE POLICY "Admins can insert parts" 
ON public.parts 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update parts" 
ON public.parts 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- categories
DROP POLICY IF EXISTS "Admins and operators can manage categories" ON public.categories;

CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- marketplace_accounts
DROP POLICY IF EXISTS "Admins and operators can manage marketplace accounts" ON public.marketplace_accounts;

CREATE POLICY "Admins can manage marketplace accounts" 
ON public.marketplace_accounts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- marketplace_listings
DROP POLICY IF EXISTS "Admins and operators can manage listings" ON public.marketplace_listings;

CREATE POLICY "Admins can manage listings" 
ON public.marketplace_listings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- marketplace_questions
DROP POLICY IF EXISTS "Admins and operators can manage questions" ON public.marketplace_questions;

CREATE POLICY "Admins can manage questions" 
ON public.marketplace_questions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- part_compatibilities
DROP POLICY IF EXISTS "Admins and operators can manage compatibilities" ON public.part_compatibilities;

CREATE POLICY "Admins can manage compatibilities" 
ON public.part_compatibilities 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- sales
DROP POLICY IF EXISTS "Admins and operators can manage sales" ON public.sales;

CREATE POLICY "Admins can manage sales" 
ON public.sales 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- stock_movements
DROP POLICY IF EXISTS "Admins and operators can manage stock movements" ON public.stock_movements;

CREATE POLICY "Admins can manage stock movements" 
ON public.stock_movements 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- 3. Atualizar função has_any_role para usar apenas admin e vendedor
DROP FUNCTION IF EXISTS public.has_any_role(uuid, app_role[]);

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;