'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { getSolanaMintAddress, SOLANA_TOKEN_DECIMALS } from '@/lib/solana-chains';
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
type SolanaToken = 'USDC' | 'USDT';

export default function PayWithSolana({ packId, amountUsd, credits, paymentId, receivingWallet, apiKey, onSuccess, onCancel }: Props) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [selectedToken, setSelectedToken] = useState<SolanaToken>('USDC');
  const [step, setStep] = useState<Step>('select-token');
  const [errorMsg, setErrorMsg] = useState('');
  const [txSignature, setTxSignature] = useState('');

  async function handleSend() {
    if (!publicKey) return;

    setStep('sending');
    try {
      const mint = getSolanaMintAddress(selectedToken);
      const receiverPubkey = new PublicKey(receivingWallet);

      const senderATA = await getAssociatedTokenAddress(mint, publicKey);
      const receiverATA = await getAssociatedTokenAddress(mint, receiverPubkey);

      // Both USDC and USDT use 6 decimals on Solana
      const amount = BigInt(Math.round(amountUsd * (10 ** SOLANA_TOKEN_DECIMALS)));

      const transaction = new Transaction().add(
        createTransferInstruction(senderATA, receiverATA, publicKey, amount),
      );

      const signature = await sendTransaction(transaction, connection);
      setTxSignature(signature);
      setStep('confirming');

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      setStep('done');

      // Confirm with backend
      await confirmWithBackend(signature);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message.slice(0, 200) : String(err));
      setStep('error');
    }
  }

  async function confirmWithBackend(signature: string) {
    try {
      const res = await fetch('/api/v1/purchase/confirm', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, tx_hash: signature }),
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

  if (!connected) {
    return (
      <div className="rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/5 p-6 text-center">
        <p className="text-sm text-slate-300 mb-4">Connect your Phantom wallet to pay with Solana</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-300">
          Pay for {packId} — {credits.toLocaleString()} credits (Solana)
        </p>
        <button onClick={onCancel} className="text-xs text-slate-500 hover:text-white">Cancel</button>
      </div>

      {step === 'select-token' && (
        <>
          <p className="text-sm text-slate-300 mb-3">
            Total: <span className="font-bold text-white">${amountUsd}</span> from{' '}
            <span className="text-fuchsia-300 font-mono text-xs">{publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-4)}</span>
          </p>

          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Token</p>
            <div className="flex gap-2">
              {(['USDC', 'USDT'] as SolanaToken[]).map((token) => (
                <button
                  key={token}
                  onClick={() => setSelectedToken(token)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium border transition ${
                    selectedToken === token
                      ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200'
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
            className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 py-3 text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(255,0,153,0.3)] transition"
          >
            Send ${amountUsd} {selectedToken} on Solana
          </button>
        </>
      )}

      {step === 'sending' && (
        <div className="text-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-300">Confirm transaction in Phantom...</p>
        </div>
      )}

      {step === 'confirming' && (
        <div className="text-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-300">Transaction sent! Waiting for confirmation...</p>
          {txSignature && (
            <p className="mt-1 text-xs text-slate-500 font-mono break-all">{txSignature}</p>
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
            onClick={() => { setStep('select-token'); setErrorMsg(''); }}
            className="text-xs text-fuchsia-400 hover:text-white"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
