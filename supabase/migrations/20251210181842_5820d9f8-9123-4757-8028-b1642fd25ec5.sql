-- Add user_id column to clientes table
ALTER TABLE public.clientes 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid();

-- Add user_id column to modulos_escopo table
ALTER TABLE public.modulos_escopo 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid();

-- Add user_id column to contratos table
ALTER TABLE public.contratos 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid();

-- Drop existing overly permissive RLS policies on clientes
DROP POLICY IF EXISTS "Authenticated users can delete clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;

-- Create secure RLS policies for clientes
CREATE POLICY "Users can view their own clientes" 
ON public.clientes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clientes" 
ON public.clientes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clientes" 
ON public.clientes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clientes" 
ON public.clientes FOR DELETE 
USING (auth.uid() = user_id);

-- Drop existing overly permissive RLS policies on modulos_escopo
DROP POLICY IF EXISTS "Authenticated users can delete modulos" ON public.modulos_escopo;
DROP POLICY IF EXISTS "Authenticated users can insert modulos" ON public.modulos_escopo;
DROP POLICY IF EXISTS "Authenticated users can update modulos" ON public.modulos_escopo;
DROP POLICY IF EXISTS "Authenticated users can view modulos" ON public.modulos_escopo;

-- Create secure RLS policies for modulos_escopo
CREATE POLICY "Users can view their own modulos" 
ON public.modulos_escopo FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own modulos" 
ON public.modulos_escopo FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own modulos" 
ON public.modulos_escopo FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own modulos" 
ON public.modulos_escopo FOR DELETE 
USING (auth.uid() = user_id);

-- Drop existing overly permissive RLS policies on contratos
DROP POLICY IF EXISTS "Authenticated users can delete contratos" ON public.contratos;
DROP POLICY IF EXISTS "Authenticated users can insert contratos" ON public.contratos;
DROP POLICY IF EXISTS "Authenticated users can update contratos" ON public.contratos;
DROP POLICY IF EXISTS "Authenticated users can view contratos" ON public.contratos;

-- Create secure RLS policies for contratos
CREATE POLICY "Users can view their own contratos" 
ON public.contratos FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contratos" 
ON public.contratos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contratos" 
ON public.contratos FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contratos" 
ON public.contratos FOR DELETE 
USING (auth.uid() = user_id);