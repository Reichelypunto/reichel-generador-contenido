
-- Fix search_path en update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revocar EXECUTE público en funciones SECURITY DEFINER (siguen ejecutándose desde los triggers)
REVOKE EXECUTE ON FUNCTION public.check_alumna_autorizada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.crear_perfil_alumna() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
