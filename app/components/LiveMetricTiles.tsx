'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApiKey } from './ApiKeyProvider';
import { MetricTile } from './MetricTile';

interface TelemetryEvent {
  metric_type: string;
  result: Record<string, unknown>;
  created_at: string;
}

const PLACEHOLDER_METRICS = [
  { label: 'Drift Score', value: '—', description: 'Run a drift evaluation to populate', accent: 'from-fuchsia-500/20 via-transparent to-cyan-500/10' },
  { label: 'Pressure', value: '—', description: 'Run a pressure evaluation to populate', accent: 'from-emerald-500/20 via-transparent to-cyan-500/10' },
  { label: 'Verbosity', value: '—', description: 'Run a verbosity evaluation to populate', accent: 'from-blue-500/20 via-transparent to-indigo-500/10' },
  { label: 'Half-Life', value: '—', description: 'Run a half-life evaluation to populate', accent: 'from-amber-500/20 via-transparent to-orange-500/10' },
];

function formatMetric(type: string, result: Record<string, unknown>, timestamp: string) {
  const ago = getTimeAgo(timestamp);

  switch (type) {
    case 'drift': {
      const score = Number(result.score ?? 0);
      const status = String(result.status ?? 'UNKNOWN');
      return {
        label: 'Drift Score',
        value: score.toFixed(3),
        description: status,
        accent: 'from-fuchsia-500/20 via-transparent to-cyan-500/10',
        delta: { label: ago, value: status, direction: score > 0.5 ? 'up' as const : score > 0.25 ? 'flat' as const : 'down' as const },
      };
    }
    case 'pressure': {
      const level = String(result.level ?? 'UNKNOWN');
      return {
        label: 'Pressure',
        value: level,
        description: `Memory: ${result.memoryUsedPercent ?? '?'}%`,
        accent: 'from-emerald-500/20 via-transparent to-cyan-500/10',
        delta: { label: ago, value: level, direction: level === 'CRITICAL' || level === 'HIGH' ? 'up' as const : level === 'LOW' ? 'down' as const : 'flat' as const },
      };
    }
    case 'verbosity': {
      const level = String(result.level ?? 'UNKNOWN');
      const drift = Number(result.driftPercent ?? 0);
      return {
        label: 'Verbosity',
        value: level,
        description: `Drift: ${drift > 0 ? '+' : ''}${drift}%`,
        accent: 'from-blue-500/20 via-transparent to-indigo-500/10',
        delta: { label: ago, value: `${drift}%`, direction: drift > 15 ? 'up' as const : 'flat' as const },
      };
    }
    case 'half-life': {
      const hl = Number(result.estimatedHalfLifeMinutes ?? 0);
      const stability = String(result.stability ?? 'UNKNOWN');
      return {
        label: 'Half-Life',
        value: `${hl}m`,
        description: stability,
        accent: 'from-amber-500/20 via-transparent to-orange-500/10',
        delta: { label: ago, value: stability, direction: stability === 'FRAGILE' ? 'down' as const : stability === 'DECAYING' ? 'flat' as const : 'up' as const },
      };
    }
    default:
      return null;
  }
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function LiveMetricTiles() {
  const { apiKey } = useApiKey();
  const [tiles, setTiles] = useState(PLACEHOLDER_METRICS);

  const fetchLatest = useCallback(async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/telemetry?limit=50', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (data.error || !data.events) return;

      const events = data.events as TelemetryEvent[];

      // Get the most recent event for each metric type
      const latest: Record<string, TelemetryEvent> = {};
      for (const e of events) {
        if (!latest[e.metric_type]) {
          latest[e.metric_type] = e;
        }
      }

      const newTiles = ['drift', 'pressure', 'verbosity', 'half-life'].map((type, i) => {
        const event = latest[type];
        if (!event) return PLACEHOLDER_METRICS[i];
        return formatMetric(type, event.result, event.created_at) ?? PLACEHOLDER_METRICS[i];
      });

      setTiles(newTiles);
    } catch {}
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) { setTiles(PLACEHOLDER_METRICS); return; }
    fetchLatest();
    const interval = setInterval(fetchLatest, 10000);
    return () => clearInterval(interval);
  }, [apiKey, fetchLatest]);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {tiles.map((metric) => (
        <MetricTile key={metric.label} {...metric} />
      ))}
    </section>
  );
}
