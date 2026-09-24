DROP POLICY IF EXISTS "Admins can delete catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Admins can update catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Admins can insert catalog items" ON public.catalog_items;

CREATE POLICY "Admins can delete catalog items" ON public.catalog_items
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE POLICY "Admins can update catalog items" ON public.catalog_items
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE POLICY "Admins can insert catalog items" ON public.catalog_items
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;