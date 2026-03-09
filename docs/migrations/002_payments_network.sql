-- Add network column to payments table for EVM vs Solana tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS network TEXT DEFAULT 'evm';

-- Add confirmed_at timestamp if not exists
ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Add metadata jsonb column if not exists
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB;
