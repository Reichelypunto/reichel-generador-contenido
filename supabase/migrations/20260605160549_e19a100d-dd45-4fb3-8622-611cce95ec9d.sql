DROP POLICY IF EXISTS "Lectura autorizada" ON public.alumnas_autorizadas;

CREATE POLICY "Cada alumna solo ve su propia autorización"
ON public.alumnas_autorizadas
FOR SELECT
TO authenticated
USING (LOWER(email) = LOWER((SELECT email FROM public.perfiles WHERE id = auth.uid())));