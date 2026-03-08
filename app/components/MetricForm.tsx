'use client';

import { useState } from 'react';

const TABS = ['drift', 'pressure', 'verbosity', 'half-life'] as const;
type Tab = (typeof TABS)[number];

const DEFAULTS: Record<Tab, Record<string, string>> = {
  drift: { memoryUsedPercent: '45', tokenBurnRate: '35', contextDriftPercent: '20', sessionAgeMinutes: '30' },
  pressure: { memoryUsedPercent: '45', tokenBurnRatePerMin: '35', contextDriftPercent: '20', sessionAgeSeconds: '600', tokenBudgetTotal: '100000', tokenBudgetUsed: '35000' },
  verbosity: { recentOutputLengths: '150,160,170,165,180', expectedBaseline: '150', tokenBudgetUsed: '50000', tokenBudgetTotal: '100000' },
  'half-life': { sessionAgeMinutes: '30', memoryPressure: '45', contextDrift: '25', tokenRemaining: '50000', tokenTotal: '100000', errors: '0' },
};

export function MetricForm() {
  const [tab, setTab] = useState<Tab>('drift');
  const [fields, setFields] = useState<Record<string, string>>(DEFAULTS.drift);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  function switchTab(t: Tab) {
    setTab(t);
    setFields(DEFAULTS[t]);
    setResult(null);
  }

  async function submit() {
    setLoading(true);
    try {
      const params = new URLSearchParams(fields);
      const res = await fetch(`/api/v1/${tab}?${params}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#050017]/80 p-6 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Metric Explorer</p>

      <div className="mt-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              tab === t
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(fields).map(([key, val]) => (
          <label key={key} className="block text-xs text-slate-400">
            <span className="mb-1 block">{key}</span>
            <input
              value={val}
              onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </label>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="mt-4 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Evaluating...' : 'Evaluate'}
      </button>

      {result && (
        <pre className="mt-4 max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
