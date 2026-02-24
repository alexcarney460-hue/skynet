# Phase 2 — Track A5 (Metrics / Observability)

This repo had a Phase 2 metrics protocol document, but the running system did not emit actionable, machine-readable metrics.

This track adds **append-only JSONL logging** to the API "gate" endpoints and a **CLI status summary** so Phase 2 runs can be measured (latency + errors + volume) without additional tooling.

## What was added

### 1) JSONL metrics sink (server-side)

- File: `lib/phase2-metrics.ts`
- Emits `Phase2MetricEvent` lines as JSONL.
- Best-effort correlation:
  - `requestId`: from `x-request-id` / `x-correlation-id` headers, else generated.
  - `agentId`: from `x-agent-id` / `x-openclaw-agent-id` (optional)
  - `sessionId`: from `x-session-id` / `x-openclaw-session-id` (optional)

#### Sinks

Configure via env:

- `SKYNET_METRICS_SINK=file|stdout|both|off` (default: `file`)
- `SKYNET_METRICS_LOG_PATH=/absolute/or/relative/path.jsonl`
  - default: `./logs/phase2_metrics.jsonl`

Notes:
- File logging is best for local / long-running processes.
- In serverless (ephemeral FS), prefer `stdout` (still append-only, ingestible by platform logs).

### 2) Gate endpoint instrumentation

Instrumented endpoints (GET + POST where applicable):

- `GET /api/health`
- `/api/v1/pressure`
- `/api/v1/verbosity`
- `/api/v1/drift`
- `/api/v1/half-life`

Each request logs:
- route, method, status
- `latencyMs`
- (when available) protocol-aligned fields like `memoryUsedPercent`, `contextDriftPercent`, `tokenBurnRatePerMin`, `pressureLevelObserved`, `verbosityLevelObserved`, `halfLifeMinutesEstimated`, etc.

Importantly: metrics I/O failures **never fail the API request**.

### 3) CLI summary output

- File: `cli/src/commands/metrics-status.ts`
- Wired into CLI: `skynet metrics status`

Usage:

```bash
skynet metrics status --since 60
skynet metrics status --path logs/phase2_metrics.jsonl --since 15
```

Output includes:
- event count
- error rate
- latency avg/p50/p95/p99
- top routes by traffic

## Mapping to PHASE_2_METRICS_PROTOCOL.md

The protocol calls for **per-response agent metrics** and **session-level rollups**.

This implementation covers the *service-side* portion:
- Gate availability, errors, and latency overhead measurement.

To fully satisfy the protocol, the calling agent loop should also write per-response metrics (tokens, truncation/compression flags, etc.) and then compare baseline vs skynet runs.

## Suggested next step

- Have the OpenClaw middleware pass `x-agent-id` and `x-session-id` + any known per-response fields in request body/headers.
- Add a lightweight post-run aggregator that converts JSONL to per-session CSV/MD reports.
