'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CREDIT_PACKS, PackId } from '@/lib/plans';
import PayWithWallet from '@/app/components/PayWithWallet';
import PayWithSolana from '@/app/components/PayWithSolana';

interface Payment {
  id: string;
  pack: string;
  credits_added: number;
  amount_usd: number;
  tx_hash: string | null;
  status: string;
  created_at: string;
}

interface UsageData {
  credits: number;
  totalPurchased: number;
  payments: Payment[];
}

type NetworkType = 'evm' | 'solana';

interface PurchaseState {
  paymentId: string;
  packId: PackId;
  amountUsd: number;
  credits: number;
  wallet: string;
  solanaWallet?: string;
  network: NetworkType;
}

export default function BillingPage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [purchase, setPurchase] = useState<PurchaseState | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('evm');

  useEffect(() => {
    const stored = localStorage.getItem('skynetx_api_key');
    if (stored) {
      setApiKey(stored);
      fetchUsage(stored);
    }
  }, []);

  async function fetchUsage(key: string) {
    try {
      const res = await fetch('/api/v1/usage', {
        headers: { Authorization: `Bearer ${key}` },
      });
      const d = await res.json();
      if (d.error) setError(d.error);
      else setData(d);
    } catch (err) {
      setError(String(err));
    }
  }

  async function initPurchase(pack: PackId) {
    setPurchase(null);
    setSuccessMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/v1/purchase', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack, network: selectedNetwork }),
      });
      const d = await res.json();
      if (d.error) setError(d.error);
      else setPurchase({
        paymentId: d.payment_id,
        packId: pack,
        amountUsd: d.amount_usd,
        credits: d.credits,
        wallet: d.wallet,
        solanaWallet: d.solana_wallet,
        network: selectedNetwork,
      });
    } catch (err) {
      setError(String(err));
    }
  }

  function handlePaymentSuccess(creditsAdded: number, newBalance: number) {
    setSuccessMsg(`+${creditsAdded.toLocaleString()} credits added! New balance: ${newBalance.toLocaleString()}`);
    setPurchase(null);
    fetchUsage(apiKey);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030011] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,0,153,0.3),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(0,214,255,0.35),transparent_45%),linear-gradient(120deg,rgba(7,4,54,0.9),rgba(1,1,20,0.95))]" />

      <main className="relative z-10 mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/80">SkynetX</p>
            <h1 className="text-2xl font-semibold text-white">Credits & Billing</h1>
          </div>
          <div className="flex items-center gap-4">
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
            <Link href="/console" className="text-xs text-slate-500 hover:text-white transition">
              Back to Console
            </Link>
          </div>
        </header>

        {!apiKey && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <p className="text-slate-400">Connect your API key in the console first.</p>
            <Link href="/console" className="mt-3 inline-block text-sm text-cyan-400">Go to Console</Link>
          </div>
        )}

        {error && <p className="text-sm text-rose-400">{error}</p>}
        {successMsg && <p className="text-sm text-emerald-400">{successMsg}</p>}

        {data && (
          <>
            {/* Credit Balance */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Credit Balance</p>
              <div className="mt-2 flex items-end gap-3">
                <span className={`text-4xl font-bold ${data.credits > 100 ? 'text-white' : data.credits > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {data.credits.toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">credits remaining</span>
              </div>
              {data.credits === 0 && (
                <p className="mt-2 text-sm text-rose-400">No credits left — purchase below to continue using the API.</p>
              )}
              <p className="mt-2 text-xs text-slate-600">
                Total purchased: {data.totalPurchased.toLocaleString()} | 1 API call = 1 credit
              </p>
            </div>

            {/* Buy Credits */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Buy Credits</p>
              <p className="mt-1 text-xs text-slate-600">Pay with USDC or USDT on Ethereum, Base, Polygon, Arbitrum, or Solana</p>

              {/* Network Toggle */}
              <div className="mt-4 flex gap-2">
                {(['evm', 'solana'] as NetworkType[]).map((net) => (
                  <button
                    key={net}
                    onClick={() => setSelectedNetwork(net)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium border transition ${
                      selectedNetwork === net
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {net === 'evm' ? 'EVM (ETH/Base/Polygon/Arb)' : 'Solana (Phantom)'}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {(Object.entries(CREDIT_PACKS) as [PackId, typeof CREDIT_PACKS[PackId]][]).map(([id, pack]) => (
                  <div key={id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <p className="text-lg font-bold text-white capitalize">{id}</p>
                    <p className="text-3xl font-bold text-white">${pack.priceUsd}</p>
                    <p className="mt-1 text-sm text-slate-400">{pack.credits.toLocaleString()} credits</p>
                    <p className="text-xs text-slate-600">${(pack.priceUsd / pack.credits * 1000).toFixed(2)}/1k calls</p>
                    <button
                      onClick={() => initPurchase(id)}
                      className="mt-4 w-full rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 py-2 text-xs font-semibold text-white hover:shadow-[0_0_20px_rgba(0,214,255,0.3)]"
                    >
                      Buy {id}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Wallet Payment Flow */}
            {purchase && purchase.network === 'solana' && purchase.solanaWallet && (
              <PayWithSolana
                packId={purchase.packId}
                amountUsd={purchase.amountUsd}
                credits={purchase.credits}
                paymentId={purchase.paymentId}
                receivingWallet={purchase.solanaWallet}
                apiKey={apiKey}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setPurchase(null)}
              />
            )}
            {purchase && purchase.network === 'evm' && (
              <PayWithWallet
                packId={purchase.packId}
                amountUsd={purchase.amountUsd}
                credits={purchase.credits}
                paymentId={purchase.paymentId}
                receivingWallet={purchase.wallet}
                apiKey={apiKey}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setPurchase(null)}
              />
            )}

            {/* Payment History */}
            {data.payments.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Payment History</p>
                <div className="mt-4 overflow-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
                      <tr>
                        <th className="py-2 pr-3">Date</th>
                        <th className="py-2 pr-3">Pack</th>
                        <th className="py-2 pr-3">Credits</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payments.map((p) => (
                        <tr key={p.id} className="border-t border-white/5">
                          <td className="py-2 pr-3 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="py-2 pr-3 capitalize">{p.pack}</td>
                          <td className="py-2 pr-3">+{p.credits_added.toLocaleString()}</td>
                          <td className="py-2 pr-3">${p.amount_usd}</td>
                          <td className="py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-semibold ${
                              p.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' :
                              p.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                              'bg-rose-500/20 text-rose-300'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
