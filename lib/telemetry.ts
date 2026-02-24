import { access, appendFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';

const TOKEN_USAGE_HEADER = 'timestamp,route,method,request_bytes,response_bytes,approx_tokens_in,approx_tokens_out,agent,sessionId,status,latency_ms';

export type TokenUsageRecord = {
  route: string;
  method: string;
  requestBytes: number;
  responseBytes: number;
  approxTokensIn: number;
  approxTokensOut: number;
  agent?: string;
  sessionId?: string;
  status: number;
  latencyMs: number;
};

export type DriftMetricRecord = {
  route: string;
  method: string;
  status: number;
  latencyMs: number;
  payload: Record<string, unknown>;
};

function resolveLogPath(relative: string): string {
  return resolve(process.cwd(), 'logs', relative);
}

async function ensureFile(path: string, header?: string): Promise<void> {
  try {
    await access(path, constants.F_OK);
    if (header) {
      const stats = await stat(path);
      if (stats.size === 0) {
        await appendFile(path, header + '\n', 'utf8');
      }
    }
  } catch {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, header ? header + '\n' : '', 'utf8');
  }
}

export async function appendTokenUsage(record: TokenUsageRecord): Promise<void> {
  const path = resolveLogPath('token_usage_utf8.log');
  await ensureFile(path, TOKEN_USAGE_HEADER);

  const line = [
    new Date().toISOString(),
    record.route,
    record.method,
    record.requestBytes,
    record.responseBytes,
    record.approxTokensIn,
    record.approxTokensOut,
    record.agent ?? '',
    record.sessionId ?? '',
    record.status,
    record.latencyMs,
  ].join(',');

  await appendFile(path, line + '\n', 'utf8');
}

export async function appendDriftMetric(record: DriftMetricRecord): Promise<void> {
  const path = resolveLogPath('drift_metrics.jsonl');
  await ensureFile(path);
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    route: record.route,
    method: record.method,
    status: record.status,
    latencyMs: record.latencyMs,
    payload: record.payload,
  });
  await appendFile(path, line + '\n', 'utf8');
}
