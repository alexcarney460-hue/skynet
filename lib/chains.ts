import { mainnet, base, polygon, arbitrum, bsc } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [mainnet, base, polygon, arbitrum, bsc] as const;

// USDC contract addresses per chain
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]:  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  [base.id]:     '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [polygon.id]:  '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  [arbitrum.id]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [bsc.id]:      '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
};

// USDT contract addresses per chain
export const USDT_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]:  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  [base.id]:     '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  [polygon.id]:  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  [arbitrum.id]: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  [bsc.id]:      '0x55d398326f99059fF775485246999027B3197955',
};

// ERC-20 transfer ABI (same for USDC and USDT)
export const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export type TokenType = 'USDC' | 'USDT';

export function getTokenAddress(chainId: number, token: TokenType): `0x${string}` | undefined {
  return token === 'USDC' ? USDC_ADDRESSES[chainId] : USDT_ADDRESSES[chainId];
}

export function getChainName(chainId: number): string {
  const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  return chain?.name ?? `Chain ${chainId}`;
}
