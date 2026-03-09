'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApiKey } from './ApiKeyProvider';

interface Alert {
  metric: string;
  status: string;
  agent: string | null;
  time: string;
  recommendations: string[];
  result: Record<string, unknown>;
  input: Record<string, unknown>;
}

const statusStyles: Record<string, string> = {
  CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  FRAGILE: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  AT_RISK: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  HIGH: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  DECAYING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  WARNING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  EXCESSIVE: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const metricLabels: Record<string, string> = {
  drift: 'Drift Detection',
  pressure: 'Context Pressure',
  verbosity: 'Verbosity Control',
  'half-life': 'Session Half-Life',
  compress: 'Compression',
  'circuit-breaker': 'Circuit Breaker',
};

const fieldLabels: Record<string, string> = {
  score: 'Drift Score',
  memoryUsedPercent: 'Memory Used',
  tokenBurnRate: 'Token Burn Rate',
  tokenBurnRatePerMin: 'Burn Rate/min',
  contextDriftPercent: 'Context Drift',
  sessionAgeMinutes: 'Session Age',
  sessionAgeSeconds: 'Session Age',
  level: 'Level',
  status: 'Status',
  stability: 'Stability',
  driftPercent: 'Verbosity Drift',
  avgOutputLength: 'Avg Output Length',
  expectedBaseline: 'Expected Baseline',
  estimatedHalfLifeMinutes: 'Est. Half-Life',
  minutesUntilExhaustion: 'Time Until Exhaustion',
  tokenBudgetUsed: 'Tokens Used',
  tokenBudgetTotal: 'Token Budget',
  tokenRemaining: 'Tokens Remaining',
  tokenTotal: 'Token Total',
  memoryPressure: 'Memory Pressure',
  contextDrift: 'Context Drift',
  errors: 'Errors',
};

function formatValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (key.includes('Percent') || key.includes('Drift') || key === 'memoryPressure' || key === 'contextDrift') return `${val}%`;
    if (key.includes('Minutes') || key === 'sessionAgeMinutes') return `${val} min`;
    if (key.includes('Seconds') || key === 'sessionAgeSeconds') return `${Math.round(val / 60)} min`;
    return val.toLocaleString();
  }
  return String(val);
}

export function AlertFeed() {
  const { apiKey } = useApiKey();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/telemetry/stats', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (!data.error) setAlerts(data.alerts ?? []);
    } catch {}
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) { setAlerts([]); return; }
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [apiKey, fetchAlerts]);

  if (!apiKey) return null;

  // Fields to hide from the detail view (shown elsewhere or internal)
  const hideFields = new Set(['recommendations', 'timestamp', '_credits']);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Recent Alerts</p>

      {alerts.length === 0 ? (
        <div className="mt-6 text-center">
          <p className="text-2xl">&#10003;</p>
          <p className="mt-2 text-sm text-emerald-400">All clear</p>
          <p className="text-xs text-slate-600 mt-1">No critical or warning events in the last 7 days</p>
        </div>
      ) : (
        <div className="mt-4 max-h-[500px] overflow-auto space-y-2">
          {alerts.map((a, i) => {
            const style = statusStyles[String(a.status)] ?? 'bg-white/10 text-slate-300 border-white/10';
            const isExpanded = expanded === i;

            return (
              <div
                key={i}
                className={`rounded-xl border transition-colors cursor-pointer ${
                  isExpanded ? 'border-white/20 bg-white/[0.03]' : style.split(' ').pop()
                }`}
                onClick={() => setExpanded(isExpanded ? null : i)}
              >
                {/* Header row */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold border ${style}`}>
                      {String(a.status)}
                    </span>
                    <span className="text-xs text-slate-300">{metricLabels[a.metric] ?? a.metric}</span>
                    {a.agent && (
                      <span className="text-[0.6rem] text-slate-500 bg-white/5 rounded px-1.5 py-0.5">{a.agent}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6rem] text-slate-600">
                      {new Date(a.time).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[0.6rem] text-slate-600">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    {/* Recommendations */}
                    {a.recommendations.length > 0 && (
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-600 mb-2">Recommendations</p>
                        <ul className="space-y-1">
                          {a.recommendations.map((r, j) => (
                            <li key={j} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-amber-400 mt-0.5">&#9679;</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Input values */}
                    {a.input && Object.keys(a.input).length > 0 && (
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-600 mb-2">Input Values</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(a.input).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-xs">
                              <span className="text-slate-500">{fieldLabels[k] ?? k}</span>
                              <span className="text-slate-300">{formatValue(k, v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Result values */}
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-600 mb-2">Result</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {Object.entries(a.result)
                          .filter(([k]) => !hideFields.has(k) && typeof a.result[k] !== 'object')
                          .map(([k, v]) => (
                            <div key={k} className="flex justify-between text-xs">
                              <span className="text-slate-500">{fieldLabels[k] ?? k}</span>
                              <span className="text-slate-300 font-medium">{formatValue(k, v)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
