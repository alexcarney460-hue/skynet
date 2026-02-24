import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export type Phase2MetricEvent = {
  v: 1;
  ts: string; // ISO
  kind: 'gate' | 'error' | 'anomaly';

  requestId: string;
  route: string;
  method: string;
  status: number;
  latencyMs: number;

  // Correlation (best-effort)
  agentId?: string;
  sessionId?: string;

  // Phase-2 protocol fields (best-effort; populated when supplied by caller)
  responseLengthChars?: number;
  responseLengthTokens?: number;
  tokenBurnRatePerMin?: number;
  memoryUsedPercent?: number;
  contextDriftPercent?: number;
  sessionAgeSeconds?: number;
  pressureLevelObserved?: string;
  verbosityLevelObserved?: string;
  halfLifeMinutesEstimated?: number;
  responseWasTruncatedBySkynet?: boolean;
  memoryWasCompressedBySkynet?: boolean;

  // Additional useful fields
  systemMode?: string;
  agentProfile?: string;
  error?: { message: string; name?: string };
};

function getSink(): 'off' | 'stdout' | 'file' | 'both' {
  const sink = (process.env.SKYNET_METRICS_SINK || 'file').toLowerCase();
  if (sink === 'off' || sink === 'stdout' || sink === 'file' || sink === 'both') return sink;
  return 'file';
}

export function getPhase2MetricsPath(): string {
  // Default within repo so local dev has an immutable-ish append-only artifact.
  // In serverless environments, filesystem may be ephemeral; set SKYNET_METRICS_SINK=stdout.
  const configured = process.env.SKYNET_METRICS_LOG_PATH;
  if (configured && configured.trim().length > 0) return resolve(configured);
  return resolve(process.cwd(), 'logs', 'phase2_metrics.jsonl');
}

export function getOrCreateRequestId(req: { headers: Headers }): string {
  return (
    req.headers.get('x-request-id') ||
    req.headers.get('x-correlation-id') ||
    randomUUID()
  );
}

export function extractAgentSession(req: { headers: Headers; nextUrl?: URL }): { agentId?: string; sessionId?: string } {
  const agentId = req.headers.get('x-agent-id') || req.headers.get('x-openclaw-agent-id') || undefined;
  const sessionId = req.headers.get('x-session-id') || req.headers.get('x-openclaw-session-id') || undefined;
  return { agentId, sessionId };
}

export async function logPhase2Metric(event: Phase2MetricEvent): Promise<void> {
  const sink = getSink();
  if (sink === 'off') return;

  const line = JSON.stringify(event) + '\n';

  if (sink === 'stdout' || sink === 'both') {
    // stdout is ingestible by most platforms and preserves append-only semantics.
    // Prefix so it can be filtered easily.
    // eslint-disable-next-line no-console
    console.log('PHASE2_METRIC ' + line.trimEnd());
  }

  if (sink === 'file' || sink === 'both') {
    const path = getPhase2MetricsPath();
    try {
      await mkdir(dirname(path), { recursive: true });
      await appendFile(path, line, { encoding: 'utf8' });
    } catch {
      // Never fail the request path due to metrics I/O.
    }
  }
}
