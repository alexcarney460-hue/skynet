# Verbosity Drift Suppressor — Implementation Summary

## What It Does

Detects when agent outputs are growing excessively verbose (drifting from baseline) and recommends corrections to save tokens.

---

## Model (3 States)

| State | Drift | Meaning | Action |
|-------|-------|---------|--------|
| **OPTIMAL** | ≤10% | Within baseline | Continue |
| **DRIFTING** | 11-40% | Elevated verbosity | Optimize |
| **EXCESSIVE** | >40% | Critical verbosity | Enforce |

**Metrics:**
- Average output length (last N outputs)
- Baseline expected (mode-adjusted)
- Drift percentage
- Cumulative wasted tokens

**Token Impact:** LOW (<5%) | MODERATE (5-15%) | HIGH (>15%)

**Correction Policy:** MINIMAL | BALANCED | AGGRESSIVE

---

## API Contract (Concise)

### GET `/api/v1/verbosity`
```
?recentOutputLengths=150,160,170,165,180
&totalOutputs=20
&totalTokens=3000
&expectedBaseline=150
&systemMode=production
&tokenBudgetTotal=100000
&tokenBudgetUsed=50000
```

### POST `/api/v1/verbosity`
```json
{
  "recentOutputLengthsTokens": [150, 160, 170, 165, 180],
  "totalOutputsThisSession": 20,
  "totalTokensGeneratedThisSession": 3000,
  "expectedBaselineTokensPerOutput": 150,
  "systemMode": "production"
}
```

### Response
```json
{
  "assessment": {
    "verbosityState": "DRIFTING",
    "tokenImpact": "MODERATE",
    "correctionPolicy": "BALANCED",
    
    "avgOutputLengthTokens": 173,
    "baselineOutputLengthTokens": 150,
    "driftPercentage": 15,
    "cumulativeWastedTokens": 460,
    
    "recommendations": {
      "truncateOutputAt": 180,
      "reduceDetailLevel": true,
      "skipMetaCommentary": true,
      "usePointForm": false,
      "suppressIntermediateSteps": false
    },
    
    "shouldEnforceLimits": false,
    "shouldAlert": false
  }
}
```

---

## Examples

### OPTIMAL (drift +3%)
```
State: OPTIMAL
Action: continue
```

### DRIFTING (drift +30%)
```
State: DRIFTING (+30%)
Policy: BALANCED
Recommendations:
  ✓ Reduce detail
  ✓ Skip meta-commentary
  → Truncate at 180 tokens
Action: optimize
```

### EXCESSIVE (drift +60%)
```
State: EXCESSIVE (+60%)
Policy: AGGRESSIVE
Recommendations:
  ✓ Reduce detail
  ✓ Skip meta
  ✓ Use point form
  ✓ Suppress steps
  → Truncate at 150 tokens
Action: enforce
```

---

## Key Properties

✅ **Deterministic** — Same inputs = same outputs  
✅ **Fast** — O(1), <1ms per evaluation  
✅ **No network introspection** — Operates on reported metrics only  
✅ **Runtime-optimized** — Lightweight, suitable for frequent checks  
✅ **Mode-aware** — Adjusts baseline for demo/production/diagnostic  
✅ **Actionable** — Clear decision signals for agents

---

## Files

| File | Lines |
|------|-------|
| `verbosity-drift-suppressor.ts` | 280 |
| `app/api/v1/verbosity/route.ts` | 110 |
| `cli/src/commands/verbosity.ts` | 100 |
| `VERBOSITY_DRIFT_SPEC.md` | 200 |
| `VERBOSITY_SUPPRESSOR_SUMMARY.md` | This |

**Total: ~700 lines**

---

## CLI Usage

```bash
$ skynet verbosity

VERBOSITY ASSESSMENT
  Verbosity State: DRIFTING
  Token Impact: MODERATE
  Correction Policy: BALANCED
  Avg Output: 173 tokens
  Baseline: 150 tokens
  Drift: +15%
  Wasted: 460 tokens

RECOMMENDATIONS
  Reduce Detail: ✓ YES
  Skip Meta: ✓ YES
  Truncate At: 180 tokens
  Suggested Action: OPTIMIZE
```

---

## Agent Integration

```typescript
const assessment = await evaluateVerbosity(metrics);

if (assessment.shouldAlert) {
  await terminateSession(); // Excessive + high impact
} else if (assessment.shouldEnforceLimits) {
  agent.maxTokens = assessment.recommendations.truncateOutputAt;
} else if (assessment.verbosityState === 'DRIFTING') {
  applyPolicy(assessment.correctionPolicy);
}
```

---

## Status: ✅ READY

Complete specification, API, CLI, and integration guide.
