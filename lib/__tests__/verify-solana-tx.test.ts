import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @solana/web3.js
const mockGetTransaction = vi.fn();
vi.mock('@solana/web3.js', () => {
  return {
    Connection: class MockConnection {
      constructor() {}
      getTransaction = mockGetTransaction;
    },
    PublicKey: class MockPublicKey {
      private key: string;
      constructor(key: string) { this.key = key; }
      toBase58() { return this.key; }
    },
  };
});

// Mock solana-chains with stable values
vi.mock('../solana-chains', () => ({
  SOLANA_RPC_URL: 'https://mock-rpc.com',
  SOLANA_USDC_MINT: { toBase58: () => 'USDC_MINT_ADDRESS' },
  SOLANA_USDT_MINT: { toBase58: () => 'USDT_MINT_ADDRESS' },
  SOLANA_TOKEN_DECIMALS: 6,
  getSolanaTokenName: (mint: string) => {
    if (mint === 'USDC_MINT_ADDRESS') return 'USDC';
    if (mint === 'USDT_MINT_ADDRESS') return 'USDT';
    return 'UNKNOWN';
  },
}));

import { verifySolanaTransaction } from '../verify-solana-tx';

const EXPECTED_WALLET = 'WalletReceiverAddress123';
const SENDER_WALLET = 'WalletSenderAddress456';

function buildTx({
  err = null,
  preMint = 'USDC_MINT_ADDRESS',
  postMint = 'USDC_MINT_ADDRESS',
  preOwner = EXPECTED_WALLET,
  postOwner = EXPECTED_WALLET,
  preAmount = 0,
  postAmount = 100,
  preAccountIndex = 1,
  postAccountIndex = 1,
  senderOwner = SENDER_WALLET,
}: {
  err?: unknown;
  preMint?: string;
  postMint?: string;
  preOwner?: string;
  postOwner?: string;
  preAmount?: number;
  postAmount?: number;
  preAccountIndex?: number;
  postAccountIndex?: number;
  senderOwner?: string;
} = {}) {
  return {
    meta: {
      err,
      preTokenBalances: [
        {
          accountIndex: preAccountIndex,
          mint: preMint,
          owner: preOwner,
          uiTokenAmount: { uiAmount: preAmount },
        },
        {
          accountIndex: 2,
          mint: preMint,
          owner: senderOwner,
          uiTokenAmount: { uiAmount: preAmount + postAmount },
        },
      ],
      postTokenBalances: [
        {
          accountIndex: postAccountIndex,
          mint: postMint,
          owner: postOwner,
          uiTokenAmount: { uiAmount: postAmount },
        },
      ],
    },
  };
}

describe('verifySolanaTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify a valid USDC transfer', async () => {
    mockGetTransaction.mockResolvedValue(buildTx({ preAmount: 0, postAmount: 100 }));

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(true);
    expect(result.chain_id).toBe('solana');
    expect(result.token).toBe('USDC');
    expect(result.amount_usd).toBe(100);
    expect(result.to).toBe(EXPECTED_WALLET);
    expect(result.from).toBe(SENDER_WALLET);
  });

  it('should verify a valid USDT transfer', async () => {
    mockGetTransaction.mockResolvedValue(
      buildTx({ preMint: 'USDT_MINT_ADDRESS', postMint: 'USDT_MINT_ADDRESS', postAmount: 50 }),
    );

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 50);

    expect(result.verified).toBe(true);
    expect(result.token).toBe('USDT');
    expect(result.amount_usd).toBe(50);
  });

  it('should return error when transaction is not found', async () => {
    mockGetTransaction.mockResolvedValue(null);

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('Transaction not found');
  });

  it('should return error when transaction failed on-chain', async () => {
    mockGetTransaction.mockResolvedValue(buildTx({ err: { InstructionError: 'something' } }));

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toBe('Transaction failed on-chain');
    expect(result.chain_id).toBe('solana');
  });

  it('should allow transfers within 1% tolerance', async () => {
    // Expected $100, transfer is $99.50 (within 1% = $1 tolerance)
    mockGetTransaction.mockResolvedValue(buildTx({ preAmount: 0, postAmount: 99.5 }));

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(true);
    expect(result.amount_usd).toBe(99.5);
  });

  it('should reject transfers below 1% tolerance', async () => {
    // Expected $100, transfer is $98 (below $99 threshold)
    mockGetTransaction.mockResolvedValue(buildTx({ preAmount: 0, postAmount: 98 }));

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('less than expected');
    expect(result.amount_usd).toBe(98);
  });

  it('should reject when transfer amount is zero', async () => {
    mockGetTransaction.mockResolvedValue(buildTx({ preAmount: 100, postAmount: 100 }));

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    // transferAmount = 100 - 100 = 0, which is <= 0, so it skips and falls through
    expect(result.verified).toBe(false);
    expect(result.error).toContain('no USDC/USDT transfer');
  });

  it('should reject when transfer is negative (withdrawal)', async () => {
    mockGetTransaction.mockResolvedValue(buildTx({ preAmount: 200, postAmount: 100 }));

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    // transferAmount = 100 - 200 = -100, skipped
    expect(result.verified).toBe(false);
    expect(result.error).toContain('no USDC/USDT transfer');
  });

  it('should reject when mint is not USDC/USDT', async () => {
    mockGetTransaction.mockResolvedValue(
      buildTx({ preMint: 'RANDOM_MINT', postMint: 'RANDOM_MINT', postAmount: 100 }),
    );

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('no USDC/USDT transfer');
  });

  it('should reject when recipient is not the expected wallet', async () => {
    mockGetTransaction.mockResolvedValue(
      buildTx({ postOwner: 'SomeOtherWallet', postAmount: 100 }),
    );

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('no USDC/USDT transfer');
  });

  it('should handle RPC errors gracefully', async () => {
    mockGetTransaction.mockRejectedValue(new Error('RPC timeout'));

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('Solana verification error');
    expect(result.error).toContain('RPC timeout');
  });

  it('should handle non-Error thrown objects', async () => {
    mockGetTransaction.mockRejectedValue('string error');

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('Unknown');
  });

  it('should handle missing pre-balance (new token account)', async () => {
    // No matching pre-balance for the account index
    const tx = {
      meta: {
        err: null,
        preTokenBalances: [
          {
            accountIndex: 99, // different index
            mint: 'USDC_MINT_ADDRESS',
            owner: SENDER_WALLET,
            uiTokenAmount: { uiAmount: 500 },
          },
        ],
        postTokenBalances: [
          {
            accountIndex: 1,
            mint: 'USDC_MINT_ADDRESS',
            owner: EXPECTED_WALLET,
            uiTokenAmount: { uiAmount: 100 },
          },
        ],
      },
    };
    mockGetTransaction.mockResolvedValue(tx);

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    // pre is undefined so preAmount = 0, transferAmount = 100
    expect(result.verified).toBe(true);
    expect(result.amount_usd).toBe(100);
  });

  it('should return "unknown" sender when no sender found in pre-balances', async () => {
    const tx = {
      meta: {
        err: null,
        preTokenBalances: [],
        postTokenBalances: [
          {
            accountIndex: 1,
            mint: 'USDC_MINT_ADDRESS',
            owner: EXPECTED_WALLET,
            uiTokenAmount: { uiAmount: 100 },
          },
        ],
      },
    };
    mockGetTransaction.mockResolvedValue(tx);

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(true);
    expect(result.from).toBe('unknown');
  });

  it('should handle transaction with empty token balances', async () => {
    mockGetTransaction.mockResolvedValue({
      meta: { err: null, preTokenBalances: [], postTokenBalances: [] },
    });

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('no USDC/USDT transfer');
  });

  it('should handle transaction with null meta fields', async () => {
    mockGetTransaction.mockResolvedValue({ meta: { err: null } });

    const result = await verifySolanaTransaction('sig123', EXPECTED_WALLET, 100);

    expect(result.verified).toBe(false);
    expect(result.error).toContain('no USDC/USDT transfer');
  });
});
