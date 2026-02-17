-- SKYNET Schema
-- Deploy to Supabase SQL editor

-- ============ TABLES ============

CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_text TEXT NOT NULL,
  preview_excerpt TEXT,
  price_cents INTEGER DEFAULT 899,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pack_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  UNIQUE(pack_id, artifact_id)
);

CREATE TABLE user_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_id UUID,
  unlock_type TEXT NOT NULL CHECK (unlock_type IN ('artifact', 'full')),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  stripe_payment_intent_id TEXT UNIQUE
);

-- Partial unique indexes for conditional uniqueness
CREATE UNIQUE INDEX idx_user_unlocks_artifact ON user_unlocks(user_id, artifact_id) WHERE artifact_id IS NOT NULL;
CREATE UNIQUE INDEX idx_user_unlocks_full ON user_unlocks(user_id) WHERE unlock_type = 'full';

-- ============ INDEXES ============

CREATE INDEX idx_artifacts_slug ON artifacts(slug);
CREATE INDEX idx_user_unlocks_user_id ON user_unlocks(user_id);
CREATE INDEX idx_user_unlocks_artifact_id ON user_unlocks(artifact_id);
CREATE INDEX idx_packs_slug ON packs(slug);

-- ============ SECURITY DEFINER FUNCTIONS ============

CREATE OR REPLACE FUNCTION public.get_artifact_previews()
RETURNS TABLE (
  id UUID,
  slug TEXT,
  category TEXT,
  title TEXT,
  description TEXT,
  preview_excerpt TEXT,
  price_cents INTEGER,
  version TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    artifacts.id,
    artifacts.slug,
    artifacts.category,
    artifacts.title,
    artifacts.description,
    artifacts.preview_excerpt,
    artifacts.price_cents,
    artifacts.version,
    artifacts.created_at
  FROM artifacts
  ORDER BY artifacts.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_pack_with_previews(p_pack_slug TEXT)
RETURNS TABLE (
  pack_id UUID,
  pack_slug TEXT,
  pack_name TEXT,
  pack_description TEXT,
  pack_created_at TIMESTAMP,
  artifact_id UUID,
  artifact_slug TEXT,
  artifact_category TEXT,
  artifact_title TEXT,
  artifact_description TEXT,
  preview_excerpt TEXT,
  price_cents INTEGER,
  artifact_version TEXT,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    packs.id,
    packs.slug,
    packs.name,
    packs.description,
    packs.created_at,
    artifacts.id,
    artifacts.slug,
    artifacts.category,
    artifacts.title,
    artifacts.description,
    artifacts.preview_excerpt,
    artifacts.price_cents,
    artifacts.version,
    pack_items.sort_order
  FROM packs
  LEFT JOIN pack_items ON packs.id = pack_items.pack_id
  LEFT JOIN artifacts ON pack_items.artifact_id = artifacts.id
  WHERE packs.slug = p_pack_slug
  ORDER BY pack_items.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ RLS POLICIES ============

ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artifacts_no_public" ON artifacts FOR SELECT USING (false);
CREATE POLICY "artifacts_auth_owned" ON artifacts FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (SELECT 1 FROM user_unlocks WHERE user_id = auth.uid() AND unlock_type = 'full')
      OR
      EXISTS (SELECT 1 FROM user_unlocks WHERE user_id = auth.uid() AND artifact_id = artifacts.id AND unlock_type = 'artifact')
    )
  );

ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packs_public_read" ON packs FOR SELECT USING (true);

ALTER TABLE pack_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pack_items_public_read" ON pack_items FOR SELECT USING (true);

ALTER TABLE user_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_unlocks_auth_own" ON user_unlocks FOR SELECT
  USING (user_id = auth.uid());
