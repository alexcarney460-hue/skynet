import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock viem
const mockGetTransactionReceipt = vi.fn();
vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({
    getTransactionReceipt: mockGetTransactionReceipt,
  })),
  http: vi.fn((url: string) => url),
  parseAbiItem: vi.fn((sig: string) => sig),
  formatUnits: vi.fn((value: bigint, decimals: number) => {
    return (Number(value) / Math.pow(10, decimals)).toString();
  }),
}));

vi.mock('viem/chains', () => ({
  mainnet: { id: 1, name: 'Ethereum' },
  base: { id: 8453, name: 'Base' },
  polygon: { id: 137, name: 'Polygon' },
  arbitrum: { id: 42161, name: 'Arbitrum One' },
  bsc: { id: 56, name: 'BNB Smart Chain' },
}));

// Proper 42-char hex addresses (0x + 40 hex chars)
const EXPECTED_WALLET = '0x1111111111111111111111111111111111111111';
const SENDER = '0x2222222222222222222222222222222222222222';
const WRONG_WALLET = '0x3333333333333333333333333333333333333333';

// USDC on mainnet
const MAINNET_USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const BSC_USDC = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d';

vi.mock('../chains', () => ({
  USDC_ADDRESSES: {
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  },
  USDT_ADDRESSES: {
    1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    8453: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    56: '0x55d398326f99059fF775485246999027B3197955',
  },
}));

import { verifyTransaction } from '../verify-tx';

// Helper to pad 20-byte address to 32-byte topic (0x + 64 hex chars)
function toTopic(addr: string): `0x${string}` {
  const clean = addr.toLowerCase().replace('0x', '');
  return `0x${clean.padStart(64, '0')}` as `0x${string}`;
}

function buildReceipt({
  status = 'success' as const,
  tokenAddress = MAINNET_USDC,
  from = SENDER,
  to = EXPECTED_WALLET,
  amount = 100_000_000n, // 100 USDC (6 decimals)
  topicCount = 3,
}: {
  status?: 'success' | 'reverted';
  tokenAddress?: string;
  from?: string;
  to?: string;
  amount?: bigint;
  topicCount?: number;
} = {}) {
  const topics: `0x${string}`[] = [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event sig
  ];
  if (topicCount >= 2) topics.push(toTopic(from));
  if (topicCount >= 3) topics.push(toTopic(to));

  return {
    status,
    logs: [
      {
        address: tokenAddress,
        topics,
        data: `0x${amount.toString(16).padStart(64, '0')}` as `0x${string}`,
      },
    ],
  };
}

describe('verifyTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify a valid USDC transfer on mainnet', async () => {
    mockGetTransactionReceipt.mockResolvedValueOnce(
      buildReceipt({ amount: 100_000_000n }),
    );

    const result = await verifyTransaction('0xabc123def456789012345678901234567890123456789012345678901234abcd' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(true);
    expect(result.chain_id).toBe(1);
    expect(result.token).toBe('USDC');
    expect(result.amount_usd).toBe(100);
  });

  it('should return error when transaction not found on any chain', async () => {
    mockGetTransactionReceipt.mockRejectedValue(new Error('not found'));

    const result = await verifyTransaction('0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('Transaction not found on any supported chain');
  });

  it('should return error when transaction failed on-chain', async () => {
    mockGetTransactionReceipt.mockResolvedValueOnce(buildReceipt({ status: 'reverted' }));

    const result = await verifyTransaction('0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toBe('Transaction failed on-chain');
  });

  it('should reject when recipient does not match', async () => {
    mockGetTransactionReceipt.mockResolvedValueOnce(
      buildReceipt({ to: WRONG_WALLET }),
    );

    const result = await verifyTransaction('0x0000000000000000000000000000000000000000000000000000000000000002' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('does not match expected wallet');
  });

  it('should allow transfers within 1% tolerance', async () => {
    mockGetTransactionReceipt.mockResolvedValueOnce(
      buildReceipt({ amount: 99_500_000n }), // 99.5 USDC
    );

    const result = await verifyTransaction('0x0000000000000000000000000000000000000000000000000000000000000003' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(true);
    expect(result.amount_usd).toBe(99.5);
  });

  it('should reject transfers below 1% tolerance', async () => {
    mockGetTransactionReceipt.mockResolvedValueOnce(
      buildReceipt({ amount: 98_000_000n }), // 98 USDC
    );

    const result = await verifyTransaction('0x0000000000000000000000000000000000000000000000000000000000000004' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('less than expected');
    expect(result.amount_usd).toBe(98);
  });

  it('should reject when token is not USDC/USDT', async () => {
    mockGetTransactionReceipt.mockResolvedValueOnce(
      buildReceipt({ tokenAddress: '0x4444444444444444444444444444444444444444' }),
    );

    const result = await verifyTransaction('0x0000000000000000000000000000000000000000000000000000000000000005' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('no USDC/USDT transfer');
  });

  it('should skip logs with fewer than 3 topics', async () => {
    mockGetTransactionReceipt.mockResolvedValueOnce(
      buildReceipt({ topicCount: 2 }),
    );

    const result = await verifyTransaction('0x0000000000000000000000000000000000000000000000000000000000000006' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('no USDC/USDT transfer');
  });

  it('should handle receipt with no logs', async () => {
    mockGetTransactionReceipt.mockResolvedValueOnce({
      status: 'success',
      logs: [],
    });

    const result = await verifyTransaction('0x0000000000000000000000000000000000000000000000000000000000000007' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('no USDC/USDT transfer');
  });

  it('should try next chain when current chain throws', async () => {
    // Chain order: 1, 56, 137, 8453, 42161
    // Chain 1 (mainnet) throws, chain 56 (BSC) throws, chain 137 (polygon) succeeds
    // Use Polygon USDC address so decimals are correct (6)
    const POLYGON_USDC = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
    mockGetTransactionReceipt
      .mockRejectedValueOnce(new Error('not found'))  // mainnet
      .mockRejectedValueOnce(new Error('not found'))  // bsc
      .mockResolvedValueOnce(buildReceipt({ tokenAddress: POLYGON_USDC, amount: 100_000_000n }));

    const result = await verifyTransaction('0x0000000000000000000000000000000000000000000000000000000000000008' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(true);
    expect(result.chain_id).toBe(137);
  });

  it('should handle zero amount transfer', async () => {
    mockGetTransactionReceipt.mockResolvedValueOnce(
      buildReceipt({ amount: 0n }),
    );

    const result = await verifyTransaction('0x0000000000000000000000000000000000000000000000000000000000000009' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('less than expected');
  });

  it('should handle BSC USDC with 18 decimals', async () => {
    // JS iterates numeric keys in ascending order: 1, 56, 137, 8453, 42161
    // BSC (56) is the 2nd chain tried, so 1 reject then resolve
    mockGetTransactionReceipt
      .mockRejectedValueOnce(new Error('not found')) // mainnet (1)
      .mockResolvedValueOnce(
        buildReceipt({
          tokenAddress: BSC_USDC,
          amount: 100_000_000_000_000_000_000n, // 100 * 10^18
        }),
      );

    const result = await verifyTransaction('0x000000000000000000000000000000000000000000000000000000000000000a' as `0x${string}`, EXPECTED_WALLET, 100);

    expect(result.verified).toBe(true);
    expect(result.amount_usd).toBe(100);
    expect(result.chain_id).toBe(56);
  });

  it('should use case-insensitive address comparison', async () => {
    const mixedCaseWallet = '0xAbCdEf1234567890aBcDeF1234567890AbCdEf12';
    mockGetTransactionReceipt.mockResolvedValueOnce(
      buildReceipt({ to: mixedCaseWallet, amount: 100_000_000n }),
    );

    const result = await verifyTransaction(
      '0x000000000000000000000000000000000000000000000000000000000000000b' as `0x${string}`,
      mixedCaseWallet,
      100,
    );

    expect(result.verified).toBe(true);
  });
});
