-- Phase 1: Emergency Lockdown - Fix Critical RLS Policies
-- Remove overly permissive policies and replace with proper security

-- ============================================
-- 1. PAGAMENTOS TABLE - Payment Data Security
-- ============================================
DROP POLICY IF EXISTS "Admin pode gerenciar pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Service role pode criar pagamentos" ON public.pagamentos;

-- Only admins can view all payments
CREATE POLICY "Admins podem ver todos os pagamentos"
ON public.pagamentos FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Lojistas can only see their own payments
CREATE POLICY "Lojistas podem ver seus próprios pagamentos"
ON public.pagamentos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lojistas
    WHERE lojistas.id = pagamentos.lojista_id
    AND lojistas.user_id = auth.uid()
  )
);

-- Only service role can insert payments (for webhook processing)
CREATE POLICY "Service role pode inserir pagamentos"
ON public.pagamentos FOR INSERT
TO service_role
WITH CHECK (true);

-- Only admins can update payments
CREATE POLICY "Admins podem atualizar pagamentos"
ON public.pagamentos FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- ============================================
-- 2. LOJISTAS TABLE - Business Data Security
-- ============================================
DROP POLICY IF EXISTS "Permitir leitura pública de informações básicas de lojistas" ON public.lojistas;
DROP POLICY IF EXISTS "Permitir insert de lojista para qualquer usuário" ON public.lojistas;
DROP POLICY IF EXISTS "Usuário pode ler sua própria loja recém-criada" ON public.lojistas;

-- Keep existing admin and owner policies, they're good
-- Just remove the public read policy

-- ============================================
-- 3. BLOCOS TABLE - Block Inventory Security
-- ============================================
DROP POLICY IF EXISTS "Allow blocos access" ON public.blocos;

-- Admins can do everything
CREATE POLICY "Admins podem gerenciar blocos"
ON public.blocos FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Lojistas can view their own blocks
CREATE POLICY "Lojistas podem ver seus blocos"
ON public.blocos FOR SELECT
TO authenticated
USING (
  lojista_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.lojistas
    WHERE lojistas.id = blocos.lojista_id
    AND lojistas.user_id = auth.uid()
  )
);

-- ============================================
-- 4. CUPONS TABLE - Coupon Security
-- ============================================
DROP POLICY IF EXISTS "Allow cupons access" ON public.cupons;

-- Admins can do everything
CREATE POLICY "Admins podem gerenciar cupons"
ON public.cupons FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Lojistas can view their own coupons
CREATE POLICY "Lojistas podem ver seus cupons"
ON public.cupons FOR SELECT
TO authenticated
USING (
  lojista_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.lojistas
    WHERE lojistas.id = cupons.lojista_id
    AND lojistas.user_id = auth.uid()
  )
);

-- Lojistas can update their own coupons (for attribution)
CREATE POLICY "Lojistas podem atualizar seus cupons"
ON public.cupons FOR UPDATE
TO authenticated
USING (
  lojista_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.lojistas
    WHERE lojistas.id = cupons.lojista_id
    AND lojistas.user_id = auth.uid()
  )
)
WITH CHECK (
  lojista_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.lojistas
    WHERE lojistas.id = cupons.lojista_id
    AND lojistas.user_id = auth.uid()
  )
);

-- ============================================
-- 5. PROFILES TABLE - User Profile Security
-- ============================================
DROP POLICY IF EXISTS "Allow profile access" ON public.profiles;

-- Admins can view all profiles
CREATE POLICY "Admins podem ver todos os perfis"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Users can view their own profile
CREATE POLICY "Usuários podem ver seu próprio perfil"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only system can insert profiles (via trigger)
CREATE POLICY "Sistema pode inserir perfis"
ON public.profiles FOR INSERT
TO service_role
WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can update any profile
CREATE POLICY "Admins podem atualizar qualquer perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- ============================================
-- 6. LOGS_SISTEMA TABLE - System Logs Security
-- ============================================
DROP POLICY IF EXISTS "Admin pode ver logs" ON public.logs_sistema;

-- Only admins can view logs
CREATE POLICY "Admins podem ver logs"
ON public.logs_sistema FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- System can insert logs
CREATE POLICY "Sistema pode inserir logs"
ON public.logs_sistema FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- 7. VENDAS_BLOCOS TABLE - Sales History Security
-- ============================================
DROP POLICY IF EXISTS "Admin pode ver todas as vendas" ON public.vendas_blocos;

-- Admins can do everything
CREATE POLICY "Admins podem gerenciar vendas"
ON public.vendas_blocos FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Lojistas can view their own sales
CREATE POLICY "Lojistas podem ver suas vendas"
ON public.vendas_blocos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lojistas
    WHERE lojistas.id = vendas_blocos.lojista_id
    AND lojistas.user_id = auth.uid()
  )
);

-- ============================================
-- 8. CONFIGURACOES_SISTEMA TABLE - System Config Security
-- ============================================
DROP POLICY IF EXISTS "Admin pode gerenciar configurações" ON public.configuracoes_sistema;

-- Only admins can manage system configurations
CREATE POLICY "Admins podem gerenciar configurações"
ON public.configuracoes_sistema FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));