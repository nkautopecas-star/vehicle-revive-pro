
-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'operador', 'vendedor');
CREATE TYPE public.vehicle_status AS ENUM ('ativo', 'desmontando', 'desmontado', 'finalizado');
CREATE TYPE public.part_condition AS ENUM ('nova', 'usada', 'recondicionada');
CREATE TYPE public.part_status AS ENUM ('ativa', 'vendida', 'pausada');
CREATE TYPE public.marketplace_type AS ENUM ('mercadolivre', 'shopee', 'olx');
CREATE TYPE public.movement_type AS ENUM ('entrada', 'saida', 'ajuste');
CREATE TYPE public.question_status AS ENUM ('pending', 'answered');
CREATE TYPE public.listing_status AS ENUM ('active', 'paused', 'sold', 'deleted');
CREATE TYPE public.sale_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');
CREATE TYPE public.account_status AS ENUM ('active', 'inactive', 'error');

-- =============================================
-- PROFILES TABLE
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER ROLES TABLE (separate for security)
-- =============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'vendedor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION (prevents RLS recursion)
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- =============================================
-- CATEGORIES TABLE
-- =============================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- =============================================
-- VEHICLES TABLE
-- =============================================

CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT NOT NULL,
  chassi TEXT,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  motorizacao TEXT,
  combustivel TEXT,
  cor TEXT,
  data_entrada DATE DEFAULT CURRENT_DATE NOT NULL,
  status public.vehicle_status DEFAULT 'ativo' NOT NULL,
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_vehicles_placa ON public.vehicles(placa);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_marca_modelo ON public.vehicles(marca, modelo);

-- =============================================
-- PARTS TABLE
-- =============================================

CREATE TABLE public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo_interno TEXT,
  codigo_oem TEXT,
  categoria_id UUID REFERENCES public.categories(id),
  condicao public.part_condition DEFAULT 'usada' NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  quantidade INTEGER DEFAULT 1 NOT NULL,
  quantidade_minima INTEGER DEFAULT 0 NOT NULL,
  localizacao TEXT,
  preco_custo DECIMAL(10,2),
  preco_venda DECIMAL(10,2),
  observacoes TEXT,
  status public.part_status DEFAULT 'ativa' NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_parts_codigo_interno ON public.parts(codigo_interno);
CREATE INDEX idx_parts_codigo_oem ON public.parts(codigo_oem);
CREATE INDEX idx_parts_status ON public.parts(status);
CREATE INDEX idx_parts_categoria ON public.parts(categoria_id);
CREATE INDEX idx_parts_vehicle ON public.parts(vehicle_id);

-- =============================================
-- PART COMPATIBILITIES TABLE
-- =============================================

CREATE TABLE public.part_compatibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano_inicio INTEGER,
  ano_fim INTEGER,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.part_compatibilities ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_part_compat_part ON public.part_compatibilities(part_id);
CREATE INDEX idx_part_compat_marca_modelo ON public.part_compatibilities(marca, modelo);

-- =============================================
-- MARKETPLACE ACCOUNTS TABLE
-- =============================================

CREATE TABLE public.marketplace_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace public.marketplace_type NOT NULL,
  nome_conta TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  status public.account_status DEFAULT 'inactive' NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.marketplace_accounts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- MARKETPLACE LISTINGS TABLE
-- =============================================

CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE NOT NULL,
  marketplace_account_id UUID REFERENCES public.marketplace_accounts(id) ON DELETE CASCADE NOT NULL,
  external_id TEXT,
  titulo TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  status public.listing_status DEFAULT 'active' NOT NULL,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_listings_external ON public.marketplace_listings(external_id);
CREATE INDEX idx_listings_part ON public.marketplace_listings(part_id);
CREATE INDEX idx_listings_account ON public.marketplace_listings(marketplace_account_id);

-- =============================================
-- MARKETPLACE QUESTIONS TABLE
-- =============================================

CREATE TABLE public.marketplace_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  status public.question_status DEFAULT 'pending' NOT NULL,
  external_id TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.marketplace_questions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_questions_listing ON public.marketplace_questions(listing_id);
CREATE INDEX idx_questions_status ON public.marketplace_questions(status);

-- =============================================
-- SALES TABLE
-- =============================================

CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES public.parts(id) NOT NULL,
  marketplace_account_id UUID REFERENCES public.marketplace_accounts(id),
  quantidade INTEGER DEFAULT 1 NOT NULL,
  preco_venda DECIMAL(10,2) NOT NULL,
  customer_name TEXT,
  order_external_id TEXT,
  status public.sale_status DEFAULT 'pending' NOT NULL,
  sold_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sales_part ON public.sales(part_id);
CREATE INDEX idx_sales_status ON public.sales(status);
CREATE INDEX idx_sales_date ON public.sales(sold_at);

-- =============================================
-- STOCK MOVEMENTS TABLE
-- =============================================

CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE NOT NULL,
  tipo public.movement_type NOT NULL,
  quantidade INTEGER NOT NULL,
  motivo TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_movements_part ON public.stock_movements(part_id);
CREATE INDEX idx_movements_date ON public.stock_movements(created_at);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON public.parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_marketplace_accounts_updated_at BEFORE UPDATE ON public.marketplace_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- HANDLE NEW USER TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  
  -- Default role is 'vendedor'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'vendedor');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS POLICIES - PROFILES
-- =============================================

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - USER_ROLES
-- =============================================

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES - CATEGORIES (public read)
-- =============================================

CREATE POLICY "Anyone authenticated can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and operators can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'operador']::public.app_role[]));

-- =============================================
-- RLS POLICIES - VEHICLES
-- =============================================

CREATE POLICY "Authenticated users can view vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and operators can insert vehicles"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'operador']::public.app_role[]));

CREATE POLICY "Admins and operators can update vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'operador']::public.app_role[]));

CREATE POLICY "Admins can delete vehicles"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES - PARTS
-- =============================================

CREATE POLICY "Authenticated users can view parts"
  ON public.parts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and operators can insert parts"
  ON public.parts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'operador']::public.app_role[]));

CREATE POLICY "Admins and operators can update parts"
  ON public.parts FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'operador']::public.app_role[]));

CREATE POLICY "Admins can delete parts"
  ON public.parts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES - PART_COMPATIBILITIES
-- =============================================

CREATE POLICY "Authenticated users can view compatibilities"
  ON public.part_compatibilities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and operators can manage compatibilities"
  ON public.part_compatibilities FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'operador']::public.app_role[]));

-- =============================================
-- RLS POLICIES - MARKETPLACE_ACCOUNTS
-- =============================================

CREATE POLICY "Authenticated users can view marketplace accounts"
  ON public.marketplace_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and operators can manage marketplace accounts"
  ON public.marketplace_accounts FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'operador']::public.app_role[]));

-- =============================================
-- RLS POLICIES - MARKETPLACE_LISTINGS
-- =============================================

CREATE POLICY "Authenticated users can view listings"
  ON public.marketplace_listings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and operators can manage listings"
  ON public.marketplace_listings FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'operador']::public.app_role[]));

-- =============================================
-- RLS POLICIES - MARKETPLACE_QUESTIONS
-- =============================================

CREATE POLICY "Authenticated users can view questions"
  ON public.marketplace_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can answer questions"
  ON public.marketplace_questions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins and operators can manage questions"
  ON public.marketplace_questions FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'operador']::public.app_role[]));

-- =============================================
-- RLS POLICIES - SALES
-- =============================================

CREATE POLICY "Authenticated users can view sales"
  ON public.sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and operators can manage sales"
  ON public.sales FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'operador']::public.app_role[]));

-- =============================================
-- RLS POLICIES - STOCK_MOVEMENTS
-- =============================================

CREATE POLICY "Authenticated users can view stock movements"
  ON public.stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and operators can manage stock movements"
  ON public.stock_movements FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'operador']::public.app_role[]));

-- =============================================
-- INSERT DEFAULT CATEGORIES
-- =============================================

INSERT INTO public.categories (name, description) VALUES
  ('Motor', 'Componentes do motor e sistema de propulsão'),
  ('Transmissão', 'Câmbio, embreagem e componentes relacionados'),
  ('Suspensão', 'Amortecedores, molas, bandejas e componentes'),
  ('Freios', 'Discos, pastilhas, pinças e sistema de freios'),
  ('Elétrica', 'Componentes elétricos e eletrônicos'),
  ('Carroceria', 'Portas, capô, para-lamas e estrutura'),
  ('Interior', 'Bancos, painéis, console e acabamentos internos'),
  ('Vidros', 'Para-brisa, vidros laterais e traseiros'),
  ('Iluminação', 'Faróis, lanternas e componentes de iluminação'),
  ('Arrefecimento', 'Radiador, bomba d''água e sistema de refrigeração'),
  ('Escapamento', 'Catalisador, silencioso e tubulações'),
  ('Direção', 'Volante, caixa de direção e componentes'),
  ('Rodas e Pneus', 'Rodas, calotas e pneus'),
  ('Acessórios', 'Retrovisores, maçanetas e acessórios diversos');
