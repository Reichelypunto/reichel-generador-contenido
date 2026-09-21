ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS marca_nombre text,
  ADD COLUMN IF NOT EXISTS marca_handle text,
  ADD COLUMN IF NOT EXISTS marca_color text NOT NULL DEFAULT '#a3134b',
  ADD COLUMN IF NOT EXISTS marca_color_oscuro text NOT NULL DEFAULT '#0e2e64',
  ADD COLUMN IF NOT EXISTS marca_negocio text,
  ADD COLUMN IF NOT EXISTS marca_audiencia text,
  ADD COLUMN IF NOT EXISTS marca_tono text NOT NULL DEFAULT 'Directo, adulto y cercano',
  ADD COLUMN IF NOT EXISTS marca_genero text NOT NULL DEFAULT 'femenino',
  ADD COLUMN IF NOT EXISTS marca_persona text NOT NULL DEFAULT 'yo',
  ADD COLUMN IF NOT EXISTS marca_idioma text NOT NULL DEFAULT 'España',
  ADD COLUMN IF NOT EXISTS marca_cta text,
  ADD COLUMN IF NOT EXISTS marca_firma text,
  ADD COLUMN IF NOT EXISTS marca_evitar text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE TABLE IF NOT EXISTS public.trabajos (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trabajos TO authenticated;
GRANT ALL ON public.trabajos TO service_role;

ALTER TABLE public.trabajos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada alumna gestiona su trabajo"
  ON public.trabajos FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_trabajos_updated_at
  BEFORE UPDATE ON public.trabajos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.generaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formato text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.generaciones TO authenticated;
GRANT ALL ON public.generaciones TO service_role;

ALTER TABLE public.generaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada alumna ve sus generaciones"
  ON public.generaciones FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_generaciones_user_fecha
  ON public.generaciones (user_id, created_at DESC);