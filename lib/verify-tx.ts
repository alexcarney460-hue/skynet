import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { mainnet, base, polygon, arbitrum, bsc } from 'viem/chains';
import { USDC_ADDRESSES, USDT_ADDRESSES } from './chains';

const CHAINS = { [mainnet.id]: mainnet, [base.id]: base, [polygon.id]: polygon, [arbitrum.id]: arbitrum, [bsc.id]: bsc };

// Public RPC endpoints (free tier, sufficient for tx verification)
const RPC_URLS: Record<number, string> = {
  [mainnet.id]:  'https://eth.llamarpc.com',
  [base.id]:     'https://mainnet.base.org',
  [polygon.id]:  'https://polygon-rpc.com',
  [arbitrum.id]: 'https://arb1.arbitrum.io/rpc',
  [bsc.id]:      'https://bsc-dataseed.binance.org',
};

// ERC-20 Transfer event signature
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

interface VerifyResult {
  verified: boolean;
  error?: string;
  chain_id?: number;
  from?: string;
  to?: string;
  token?: string;
  amount_usd?: number;
}

// All accepted token addresses (lowercased for comparison)
function getAcceptedTokens(): Set<string> {
  const tokens = new Set<string>();
  for (const addr of Object.values(USDC_ADDRESSES)) tokens.add(addr.toLowerCase());
  for (const addr of Object.values(USDT_ADDRESSES)) tokens.add(addr.toLowerCase());
  return tokens;
}

function getTokenName(address: string): string {
  const lower = address.toLowerCase();
  for (const [, addr] of Object.entries(USDC_ADDRESSES)) {
    if (addr.toLowerCase() === lower) return 'USDC';
  }
  for (const [, addr] of Object.entries(USDT_ADDRESSES)) {
    if (addr.toLowerCase() === lower) return 'USDT';
  }
  return 'UNKNOWN';
}

export async function verifyTransaction(
  txHash: `0x${string}`,
  expectedWallet: string,
  expectedAmountUsd: number,
): Promise<VerifyResult> {
  const acceptedTokens = getAcceptedTokens();
  const expectedTo = expectedWallet.toLowerCase();

  // Try each chain until we find the transaction
  for (const [chainIdStr, chain] of Object.entries(CHAINS)) {
    const chainId = Number(chainIdStr);
    const rpcUrl = RPC_URLS[chainId];
    if (!rpcUrl) continue;

    const client = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    try {
      const receipt = await client.getTransactionReceipt({ hash: txHash });

      if (!receipt) continue;
      if (receipt.status !== 'success') {
        return { verified: false, error: 'Transaction failed on-chain' };
      }

      // Look for ERC-20 Transfer events in logs
      for (const log of receipt.logs) {
        const tokenAddress = log.address.toLowerCase();

        // Check if this is a recognized USDC/USDT contract
        if (!acceptedTokens.has(tokenAddress)) continue;

        // Decode Transfer event
        // Transfer(address from, address to, uint256 value)
        // topic[0] = event sig, topic[1] = from, topic[2] = to
        if (log.topics.length < 3) continue;

        const to = ('0x' + log.topics[2]!.slice(26)).toLowerCase();

        if (to !== expectedTo) {
          return {
            verified: false,
            error: `Transfer recipient ${to} does not match expected wallet ${expectedTo}`,
            chain_id: chainId,
          };
        }

        // Decode amount (uint256 from data)
        const rawAmount = BigInt(log.data);
        // Both USDC and USDT use 6 decimals on all EVM chains
        // except BSC USDC which uses 18 decimals
        const decimals = (chainId === bsc.id && getTokenName(tokenAddress) === 'USDC') ? 18 : 6;
        const amount = Number(formatUnits(rawAmount, decimals));

        // Allow 1% tolerance for price fluctuations
        const tolerance = expectedAmountUsd * 0.01;
        if (amount < expectedAmountUsd - tolerance) {
          return {
            verified: false,
            error: `Transfer amount $${amount.toFixed(2)} is less than expected $${expectedAmountUsd}`,
            chain_id: chainId,
            from: '0x' + log.topics[1]!.slice(26),
            to: expectedTo,
            token: getTokenName(tokenAddress),
            amount_usd: amount,
          };
        }

        return {
          verified: true,
          chain_id: chainId,
          from: '0x' + log.topics[1]!.slice(26),
          to: expectedTo,
          token: getTokenName(tokenAddress),
          amount_usd: amount,
        };
      }

      // Transaction found on this chain but no matching token transfer
      return {
        verified: false,
        error: 'Transaction found but contains no USDC/USDT transfer to the expected wallet',
        chain_id: chainId,
      };

    } catch {
      // Transaction not found on this chain, try next
      continue;
    }
  }

  return { verified: false, error: 'Transaction not found on any supported chain. It may still be pending — try again in a few minutes.' };
}
