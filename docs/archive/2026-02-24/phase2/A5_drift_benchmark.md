# A5 — Phase 2 Cognitive Benchmark: Drift Gate (matrix)

**When**: 2026-02-23T09:56Z  
**Endpoint**: `GET http://localhost:3001/api/v1/drift`

## Payload matrix → observed outputs

| Case | memoryUsedPercent | tokenBurnRate | contextDriftPercent | sessionAgeMinutes | driftScore | driftStatus | recommendations |
|---|---:|---:|---:|---:|---:|---|---|
| Low everything (sanity) | 10 | 5 | 0 | 5 | 0.07 | OPTIMAL | (none) |
| Memory-only pressure | 70 | 5 | 0 | 30 | 0.31 | WARNING | Moderate drift; plan for compression |
| Burn-only (normalized @ 50 tok/min) | 10 | 50 | 0 | 30 | 0.34 | WARNING | Moderate drift; plan for compression |
| Context drift-only | 10 | 5 | 80 | 30 | 0.31 | WARNING | Moderate drift; plan for compression |
| Balanced mid (boundary) | 50 | 35 | 30 | 45 | 0.50 | WARNING | Moderate drift; plan for compression |
| Very high combined | 95 | 80 | 90 | 120 | 0.95 | CRITICAL | CRITICAL: Immediate intervention required; Consider session checkpoint or graceful termination |

## Notes / anomalies

- **Threshold boundary behavior**: score `0.50` returns **WARNING**, not **AT_RISK**. This matches the implementation (`AT_RISK` is `> 0.5` not `>= 0.5`). If you want 0.50 to be AT_RISK, adjust comparisons.
- **SessionAgeMinutes currently does not affect score** (it is returned in the response but unused in the calculation). If age is intended to contribute to drift, add a term or document that age is informational.
- **Normalization**: `tokenBurnRate` is capped at `50 tok/min` for scoring (`min(tokenBurnRate/50, 1.0)`), so values above 50 only affect the returned echo fields, not the score.

## Raw generator

- Script used: `workspace/tmp/drift_matrix.js`
