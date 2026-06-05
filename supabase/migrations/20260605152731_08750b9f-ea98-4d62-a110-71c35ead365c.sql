
-- 1) Lista de alumnas autorizadas
CREATE TABLE public.alumnas_autorizadas (
  email TEXT PRIMARY KEY,
  nota TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.alumnas_autorizadas TO authenticated;
GRANT ALL ON public.alumnas_autorizadas TO service_role;

ALTER TABLE public.alumnas_autorizadas ENABLE ROW LEVEL SECURITY;

-- Cualquiera autenticada puede comprobar si su email está (necesario para el flow, pero no expone datos sensibles)
CREATE POLICY "Lectura autorizada" ON public.alumnas_autorizadas
  FOR SELECT TO authenticated USING (true);

-- 2) Perfiles
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.perfiles TO authenticated;
GRANT ALL ON public.perfiles TO service_role;

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada alumna ve su perfil" ON public.perfiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Cada alumna edita su perfil" ON public.perfiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Cada alumna inserta su perfil" ON public.perfiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3) Trigger: bloquear signup si email no está autorizado
CREATE OR REPLACE FUNCTION public.check_alumna_autorizada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.alumnas_autorizadas
    WHERE LOWER(email) = LOWER(NEW.email)
  ) THEN
    RAISE EXCEPTION 'Este correo no está autorizado. Contacta a soporte.membresia@reichelypunto.com';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_alumna_autorizada
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_alumna_autorizada();

-- 4) Trigger: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.crear_perfil_alumna()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crear_perfil_alumna
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_perfil_alumna();

-- 5) Trigger updated_at en perfiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_perfiles_updated_at
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
