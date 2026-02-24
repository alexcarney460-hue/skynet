# A3 — Phase 2 Cognitive Benchmark: Half‑Life Gate (matrix)

**When**: 2026-02-23T10:02Z  
**Endpoint**: `POST http://localhost:3001/api/v1/half-life`

## Payload matrix → observed outputs

| Case | sessionAge (min) | interactions | avgLatency (ms) | estHalfLife (min) | stability | minutesUntilExhaustion | recommendations |
|---|---:|---:|---:|---:|---|---:|---|
| Fresh/low load | 5.0 | 3 | 120 | 3 | FRAGILE | 5 | URGENT: Session ending soon; checkpoint immediately |
| 10min/normal | 10.0 | 8 | 200 | 6 | FRAGILE | 10 | URGENT: Session ending soon; checkpoint immediately |
| 30min/normal | 30.0 | 15 | 200 | 18 | DECAYING | 30 | Stability declining; prepare for graceful shutdown |
| 60min/high latency | 60.0 | 30 | 600 | 35 | STABLE | 60 |  |
| 90min/high interactions | 90.0 | 60 | 250 | 53 | STABLE | 90 |  |
| 120min/extreme | 120.0 | 120 | 900 | 71 | STABLE | 120 |  |

## Notes / anomalies
- The gate reports **FRAGILE** at low session age (5–10 minutes) even with low interaction count + low latency, then trends **more stable** as session age increases. This is counterintuitive if the intent is “stability declines with age.”
- If this is intended (e.g., early-session volatility / warm-up) it should be documented in `SESSION_HALF_LIFE_SUMMARY.md` / API docs; otherwise it may indicate an inverted or mis-scaled heuristic.

## Raw generator
- Script used: `workspace/tmp/half_life_matrix.js`
