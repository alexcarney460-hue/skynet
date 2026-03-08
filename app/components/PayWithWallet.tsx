'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SUPPORTED_CHAINS, getTokenAddress, getChainName, ERC20_ABI, TokenType } from '@/lib/chains';
import { PackId } from '@/lib/plans';

interface Props {
  packId: PackId;
  amountUsd: number;
  credits: number;
  paymentId: string;
  receivingWallet: string;
  apiKey: string;
  onSuccess: (creditsAdded: number, newBalance: number) => void;
  onCancel: () => void;
}

type Step = 'select-token' | 'sending' | 'confirming' | 'done' | 'error';

export default function PayWithWallet({ packId, amountUsd, credits, paymentId, receivingWallet, apiKey, onSuccess, onCancel }: Props) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [selectedToken, setSelectedToken] = useState<TokenType>('USDC');
  const [selectedChain, setSelectedChain] = useState<number>(SUPPORTED_CHAINS[0].id);
  const [step, setStep] = useState<Step>('select-token');
  const [errorMsg, setErrorMsg] = useState('');
  const confirmedRef = useRef(false);

  const { writeContract, data: txHash, isPending: isSending } = useWriteContract({
    mutation: {
      onSuccess: () => setStep('confirming'),
      onError: (err) => {
        setErrorMsg(err.message.slice(0, 200));
        setStep('error');
      },
    },
  });

  const { isLoading: isWaiting, isSuccess: txConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
    },
  });

  // Use useEffect to handle tx confirmation — avoids side effects during render
  useEffect(() => {
    if (txConfirmed && step === 'confirming' && txHash && !confirmedRef.current) {
      confirmedRef.current = true;
      setStep('done');
      confirmWithBackend(txHash);
    }
  }, [txConfirmed, step, txHash]);

  async function confirmWithBackend(hash: string) {
    try {
      const res = await fetch('/api/v1/purchase/confirm', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, tx_hash: hash }),
      });
      const d = await res.json();
      if (d.error) {
        setErrorMsg(d.error);
        setStep('error');
      } else {
        onSuccess(d.credits_added, d.new_balance);
      }
    } catch (err) {
      setErrorMsg(String(err));
      setStep('error');
    }
  }

  async function handleSend() {
    const tokenAddr = getTokenAddress(selectedChain, selectedToken);
    if (!tokenAddr || !receivingWallet) {
      setErrorMsg('Token not available on this chain or wallet not configured');
      setStep('error');
      return;
    }

    // Switch chain if needed
    if (chainId !== selectedChain) {
      try {
        await switchChain({ chainId: selectedChain });
      } catch {
        setErrorMsg('Failed to switch network. Please switch manually in your wallet.');
        setStep('error');
        return;
      }
    }

    setStep('sending');

    // Both USDC and USDT use 6 decimals on all supported chains
    const amount = parseUnits(amountUsd.toString(), 6);

    writeContract({
      address: tokenAddr,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [receivingWallet as `0x${string}`, amount],
    });
  }

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-6 text-center">
        <p className="text-sm text-slate-300 mb-4">Connect your wallet to pay with crypto</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
          Pay for {packId} — {credits.toLocaleString()} credits
        </p>
        <button onClick={onCancel} className="text-xs text-slate-500 hover:text-white">Cancel</button>
      </div>

      {step === 'select-token' && (
        <>
          <p className="text-sm text-slate-300 mb-3">
            Total: <span className="font-bold text-white">${amountUsd}</span> from{' '}
            <span className="text-cyan-300 font-mono text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </p>

          {/* Chain selector */}
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-2">Network</p>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => setSelectedChain(chain.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                    selectedChain === chain.id
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {chain.name}
                </button>
              ))}
            </div>
          </div>

          {/* Token selector */}
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Token</p>
            <div className="flex gap-2">
              {(['USDC', 'USDT'] as TokenType[]).map((token) => (
                <button
                  key={token}
                  onClick={() => setSelectedToken(token)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium border transition ${
                    selectedToken === token
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {token}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSend}
            className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 py-3 text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(0,214,255,0.3)] transition"
          >
            Send ${amountUsd} {selectedToken} on {getChainName(selectedChain)}
          </button>
        </>
      )}

      {step === 'sending' && (
        <div className="text-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-300">Confirm transaction in your wallet...</p>
        </div>
      )}

      {step === 'confirming' && (
        <div className="text-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-300">Transaction sent! Waiting for confirmation...</p>
          {txHash && (
            <p className="mt-1 text-xs text-slate-500 font-mono break-all">{txHash}</p>
          )}
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-4">
          <p className="text-sm text-emerald-400">Payment confirmed! Credits being added...</p>
        </div>
      )}

      {step === 'error' && (
        <div className="py-4">
          <p className="text-sm text-rose-400 mb-3">{errorMsg}</p>
          <button
            onClick={() => { setStep('select-token'); setErrorMsg(''); confirmedRef.current = false; }}
            className="text-xs text-cyan-400 hover:text-white"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
