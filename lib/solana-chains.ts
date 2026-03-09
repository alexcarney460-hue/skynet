import { PublicKey } from '@solana/web3.js';

export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// SPL token mint addresses on Solana mainnet
export const SOLANA_USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
export const SOLANA_USDT_MINT = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');

// Both USDC and USDT use 6 decimals on Solana
export const SOLANA_TOKEN_DECIMALS = 6;

export function getSolanaMintAddress(token: 'USDC' | 'USDT'): PublicKey {
  return token === 'USDC' ? SOLANA_USDC_MINT : SOLANA_USDT_MINT;
}

export function getSolanaTokenName(mint: string): string {
  if (mint === SOLANA_USDC_MINT.toBase58()) return 'USDC';
  if (mint === SOLANA_USDT_MINT.toBase58()) return 'USDT';
  return 'UNKNOWN';
}
