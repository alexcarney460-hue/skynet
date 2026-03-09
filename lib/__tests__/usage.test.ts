import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase with both rpc and from
const mockRpc = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockSupabase = { rpc: mockRpc, from: mockFrom };

vi.mock('../supabase', () => ({
  createServiceClient: () => mockSupabase,
}));

vi.mock('../plans', async () => {
  const actual = await vi.importActual('../plans');
  return {
    ...actual,
    getMinuteKey: () => '2026-03-08T12:00',
  };
});

import { checkAndDecrement } from '../usage';

describe('checkAndDecrement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: plans query returns free tier
    mockSingle.mockResolvedValue({ data: { tier: 'free' }, error: null });
  });

  it('should allow request when credits and rate limit are fine', async () => {
    mockRpc.mockResolvedValueOnce({ data: 999, error: null });
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

  it('should apply rate limit of 30 for free tier', async () => {
    mockSingle.mockResolvedValue({ data: { tier: 'free' }, error: null });
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

  it('should apply rate limit of 60 for starter tier', async () => {
    mockSingle.mockResolvedValue({ data: { tier: 'starter' }, error: null });
    mockRpc.mockResolvedValueOnce({ data: 5000, error: null });
    // Rate usage at 61 exceeds limit of 60
    mockRpc.mockResolvedValueOnce({ data: 61, error: null });
    // Refund call
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Rate limit exceeded');
    expect(result.reason).toContain('starter');
    expect(result.credits).toBe(5001);
  });

  it('should apply rate limit of 200 for pro tier', async () => {
    mockSingle.mockResolvedValue({ data: { tier: 'pro' }, error: null });
    mockRpc.mockResolvedValueOnce({ data: 20000, error: null });
    mockRpc.mockResolvedValueOnce({ data: 201, error: null });
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Rate limit exceeded');
    expect(result.reason).toContain('pro');
  });

  it('should apply rate limit of 500 for scale tier', async () => {
    mockSingle.mockResolvedValue({ data: { tier: 'scale' }, error: null });
    mockRpc.mockResolvedValueOnce({ data: 100000, error: null });
    mockRpc.mockResolvedValueOnce({ data: 501, error: null });
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Rate limit exceeded');
    expect(result.reason).toContain('scale');
  });

  it('should allow at exactly the rate limit boundary (30/30 on free)', async () => {
    mockSingle.mockResolvedValue({ data: { tier: 'free' }, error: null });
    mockRpc.mockResolvedValueOnce({ data: 500, error: null });
    mockRpc.mockResolvedValueOnce({ data: 30, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(true);
    expect(result.rateUsed).toBe(30);
  });

  it('should allow at exactly 200/200 for pro tier', async () => {
    mockSingle.mockResolvedValue({ data: { tier: 'pro' }, error: null });
    mockRpc.mockResolvedValueOnce({ data: 20000, error: null });
    mockRpc.mockResolvedValueOnce({ data: 200, error: null });

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
    expect(mockRpc).toHaveBeenCalledTimes(3);
    expect(mockRpc).toHaveBeenNthCalledWith(3, 'refund_credit', { p_user_id: 'user-1' });
  });

  it('should handle rateData being null gracefully', async () => {
    mockRpc.mockResolvedValueOnce({ data: 500, error: null });
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(true);
    expect(result.rateUsed).toBe(0);
  });

  it('should default to free tier when plan query returns null', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockRpc.mockResolvedValueOnce({ data: 50, error: null });
    // 31 > 30 (free tier limit)
    mockRpc.mockResolvedValueOnce({ data: 31, error: null });
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const result = await checkAndDecrement('user-1');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('free');
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
    expect(mockFrom).toHaveBeenCalledWith('plans');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-xyz');
  });
});
