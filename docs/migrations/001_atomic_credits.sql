-- Atomic credit deduction: prevents race conditions where concurrent requests
-- both read the same balance and only deduct once.
-- Returns new credit balance, or -1 if no credits remain.
CREATE OR REPLACE FUNCTION decrement_credit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE plans
  SET credits = credits - 1
  WHERE user_id = p_user_id AND credits >= 1
  RETURNING credits INTO new_credits;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN new_credits;
END;
$$;

-- Refund a credit (used when rate-limiting after deduction)
CREATE OR REPLACE FUNCTION refund_credit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE plans
  SET credits = credits + 1
  WHERE user_id = p_user_id
  RETURNING credits INTO new_credits;

  RETURN COALESCE(new_credits, 0);
END;
$$;

-- Atomic rate limit increment with upsert.
-- Returns the new call count for this minute.
CREATE OR REPLACE FUNCTION increment_rate_limit(p_user_id UUID, p_minute TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_calls INTEGER;
BEGIN
  INSERT INTO rate_limits (user_id, minute, calls)
  VALUES (p_user_id, p_minute, 1)
  ON CONFLICT (user_id, minute)
  DO UPDATE SET calls = rate_limits.calls + 1
  RETURNING calls INTO new_calls;

  RETURN new_calls;
END;
$$;

-- Atomic credit addition for confirmed payments.
-- Prevents lost updates from concurrent payment confirmations.
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_credits INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE plans
  SET credits = credits + p_credits,
      total_purchased = total_purchased + p_credits
  WHERE user_id = p_user_id
  RETURNING credits INTO new_credits;

  RETURN COALESCE(new_credits, 0);
END;
$$;
