'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApiKey } from './ApiKeyProvider';

export function CreditBadge() {
  const { apiKey } = useApiKey();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!apiKey) { setCredits(null); return; }
    async function fetch_credits() {
      try {
        const res = await fetch('/api/v1/usage', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const data = await res.json();
        if (!data.error) setCredits(data.credits);
      } catch {}
    }
    fetch_credits();
    const interval = setInterval(fetch_credits, 30000);
    return () => clearInterval(interval);
  }, [apiKey]);

  if (!apiKey || credits === null) return null;

  return (
    <Link
      href="/console/billing"
      className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition hover:bg-white/5 ${
        credits > 100
          ? 'border-white/10 text-slate-300'
          : credits > 0
          ? 'border-amber-400/40 text-amber-300'
          : 'border-rose-400/40 text-rose-300'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${
        credits > 100 ? 'bg-emerald-400' : credits > 0 ? 'bg-amber-400' : 'bg-rose-400'
      }`} />
      {credits.toLocaleString()} credits
    </Link>
  );
}
