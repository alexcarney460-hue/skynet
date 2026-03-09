import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockRpc = vi.fn();
const mockSupabase = { rpc: mockRpc };

vi.mock('../supabase', () => ({
  createServiceClient: () => mockSupabase,
}));

vi.mock('../plans', () => ({
  getMinuteKey: () => '2026-03-08T12:00',
}));

import { checkAndDecrement } from '../usage';

describe('checkAndDecrement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow request when credits and rate limit are fine', async () => {
    // decrement_credit returns 999 (new balance)
    mockRpc.mockResolvedValueOnce({ data: 999, error: null });
    // increment_rate_limit returns 1 (first request this minute)
    mockRpc.mockResolvedValueOnce({ data: 1, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(true);
    expect(result.credits).toBe(999);
    expect(result.rateUsed).toBe(1);
    expect(result.reason).toBeUndefined();
  });

  it('should reject when no credits remain (returns -1)', async () => {
    mockRpc.mockResolvedValueOnce({ data: -1, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('No credits remaining');
    expect(result.credits).toBe(0);
  });

  it('should reject when decrement_credit returns null', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('No credits remaining');
  });

  it('should reject when decrement_credit returns an error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'db error' } });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('No credits remaining');
  });

  it('should apply rate limit of 30 for low balance (< 1000)', async () => {
    mockRpc.mockResolvedValueOnce({ data: 500, error: null });
    // Rate usage at 31 exceeds limit of 30
    mockRpc.mockResolvedValueOnce({ data: 31, error: null });
    // Refund call
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Rate limit exceeded');
    expect(result.credits).toBe(501); // refunded
    expect(result.rateUsed).toBe(31);
  });

  it('should apply rate limit of 100 for mid balance (1000-9999)', async () => {
    mockRpc.mockResolvedValueOnce({ data: 5000, error: null });
    // Rate usage at 101 exceeds limit of 100
    mockRpc.mockResolvedValueOnce({ data: 101, error: null });
    // Refund call
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Rate limit exceeded');
    expect(result.credits).toBe(5001);
  });

  it('should apply rate limit of 500 for high balance (>= 10000)', async () => {
    mockRpc.mockResolvedValueOnce({ data: 15000, error: null });
    // Rate usage at 501 exceeds limit of 500
    mockRpc.mockResolvedValueOnce({ data: 501, error: null });
    // Refund call
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Rate limit exceeded');
    expect(result.credits).toBe(15001);
  });

  it('should allow at exactly the rate limit boundary (30/30)', async () => {
    mockRpc.mockResolvedValueOnce({ data: 500, error: null });
    // Rate usage exactly at 30 (limit is 30) - not > 30, so allowed
    mockRpc.mockResolvedValueOnce({ data: 30, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(true);
    expect(result.rateUsed).toBe(30);
  });

  it('should allow at exactly 100/100 rate limit for mid balance', async () => {
    mockRpc.mockResolvedValueOnce({ data: 5000, error: null });
    mockRpc.mockResolvedValueOnce({ data: 100, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(true);
  });

  it('should allow at exactly 500/500 rate limit for high balance', async () => {
    mockRpc.mockResolvedValueOnce({ data: 15000, error: null });
    mockRpc.mockResolvedValueOnce({ data: 500, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(true);
  });

  it('should refund credit on rate limit error', async () => {
    mockRpc.mockResolvedValueOnce({ data: 500, error: null });
    // Rate limit RPC errors
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'rate error' } });
    // Refund call
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Rate limit exceeded');
    // Verify refund was called
    expect(mockRpc).toHaveBeenCalledTimes(3);
    expect(mockRpc).toHaveBeenNthCalledWith(3, 'refund_credit', { p_user_id: 'user-1' });
  });

  it('should handle rateData being null gracefully', async () => {
    mockRpc.mockResolvedValueOnce({ data: 500, error: null });
    // rateData is null but no error - rateUsed defaults to 0, which is <= 30
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(true);
    expect(result.rateUsed).toBe(0);
  });

  it('should use correct rate limit at the 1000 boundary', async () => {
    // credits = 1000, should get rate limit of 100 (credits >= 1_000)
    mockRpc.mockResolvedValueOnce({ data: 1000, error: null });
    mockRpc.mockResolvedValueOnce({ data: 100, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(true);
  });

  it('should use correct rate limit at the 10000 boundary', async () => {
    // credits = 10000, should get rate limit of 500 (credits >= 10_000)
    mockRpc.mockResolvedValueOnce({ data: 10000, error: null });
    mockRpc.mockResolvedValueOnce({ data: 500, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(true);
  });

  it('should pass correct parameters to RPCs', async () => {
    mockRpc.mockResolvedValueOnce({ data: 100, error: null });
    mockRpc.mockResolvedValueOnce({ data: 1, error: null });

    await checkAndDecrement('user-xyz');

    expect(mockRpc).toHaveBeenNthCalledWith(1, 'decrement_credit', { p_user_id: 'user-xyz' });
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'increment_rate_limit', {
      p_user_id: 'user-xyz',
      p_minute: '2026-03-08T12:00',
    });
  });
});
