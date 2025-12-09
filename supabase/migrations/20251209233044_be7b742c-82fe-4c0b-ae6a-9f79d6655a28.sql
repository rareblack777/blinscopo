-- Tabela de Clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Módulos de Escopo (serviços pré-definidos)
CREATE TABLE public.modulos_escopo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor_padrao DECIMAL(10,2) NOT NULL DEFAULT 0,
  clausula_ia TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Contratos
CREATE TABLE public.contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  modulos_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  texto_contrato TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos_escopo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

-- Como é um sistema de uso pessoal (freelancer solo), 
-- vou criar políticas públicas para authenticated users
-- Isso permite que qualquer usuário logado acesse os dados

-- Políticas para Clientes
CREATE POLICY "Authenticated users can view clientes" 
ON public.clientes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clientes" 
ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes" 
ON public.clientes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete clientes" 
ON public.clientes FOR DELETE TO authenticated USING (true);

-- Políticas para Módulos de Escopo
CREATE POLICY "Authenticated users can view modulos" 
ON public.modulos_escopo FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert modulos" 
ON public.modulos_escopo FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update modulos" 
ON public.modulos_escopo FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete modulos" 
ON public.modulos_escopo FOR DELETE TO authenticated USING (true);

-- Políticas para Contratos
CREATE POLICY "Authenticated users can view contratos" 
ON public.contratos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert contratos" 
ON public.contratos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update contratos" 
ON public.contratos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete contratos" 
ON public.contratos FOR DELETE TO authenticated USING (true);