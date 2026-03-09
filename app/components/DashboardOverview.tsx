'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApiKey } from './ApiKeyProvider';

interface Stats {
  totalCalls: number;
  callsToday: number;
  uniqueAgents: number;
  criticalCount: number;
  warningCount: number;
  tokensSaved: number;
  compressCalls: number;
  circuitBreaks: number;
  byMetric: Record<string, number>;
}

export function DashboardOverview() {
  const { apiKey } = useApiKey();
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchStats = useCallback(async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/telemetry/stats', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (!data.error) setStats(data);
    } catch {}
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) { setStats(null); return; }
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [apiKey, fetchStats]);

  if (!apiKey) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-slate-400">Connect your API key above to view your dashboard.</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 animate-pulse">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="mt-3 h-8 w-16 rounded bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  const tiles = [
    {
      label: 'API Calls (7d)',
      value: stats.totalCalls.toLocaleString(),
      sub: `${stats.callsToday} today`,
      color: 'text-white',
      accent: 'bg-cyan-500',
    },
    {
      label: 'Active Agents',
      value: String(stats.uniqueAgents),
      sub: `${Object.keys(stats.byMetric).length} metric types used`,
      color: 'text-white',
      accent: 'bg-emerald-500',
    },
    {
      label: 'Tokens Saved',
      value: stats.tokensSaved > 1000 ? `${(stats.tokensSaved / 1000).toFixed(1)}K` : String(stats.tokensSaved),
      sub: stats.compressCalls > 0 ? `${stats.compressCalls} compression calls` : 'No compression calls yet',
      color: 'text-emerald-400',
      accent: 'bg-emerald-500',
    },
    {
      label: 'Alerts',
      value: String(stats.criticalCount + stats.warningCount),
      sub: stats.criticalCount > 0
        ? `${stats.criticalCount} critical, ${stats.warningCount} warnings`
        : stats.warningCount > 0
        ? `${stats.warningCount} warnings`
        : 'All clear',
      color: stats.criticalCount > 0 ? 'text-rose-400' : stats.warningCount > 0 ? 'text-amber-400' : 'text-emerald-400',
      accent: stats.criticalCount > 0 ? 'bg-rose-500' : stats.warningCount > 0 ? 'bg-amber-500' : 'bg-emerald-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${t.accent}`} />
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t.label}</p>
          </div>
          <p className={`mt-2 text-3xl font-bold ${t.color}`}>{t.value}</p>
          <p className="mt-1 text-xs text-slate-500">{t.sub}</p>
        </div>
      ))}
    </div>
  );
}
