'use client';

import { useState } from 'react';
import { useApiKey } from './ApiKeyProvider';

const ENDPOINTS = [
  {
    id: 'drift',
    label: 'Drift Detection',
    desc: 'Check if your agent is wandering off-task',
    fields: [
      { key: 'memoryUsedPercent', label: 'Memory Used (%)', default: '45', help: 'How full is the context window' },
      { key: 'tokenBurnRate', label: 'Token Burn Rate', default: '35', help: 'Tokens consumed per minute' },
      { key: 'contextDriftPercent', label: 'Context Drift (%)', default: '20', help: 'How far from the original topic' },
      { key: 'sessionAgeMinutes', label: 'Session Age (min)', default: '30', help: 'How long the session has been running' },
    ],
  },
  {
    id: 'pressure',
    label: 'Context Pressure',
    desc: 'Is the agent running out of room?',
    fields: [
      { key: 'memoryUsedPercent', label: 'Memory Used (%)', default: '45' },
      { key: 'tokenBurnRatePerMin', label: 'Burn Rate/min', default: '35' },
      { key: 'contextDriftPercent', label: 'Context Drift (%)', default: '20' },
      { key: 'sessionAgeSeconds', label: 'Session Age (sec)', default: '600' },
      { key: 'tokenBudgetTotal', label: 'Token Budget', default: '100000' },
      { key: 'tokenBudgetUsed', label: 'Tokens Used', default: '35000' },
    ],
  },
  {
    id: 'verbosity',
    label: 'Verbosity Control',
    desc: 'Is the agent getting too wordy?',
    fields: [
      { key: 'recentOutputLengths', label: 'Recent Output Lengths', default: '150,160,170,165,180', help: 'Comma-separated token counts' },
      { key: 'expectedBaseline', label: 'Expected Baseline', default: '150', help: 'Target output length' },
      { key: 'tokenBudgetUsed', label: 'Tokens Used', default: '50000' },
      { key: 'tokenBudgetTotal', label: 'Token Budget', default: '100000' },
    ],
  },
  {
    id: 'half-life',
    label: 'Session Half-Life',
    desc: 'How much useful time is left?',
    fields: [
      { key: 'sessionAgeMinutes', label: 'Session Age (min)', default: '30' },
      { key: 'memoryPressure', label: 'Memory Pressure', default: '45' },
      { key: 'contextDrift', label: 'Context Drift', default: '25' },
      { key: 'tokenRemaining', label: 'Tokens Remaining', default: '50000' },
      { key: 'tokenTotal', label: 'Token Total', default: '100000' },
      { key: 'errors', label: 'Error Count', default: '0' },
    ],
  },
] as const;

const statusColors: Record<string, string> = {
  OPTIMAL: 'bg-emerald-500/20 text-emerald-300',
  LOW: 'bg-emerald-500/20 text-emerald-300',
  STABLE: 'bg-emerald-500/20 text-emerald-300',
  WARNING: 'bg-amber-500/20 text-amber-300',
  MODERATE: 'bg-amber-500/20 text-amber-300',
  DRIFTING: 'bg-amber-500/20 text-amber-300',
  DECAYING: 'bg-amber-500/20 text-amber-300',
  AT_RISK: 'bg-rose-500/20 text-rose-300',
  HIGH: 'bg-rose-500/20 text-rose-300',
  EXCESSIVE: 'bg-rose-500/20 text-rose-300',
  CRITICAL: 'bg-rose-500/20 text-rose-300',
  FRAGILE: 'bg-rose-500/20 text-rose-300',
};

export function ApiPlayground() {
  const { apiKey } = useApiKey();
  const [selected, setSelected] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(ENDPOINTS[0].fields.map(f => [f.key, f.default]))
  );
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  function switchEndpoint(idx: number) {
    setSelected(idx);
    setFields(Object.fromEntries(ENDPOINTS[idx].fields.map(f => [f.key, f.default])));
    setResult(null);
  }

  async function submit() {
    if (!apiKey) {
      setResult({ error: 'Set your API key above first' });
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v.includes(',')) body[k] = v.split(',').map(Number);
        else body[k] = Number(v);
      }
      const endpoint = ENDPOINTS[selected];
      const res = await fetch(`/api/v1/${endpoint.id}`, {
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

  const endpoint = ENDPOINTS[selected];
  const status = result ? String(result.status ?? result.level ?? result.stability ?? '') : '';
  const statusStyle = statusColors[status] ?? '';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">API Playground</p>
          <p className="mt-1 text-xs text-slate-600">Test endpoints with sample data. Your agents call these programmatically.</p>
        </div>
      </div>

      {/* Endpoint selector */}
      <div className="mt-4 flex flex-wrap gap-2">
        {ENDPOINTS.map((ep, i) => (
          <button
            key={ep.id}
            onClick={() => switchEndpoint(i)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              selected === i
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {ep.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">{endpoint.desc}</p>

      {/* Input fields */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {endpoint.fields.map((f) => (
          <label key={f.key} className="block text-xs">
            <span className="text-slate-400">{f.label}</span>
            <input
              value={fields[f.key] ?? ''}
              onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
        <code className="text-[0.65rem] text-slate-600">POST /api/v1/{endpoint.id}</code>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
          {/* Visual status */}
          {status && (
            <div className="mb-3 flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle}`}>{status}</span>
              {result.score !== undefined && (
                <span className="text-sm text-slate-300">Score: {String(result.score)}</span>
              )}
              {result.estimatedHalfLifeMinutes !== undefined && (
                <span className="text-sm text-slate-300">{String(result.estimatedHalfLifeMinutes)} min remaining</span>
              )}
              {result.driftPercent !== undefined && (
                <span className="text-sm text-slate-300">{Number(result.driftPercent) > 0 ? '+' : ''}{String(result.driftPercent)}% drift</span>
              )}
            </div>
          )}

          {/* Recommendations */}
          {Array.isArray(result.recommendations) && (result.recommendations as string[]).length > 0 && (
            <div className="mb-3">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-600 mb-1">Recommendations</p>
              <ul className="space-y-1">
                {(result.recommendations as string[]).map((r, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">&#9679;</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw JSON */}
          <details className="group">
            <summary className="text-[0.65rem] text-slate-600 cursor-pointer hover:text-slate-400">
              Raw JSON response
            </summary>
            <pre className="mt-2 text-xs text-slate-400 overflow-auto max-h-48">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
