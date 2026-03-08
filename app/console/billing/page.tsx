'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CREDIT_PACKS, PackId } from '@/lib/plans';

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

interface PurchaseResponse {
  payment_id: string;
  wallet: string;
  amount_usd: number;
  credits: number;
  instructions: string;
}

export default function BillingPage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [purchase, setPurchase] = useState<PurchaseResponse | null>(null);
  const [txHash, setTxHash] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

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
    setConfirmMsg(null);
    try {
      const res = await fetch('/api/v1/purchase', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
      });
      const d = await res.json();
      if (d.error) setError(d.error);
      else setPurchase(d);
    } catch (err) {
      setError(String(err));
    }
  }

  async function confirmPayment() {
    if (!purchase || !txHash) return;
    setConfirming(true);
    try {
      const res = await fetch('/api/v1/purchase/confirm', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: purchase.payment_id, tx_hash: txHash }),
      });
      const d = await res.json();
      if (d.error) setConfirmMsg(d.error);
      else {
        setConfirmMsg(`+${d.credits_added.toLocaleString()} credits added! New balance: ${d.new_balance.toLocaleString()}`);
        setPurchase(null);
        setTxHash('');
        fetchUsage(apiKey);
      }
    } catch (err) {
      setConfirmMsg(String(err));
    } finally {
      setConfirming(false);
    }
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
          <Link href="/console" className="text-xs text-slate-500 hover:text-white transition">
            Back to Console
          </Link>
        </header>

        {!apiKey && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <p className="text-slate-400">Connect your API key in the console first.</p>
            <Link href="/console" className="mt-3 inline-block text-sm text-cyan-400">Go to Console</Link>
          </div>
        )}

        {error && <p className="text-sm text-rose-400">{error}</p>}

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
              <p className="mt-1 text-xs text-slate-600">Pay with USDC, USDT, or SOL</p>

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

            {/* Payment flow */}
            {purchase && (
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-6">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Payment Instructions</p>
                <p className="mt-2 text-sm text-slate-300">
                  Send <span className="font-bold text-white">${purchase.amount_usd}</span> in USDC/USDT/SOL to:
                </p>
                <code className="mt-2 block rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-cyan-300 break-all">
                  {purchase.wallet || 'Wallet not configured — contact support'}
                </code>
                <p className="mt-3 text-sm text-slate-300">After sending, paste your transaction hash:</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Transaction hash..."
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                  <button
                    onClick={confirmPayment}
                    disabled={confirming || !txHash}
                    className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-5 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-50"
                  >
                    {confirming ? 'Confirming...' : 'Confirm Payment'}
                  </button>
                </div>
                {confirmMsg && (
                  <p className={`mt-3 text-sm ${confirmMsg.includes('added') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {confirmMsg}
                  </p>
                )}
              </div>
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
