-- SkynetX Schema
-- Deploy to Supabase SQL editor

-- ============ PROFILES ============

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (id = auth.uid());

-- ============ API KEYS ============

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_own" ON api_keys FOR ALL USING (user_id = auth.uid());

-- ============ TELEMETRY EVENTS ============

CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT,
  session_id TEXT,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('drift', 'pressure', 'verbosity', 'half-life')),
  input JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telemetry_user ON telemetry_events(user_id);
CREATE INDEX idx_telemetry_created ON telemetry_events(created_at DESC);
CREATE INDEX idx_telemetry_metric ON telemetry_events(metric_type);

ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telemetry_own_read" ON telemetry_events FOR SELECT USING (user_id = auth.uid());
-- Service role inserts (no RLS needed for inserts via service key)
