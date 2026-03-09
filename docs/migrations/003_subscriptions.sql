-- Subscriptions table for Stripe recurring billing
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_cust ON subscriptions(stripe_customer_id);

-- Add tier column to plans if not exists (for subscription-based rate limiting)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';

-- Add stripe_customer_id to plans for quick lookup
ALTER TABLE plans ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Refresh credits on subscription renewal
-- Called by webhook when invoice.paid fires
CREATE OR REPLACE FUNCTION refresh_subscription_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_tier TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE plans
  SET credits = p_credits,
      tier = p_tier,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits INTO new_credits;

  IF NOT FOUND THEN
    INSERT INTO plans (user_id, credits, tier)
    VALUES (p_user_id, p_credits, p_tier)
    RETURNING credits INTO new_credits;
  END IF;

  RETURN COALESCE(new_credits, 0);
END;
$$;

-- Downgrade to free tier (on subscription cancellation)
CREATE OR REPLACE FUNCTION downgrade_to_free(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE plans
  SET tier = 'free',
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;
