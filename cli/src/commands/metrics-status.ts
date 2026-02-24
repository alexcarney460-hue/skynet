import { createReadStream, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { renderPanel } from '../output/renderer.js';

type Phase2MetricEvent = {
  v: 1;
  ts: string;
  kind: 'gate' | 'error' | 'anomaly';
  requestId: string;
  route: string;
  method: string;
  status: number;
  latencyMs: number;
  agentId?: string;
  sessionId?: string;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export async function metricsStatusCommand(options: {
  path?: string;
  sinceMinutes?: number;
  limit?: number;
}): Promise<string> {
  const path = options.path || process.env.SKYNET_METRICS_LOG_PATH || 'logs/phase2_metrics.jsonl';
  const sinceMinutes = options.sinceMinutes ?? 60;
  const cutoff = Date.now() - sinceMinutes * 60_000;

  if (!existsSync(path)) {
    return renderPanel('PHASE 2 METRICS', [
      { key: 'Log', value: 'MISSING' },
      { key: 'Path', value: path },
      { key: 'Hint', value: 'Set SKYNET_METRICS_LOG_PATH or run the API locally to generate logs.' },
    ]);
  }

  const latencies: number[] = [];
  const byRoute = new Map<string, { count: number; errors: number; latencySum: number }>();

  let total = 0;
  let totalErrors = 0;
  let lastTs: string | null = null;

  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const rawLine of rl) {
    const line = rawLine.startsWith('PHASE2_METRIC ') ? rawLine.slice('PHASE2_METRIC '.length) : rawLine;
    const trimmed = line.trim();
    if (!trimmed) continue;

    let evt: Phase2MetricEvent;
    try {
      evt = JSON.parse(trimmed);
    } catch {
      continue;
    }

    const tsMs = Date.parse(evt.ts);
    if (!Number.isFinite(tsMs) || tsMs < cutoff) continue;

    total++;
    lastTs = evt.ts;

    const routeKey = `${evt.method} ${evt.route}`;
    const bucket = byRoute.get(routeKey) || { count: 0, errors: 0, latencySum: 0 };
    bucket.count += 1;
    bucket.latencySum += evt.latencyMs || 0;

    const isError = evt.kind === 'error' || (evt.status && evt.status >= 500);
    if (isError) {
      totalErrors++;
      bucket.errors += 1;
    }

    byRoute.set(routeKey, bucket);

    if (typeof evt.latencyMs === 'number') latencies.push(evt.latencyMs);
  }

  latencies.sort((a, b) => a - b);

  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);
  const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  const rows: Array<{ key: string; value: string | number | boolean }> = [];
  rows.push({ key: 'Window', value: `Last ${sinceMinutes}m` });
  rows.push({ key: 'Events', value: total });
  rows.push({ key: 'Errors', value: totalErrors });
  rows.push({ key: 'Error Rate', value: total ? `${Math.round((totalErrors / total) * 10_000) / 100}%` : '0%' });
  rows.push({ key: 'Latency avg', value: `${avg}ms` });
  rows.push({ key: 'Latency p50', value: `${p50}ms` });
  rows.push({ key: 'Latency p95', value: `${p95}ms` });
  rows.push({ key: 'Latency p99', value: `${p99}ms` });
  rows.push({ key: 'Last Event', value: lastTs || 'N/A' });
  rows.push({ key: 'Log Path', value: path });

  let output = renderPanel('PHASE 2 METRICS', rows);

  if (byRoute.size > 0) {
    const routeRows: Array<{ key: string; value: string }> = [];
    for (const [route, b] of [...byRoute.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8)) {
      const avgLatency = Math.round(b.latencySum / Math.max(1, b.count));
      routeRows.push({ key: route, value: `${b.count} req | ${b.errors} err | avg ${avgLatency}ms` });
    }

    output += '\n\n' + renderPanel('TOP ROUTES', routeRows);
  }

  return output;
}
