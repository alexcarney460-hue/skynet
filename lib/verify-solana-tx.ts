import { Connection } from '@solana/web3.js';
import { SOLANA_RPC_URL, SOLANA_USDC_MINT, SOLANA_USDT_MINT, SOLANA_TOKEN_DECIMALS, getSolanaTokenName } from './solana-chains';

interface VerifyResult {
  verified: boolean;
  error?: string;
  chain_id?: string;
  from?: string;
  to?: string;
  token?: string;
  amount_usd?: number;
}

const ACCEPTED_MINTS = new Set([
  SOLANA_USDC_MINT.toBase58(),
  SOLANA_USDT_MINT.toBase58(),
]);

export async function verifySolanaTransaction(
  signature: string,
  expectedWallet: string,
  expectedAmountUsd: number,
): Promise<VerifyResult> {
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { verified: false, error: 'Transaction not found on Solana. It may still be pending — try again in a few minutes.' };
    }

    if (tx.meta?.err) {
      return { verified: false, error: 'Transaction failed on-chain', chain_id: 'solana' };
    }

    // Check pre/post token balances for SPL transfer to our wallet
    const preBalances = tx.meta?.preTokenBalances ?? [];
    const postBalances = tx.meta?.postTokenBalances ?? [];

    // Build a map of post-token balances for the receiving wallet
    for (const post of postBalances) {
      if (!post.mint || !ACCEPTED_MINTS.has(post.mint)) continue;
      if (post.owner !== expectedWallet) continue;

      // Find matching pre-balance
      const pre = preBalances.find(
        (p) => p.accountIndex === post.accountIndex && p.mint === post.mint,
      );

      const preAmount = pre?.uiTokenAmount?.uiAmount ?? 0;
      const postAmount = post.uiTokenAmount?.uiAmount ?? 0;
      const transferAmount = postAmount - preAmount;

      if (transferAmount <= 0) continue;

      // Allow 1% tolerance
      const tolerance = expectedAmountUsd * 0.01;
      if (transferAmount < expectedAmountUsd - tolerance) {
        return {
          verified: false,
          error: `Transfer amount $${transferAmount.toFixed(2)} is less than expected $${expectedAmountUsd}`,
          chain_id: 'solana',
          token: getSolanaTokenName(post.mint),
          amount_usd: transferAmount,
        };
      }

      // Find the sender from pre-balances
      const senderEntry = preBalances.find(
        (p) => p.mint === post.mint && p.owner !== expectedWallet && p.owner,
      );

      return {
        verified: true,
        chain_id: 'solana',
        from: senderEntry?.owner ?? 'unknown',
        to: expectedWallet,
        token: getSolanaTokenName(post.mint),
        amount_usd: transferAmount,
      };
    }

    return {
      verified: false,
      error: 'Transaction found but contains no USDC/USDT transfer to the expected wallet',
      chain_id: 'solana',
    };
  } catch (err) {
    return {
      verified: false,
      error: `Solana verification error: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}
