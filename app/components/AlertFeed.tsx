'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApiKey } from './ApiKeyProvider';

interface Alert {
  metric: string;
  status: string;
  agent: string | null;
  time: string;
  recommendations: string[];
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

export function AlertFeed() {
  const { apiKey } = useApiKey();
  const [alerts, setAlerts] = useState<Alert[]>([]);

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
        <div className="mt-4 max-h-80 overflow-auto space-y-2">
          {alerts.map((a, i) => {
            const style = statusStyles[String(a.status)] ?? 'bg-white/10 text-slate-300 border-white/10';
            return (
              <div key={i} className={`rounded-xl border p-3 ${style.split(' ').pop()}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold border ${style}`}>
                      {String(a.status)}
                    </span>
                    <span className="text-xs text-slate-300">{a.metric}</span>
                    {a.agent && <span className="text-[0.6rem] text-slate-500">{a.agent}</span>}
                  </div>
                  <span className="text-[0.6rem] text-slate-600">
                    {new Date(a.time).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {Array.isArray(a.recommendations) && a.recommendations.length > 0 && (
                  <p className="mt-1 text-[0.65rem] text-slate-400 truncate">
                    {(a.recommendations as string[])[0]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
