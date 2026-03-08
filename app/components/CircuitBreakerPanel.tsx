'use client';

import { useState } from 'react';
import { useApiKey } from './ApiKeyProvider';

export function CircuitBreakerPanel() {
  const { apiKey } = useApiKey();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  // Editable fields matching the metric input types
  const [driftEnabled, setDriftEnabled] = useState(true);
  const [pressureEnabled, setPressureEnabled] = useState(true);

  const [memoryUsed, setMemoryUsed] = useState('72');
  const [tokenBurnRate, setTokenBurnRate] = useState('45');
  const [contextDrift, setContextDrift] = useState('31');
  const [sessionAge, setSessionAge] = useState('48');

  const [tokenBudgetUsed, setTokenBudgetUsed] = useState('75000');
  const [tokenBudgetTotal, setTokenBudgetTotal] = useState('100000');

  async function evaluate() {
    if (!apiKey) { setResult({ error: 'Set your API key first' }); return; }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};

      if (driftEnabled) {
        body.drift = {
          memoryUsedPercent: Number(memoryUsed),
          tokenBurnRate: Number(tokenBurnRate),
          contextDriftPercent: Number(contextDrift),
          sessionAgeMinutes: Number(sessionAge),
        };
      }

      if (pressureEnabled) {
        body.pressure = {
          memoryUsedPercent: Number(memoryUsed),
          tokenBurnRatePerMin: Number(tokenBurnRate),
          contextDriftPercent: Number(contextDrift),
          sessionAgeSeconds: Number(sessionAge) * 60,
          tokenBudgetTotal: Number(tokenBudgetTotal),
          tokenBudgetUsed: Number(tokenBudgetUsed),
        };
      }

      const res = await fetch('/api/v1/circuit-breaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });
      setResult(await res.json());
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  const halt = result && (result as Record<string, unknown>).halt === true;
  const severity = result ? String((result as Record<string, unknown>).severity) : null;

  return (
    <div className="rounded-3xl border border-white/10 bg-[#050017]/80 p-6 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">Circuit Breaker</p>
      <p className="mt-1 text-xs text-slate-500">Test halt/continue decisions. Free — no credit cost.</p>

      <div className="mt-4 flex gap-4">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={driftEnabled} onChange={(e) => setDriftEnabled(e.target.checked)}
            className="rounded border-white/20" />
          Drift
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={pressureEnabled} onChange={(e) => setPressureEnabled(e.target.checked)}
            className="rounded border-white/20" />
          Pressure
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block text-xs text-slate-400">
          <span className="mb-1 block">Memory Used %</span>
          <input value={memoryUsed} onChange={(e) => setMemoryUsed(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50" />
        </label>
        <label className="block text-xs text-slate-400">
          <span className="mb-1 block">Token Burn Rate</span>
          <input value={tokenBurnRate} onChange={(e) => setTokenBurnRate(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50" />
        </label>
        <label className="block text-xs text-slate-400">
          <span className="mb-1 block">Context Drift %</span>
          <input value={contextDrift} onChange={(e) => setContextDrift(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50" />
        </label>
        <label className="block text-xs text-slate-400">
          <span className="mb-1 block">Session Age (min)</span>
          <input value={sessionAge} onChange={(e) => setSessionAge(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50" />
        </label>
        <label className="block text-xs text-slate-400">
          <span className="mb-1 block">Tokens Used</span>
          <input value={tokenBudgetUsed} onChange={(e) => setTokenBudgetUsed(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50" />
        </label>
        <label className="block text-xs text-slate-400">
          <span className="mb-1 block">Token Budget</span>
          <input value={tokenBudgetTotal} onChange={(e) => setTokenBudgetTotal(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50" />
        </label>
      </div>

      <button
        onClick={evaluate}
        disabled={loading}
        className="mt-4 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Evaluating...' : 'Check Circuit'}
      </button>

      {result && (
        <div className="mt-4">
          {/* Big status indicator */}
          <div className={`mb-3 flex items-center gap-3 rounded-xl border p-4 ${
            halt
              ? 'border-rose-400/40 bg-rose-500/10'
              : 'border-emerald-400/40 bg-emerald-500/10'
          }`}>
            <div className={`h-4 w-4 rounded-full ${halt ? 'bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.8)]' : 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]'}`} />
            <span className={`text-lg font-bold ${halt ? 'text-rose-300' : 'text-emerald-300'}`}>
              {halt ? 'HALT' : 'CONTINUE'}
            </span>
            <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
              severity === 'critical' ? 'bg-rose-500/20 text-rose-300' :
              severity === 'warning' ? 'bg-amber-500/20 text-amber-300' :
              'bg-emerald-500/20 text-emerald-300'
            }`}>
              {severity}
            </span>
          </div>

          <pre className="max-h-48 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
