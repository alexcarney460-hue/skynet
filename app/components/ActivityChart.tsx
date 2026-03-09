'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApiKey } from './ApiKeyProvider';

interface DayData {
  date: string;
  calls: number;
}

export function ActivityChart() {
  const { apiKey } = useApiKey();
  const [days, setDays] = useState<DayData[]>([]);
  const [byMetric, setByMetric] = useState<Record<string, number>>({});

  const fetchStats = useCallback(async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/telemetry/stats', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (!data.error) {
        setDays(data.dailyVolume ?? []);
        setByMetric(data.byMetric ?? {});
      }
    } catch {}
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) { setDays([]); return; }
    fetchStats();
  }, [apiKey, fetchStats]);

  if (!apiKey) return null;

  const maxCalls = Math.max(...days.map(d => d.calls), 1);
  const totalCalls = days.reduce((sum, d) => sum + d.calls, 0);

  const metricColors: Record<string, string> = {
    drift: 'bg-fuchsia-500',
    pressure: 'bg-cyan-500',
    verbosity: 'bg-violet-500',
    'half-life': 'bg-amber-500',
    compress: 'bg-emerald-500',
    'circuit-breaker': 'bg-rose-500',
    memory: 'bg-blue-500',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">API Calls — Last 7 Days</p>

      {/* Bar chart */}
      <div className="mt-4 flex items-end gap-2 h-32">
        {days.map((d) => {
          const height = maxCalls > 0 ? (d.calls / maxCalls) * 100 : 0;
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[0.6rem] text-slate-500">{d.calls || ''}</span>
              <div className="w-full flex items-end" style={{ height: '100px' }}>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-cyan-500/60 to-fuchsia-500/60 transition-all duration-500"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
              <span className="text-[0.55rem] text-slate-600">
                {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Metric breakdown */}
      {totalCalls > 0 && (
        <div className="mt-6">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-600 mb-2">By Endpoint</p>
          <div className="space-y-1.5">
            {Object.entries(byMetric)
              .sort((a, b) => b[1] - a[1])
              .map(([metric, count]) => {
                const pct = (count / totalCalls) * 100;
                return (
                  <div key={metric} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-slate-400 truncate">{metric}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${metricColors[metric] ?? 'bg-slate-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-10 text-right">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {totalCalls === 0 && (
        <p className="mt-4 text-sm text-slate-500 text-center">No API calls yet this week. Integrate the API to see activity here.</p>
      )}
    </div>
  );
}
