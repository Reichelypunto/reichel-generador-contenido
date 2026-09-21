GRANT INSERT ON public.generaciones TO authenticated;

CREATE POLICY "Cada alumna registra sus generaciones"
  ON public.generaciones FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);