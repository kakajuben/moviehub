-- 1. Create user_watchlist table linking users to catalog items
CREATE TABLE IF NOT EXISTS public.user_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

-- 3. Restrict access so each user can only see, add, and remove their own items
CREATE POLICY "Users can view own watchlist"
  ON public.user_watchlist FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watchlist"
  ON public.user_watchlist FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own watchlist"
  ON public.user_watchlist FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. Grant necessary access rights
GRANT SELECT, INSERT, DELETE ON public.user_watchlist TO authenticated;
GRANT ALL ON public.user_watchlist TO service_role;

