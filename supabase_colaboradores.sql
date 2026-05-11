-- ============================================================
-- EJECUTAR EN: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. TABLA PROFILES (espejo de auth.users con nombre público)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre    TEXT,
  email     TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger: crea profile automáticamente en cada nuevo registro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'nombre',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill usuarios existentes
INSERT INTO public.profiles (id, nombre, email)
SELECT
  id,
  COALESCE(
    raw_user_meta_data->>'nombre',
    raw_user_meta_data->>'full_name',
    split_part(email, '@', 1)
  ),
  email
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 2. TABLA AMIGOS
-- ============================================================
-- Una fila por dirección: user_id ve a amigo_id con su alias.
-- Cuando se acepta, se crean DOS filas (una por cada lado).
CREATE TABLE IF NOT EXISTS public.amigos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amigo_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias      TEXT,
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, amigo_id)
);

ALTER TABLE public.amigos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "amigos_select" ON public.amigos
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = amigo_id);

CREATE POLICY "amigos_insert" ON public.amigos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "amigos_update" ON public.amigos
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = amigo_id);

CREATE POLICY "amigos_delete" ON public.amigos
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = amigo_id);


-- 3. TABLA OBRA_COLABORADORES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.obra_colaboradores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id         UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  colaborador_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (obra_id, colaborador_id)
);

ALTER TABLE public.obra_colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colaboradores_select" ON public.obra_colaboradores
  FOR SELECT USING (
    auth.uid() = colaborador_id
    OR auth.uid() = invited_by
    OR auth.uid() IN (SELECT user_id FROM public.obras WHERE id = obra_id)
  );

CREATE POLICY "colaboradores_insert" ON public.obra_colaboradores
  FOR INSERT WITH CHECK (
    auth.uid() = invited_by
    AND auth.uid() IN (SELECT user_id FROM public.obras WHERE id = obra_id)
  );

CREATE POLICY "colaboradores_delete" ON public.obra_colaboradores
  FOR DELETE USING (
    auth.uid() = invited_by
    OR auth.uid() IN (SELECT user_id FROM public.obras WHERE id = obra_id)
  );
