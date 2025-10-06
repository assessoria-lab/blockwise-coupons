-- ============================================
-- PHASE 2: FIX AUTHENTICATION SYSTEM
-- ============================================
-- This migration addresses critical security vulnerabilities:
-- 1. Removes non-functional validar_login_admin RPC
-- 2. Updates is_admin() to use user_roles table (proper RBAC)
-- 3. Prevents privilege escalation via profiles.tipo_usuario
-- 4. Prepares for migration to Supabase Auth

-- ============================================
-- STEP 1: Drop Non-Functional Admin Login RPC
-- ============================================
DROP FUNCTION IF EXISTS public.validar_login_admin(text, text);

-- ============================================
-- STEP 2: Update is_admin() to Use RBAC
-- ============================================
-- Old implementation checked profiles.tipo_usuario (vulnerable to escalation)
-- New implementation checks user_roles table (secure)

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(user_uuid, 'admin'::app_role);
$$;

-- ============================================
-- STEP 3: Prevent Privilege Escalation
-- ============================================
-- Make tipo_usuario read-only for users
-- Only system can set it during profile creation

-- Drop existing profile update policies
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem atualizar qualquer perfil" ON public.profiles;

-- Users can update their own profile EXCEPT tipo_usuario
CREATE POLICY "Usuários podem atualizar seu próprio perfil (sem role)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND tipo_usuario = (SELECT tipo_usuario FROM public.profiles WHERE user_id = auth.uid())
);

-- Only admins with proper role can update profiles including tipo_usuario
CREATE POLICY "Admins com role podem atualizar qualquer perfil"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- STEP 4: Add Helper Function for Role Management
-- ============================================
-- Secure function to assign roles (admin-only)

CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id uuid,
  target_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only admins can assign roles
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;

  -- Insert role (will be ignored if already exists due to unique constraint)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- ============================================
-- STEP 5: Migration Helper - Create Admin Roles
-- ============================================
-- Add admin role for all users currently marked as admin in profiles
-- This ensures existing admins continue to have access

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE tipo_usuario = 'admin' AND ativo = true
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- STEP 6: Mark usuarios_admin table as deprecated
-- ============================================
-- Don't drop it yet, but add a comment warning not to use it

COMMENT ON TABLE public.usuarios_admin IS 'DEPRECATED: This table is no longer used for authentication. All authentication now goes through Supabase Auth with role-based access control via user_roles table. This table will be removed in a future migration after all admins have been migrated.';

-- ============================================
-- STEP 7: Update lojistas policies to use new RBAC
-- ============================================

-- Drop existing lojistas policies that reference old is_admin
DROP POLICY IF EXISTS "Admins podem atualizar todos os lojistas" ON public.lojistas;
DROP POLICY IF EXISTS "Admins podem deletar lojistas" ON public.lojistas;
DROP POLICY IF EXISTS "Admins podem inserir lojistas" ON public.lojistas;
DROP POLICY IF EXISTS "Admins podem ver todos os lojistas" ON public.lojistas;

-- Recreate with new is_admin (which now uses user_roles)
CREATE POLICY "Admins podem ver todos os lojistas"
ON public.lojistas
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem inserir lojistas"
ON public.lojistas
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar todos os lojistas"
ON public.lojistas
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar lojistas"
ON public.lojistas
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));