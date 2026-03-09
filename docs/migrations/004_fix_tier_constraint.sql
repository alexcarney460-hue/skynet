-- Fix tier check constraint to include 'starter' tier
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_tier_check;
ALTER TABLE plans ADD CONSTRAINT plans_tier_check CHECK (tier IN ('free', 'starter', 'pro', 'scale'));
