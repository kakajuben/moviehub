CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.content_type AS ENUM ('movie', 'series', 'anime');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.grant_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_grant_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_first_admin();

CREATE TABLE public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  year integer,
  imdb_id text,
  rating text,
  poster text,
  backdrop text,
  synopsis text,
  type public.content_type NOT NULL DEFAULT 'movie',
  stars text[] NOT NULL DEFAULT '{}',
  genres text[] NOT NULL DEFAULT '{}',
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  telegram_url text,
  vk_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_catalog_items_stars ON public.catalog_items USING GIN (stars);
CREATE INDEX idx_catalog_items_genres ON public.catalog_items USING GIN (genres);
CREATE INDEX idx_catalog_items_created_at ON public.catalog_items (created_at DESC);

GRANT SELECT ON public.catalog_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
GRANT ALL ON public.catalog_items TO service_role;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catalog is publicly readable" ON public.catalog_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert catalog items" ON public.catalog_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update catalog items" ON public.catalog_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete catalog items" ON public.catalog_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER catalog_items_updated_at BEFORE UPDATE ON public.catalog_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.catalog_items (title, year, imdb_id, rating, poster, backdrop, synopsis, type, stars, genres, sources, telegram_url, vk_url) VALUES
('Game of Thrones', 2011, 'tt0944947', '9.2', 'https://m.media-amazon.com/images/M/MV5BMTNhMDJmNmYtNDQ5OS00ODdlLWE0ZDAtZTgyYTIwNDY3OTU3XkEyXkFqcGc@._V1_SX300.jpg', 'https://m.media-amazon.com/images/M/MV5BMTNhMDJmNmYtNDQ5OS00ODdlLWE0ZDAtZTgyYTIwNDY3OTU3XkEyXkFqcGc@._V1_SX300.jpg', 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for a millennium.', 'series', ARRAY['Emilia Clarke','Peter Dinklage','Kit Harington'], ARRAY['Action','Adventure','Drama'], '[{"server":"Server 1","url":"https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4","type":"MP4"}]'::jsonb, 'https://t.me/trybox', 'https://vk.com/'),
('Inception', 2010, 'tt1375666', '8.8', 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg', 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 'movie', ARRAY['Leonardo DiCaprio','Joseph Gordon-Levitt','Elliot Page'], ARRAY['Action','Adventure','Sci-Fi'], '[{"server":"Server 1","url":"https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4","type":"MP4"}]'::jsonb, 'https://t.me/trybox', 'https://vk.com/'),
('Attack on Titan', 2013, 'tt2560140', '9.0', 'https://m.media-amazon.com/images/M/MV5BZjliODY5MzQtMmViZC00MTZmLWFhMWMtMjMwM2I3OGY1MTRiXkEyXkFqcGc@._V1_SX300.jpg', 'https://m.media-amazon.com/images/M/MV5BZjliODY5MzQtMmViZC00MTZmLWFhMWMtMjMwM2I3OGY1MTRiXkEyXkFqcGc@._V1_SX300.jpg', 'After his hometown is destroyed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.', 'anime', ARRAY['Josh Grelle','Bryce Papenbrook','Yuki Kaji'], ARRAY['Animation','Action','Adventure'], '[{"server":"Server 1","url":"https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4","type":"MP4"}]'::jsonb, 'https://t.me/trybox', 'https://vk.com/');
