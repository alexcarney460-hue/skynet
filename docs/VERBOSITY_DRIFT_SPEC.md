# Verbosity Drift Suppressor — Specification

**Concise. Deterministic. Runtime-optimized.**

---

## Model

### States
- **OPTIMAL** (drift ≤10%) — Output length within baseline
- **DRIFTING** (drift 11-40%) — Output length elevated
- **EXCESSIVE** (drift >40%) — Output verbosity critical

### Token Impact
- **LOW** (<5% of budget wasted) — Acceptable
- **MODERATE** (5-15% wasted) — Monitor
- **HIGH** (>15% wasted) — Intervene

### Correction Policy
- **MINIMAL** — Light touch, suggestions only
- **BALANCED** — Moderate intervention, multiple tactics
- **AGGRESSIVE** — Hard limits, strict enforcement

### Key Metrics
```
avgLength = mean(recent_outputs_tokens)
baseline = expectedBaselineTokens * mode_multiplier
drift% = (avgLength - baseline) / baseline * 100
wasted = total_tokens_generated - (baseline * total_outputs)
```

### Mode Multipliers
- `demo`: 0.9x (forgiving)
- `production`: 1.0x (standard)
- `diagnostic`: 1.3x (verbose expected)

---

## API Contract

### Request (GET)
```
GET /api/v1/verbosity?
  recentOutputLengths=150,160,170,165,180&
  totalOutputs=20&
  totalTokens=3000&
  expectedBaseline=150&
  systemMode=production&
  tokenBudgetTotal=100000&
  tokenBudgetUsed=50000
```

**Parameters:**
| Param | Type | Example |
|-------|------|---------|
| `recentOutputLengths` | CSV | "150,160,170,165,180" |
| `totalOutputs` | int | 20 |
| `totalTokens` | int | 3000 |
| `expectedBaseline` | int | 150 |
| `systemMode` | enum | production |
| `tokenBudgetTotal` | int | 100000 |
| `tokenBudgetUsed` | int | 50000 |

### Request (POST)
```json
POST /api/v1/verbosity
{
  "recentOutputLengthsTokens": [150, 160, 170, 165, 180],
  "totalOutputsThisSession": 20,
  "totalTokensGeneratedThisSession": 3000,
  "expectedBaselineTokensPerOutput": 150,
  "systemMode": "production",
  "tokenBudgetTotal": 100000,
  "tokenBudgetUsed": 50000
}
```

### Response
```json
{
  "timestamp": "2026-02-17T15:35:00Z",
  "assessment": {
    "verbosityState": "DRIFTING",
    "tokenImpact": "MODERATE",
    "correctionPolicy": "BALANCED",
    
    "avgOutputLengthTokens": 173,
    "baselineOutputLengthTokens": 150,
    "driftPercentage": 15,
    "outputCountThisSession": 20,
    "cumulativeWastedTokens": 460,
    
    "recommendations": {
      "truncateOutputAt": 180,
      "reduceDetailLevel": true,
      "skipMetaCommentary": true,
      "usePointForm": false,
      "suppressIntermediateSteps": false,
      "enforceResponseFormat": "default"
    },
    
    "shouldEnforceLimits": false,
    "shouldAlert": false
  }
}
```

---

## Agent Integration

### Decision Tree
```
if shouldAlert:
  enforce_hard_limits()
elif shouldEnforceLimits:
  apply_aggressive_policy()
elif state == DRIFTING:
  apply_balanced_policy()
else:
  continue()
```

### Quick Integration
```typescript
const assessment = await evaluateVerbosity(sessionMetrics);

// Option 1: Enforce limits
if (assessment.shouldEnforceLimits) {
  agent.maxOutputTokens = assessment.recommendations.truncateOutputAt;
}

// Option 2: Apply policy
if (assessment.correctionPolicy === 'AGGRESSIVE') {
  agent.enablePointForm();
  agent.disableReasoning();
}

// Option 3: Alert
if (assessment.shouldAlert) {
  logger.error('Verbosity critical');
}
```

---

## Examples

### Example 1: OPTIMAL (baseline 150, avg 155)
```
State: OPTIMAL (+3.3%)
Impact: LOW
Policy: MINIMAL
Action: continue
```

### Example 2: DRIFTING (baseline 150, avg 195)
```
State: DRIFTING (+30%)
Impact: MODERATE
Policy: BALANCED
Recommendations:
  - Truncate at: 180 tokens
  - Skip meta-commentary
  - Reduce detail level
Action: optimize
```

### Example 3: EXCESSIVE (baseline 150, avg 240)
```
State: EXCESSIVE (+60%)
Impact: HIGH
Policy: AGGRESSIVE
Recommendations:
  - Truncate at: 150 tokens
  - Use point form
  - Suppress intermediate steps
  - Enforce JSON format
Action: enforce
```

---

## CLI Usage

```bash
$ skynet verbosity

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ VERBOSITY ASSESSMENT                           ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Verbosity State       │ DRIFTING             ┃
┃ Token Impact          │ MODERATE             ┃
┃ Correction Policy     │ BALANCED             ┃
┃ Avg Output Length     │ 173 tokens           ┃
┃ Baseline Expected     │ 150 tokens           ┃
┃ Drift                 │ +15%                 ┃
┃ Total Outputs         │ 20                   ┃
┃ Wasted Tokens         │ 460                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ RECOMMENDATIONS                                ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Reduce Detail         │ ✓ YES               ┃
┃ Skip Meta             │ ✓ YES               ┃
┃ Use Point Form        │ ✗ no                ┃
┃ Suppress Steps        │ ✗ no                ┃
┃ Truncate At           │ 180 tokens          ┃
┃ Enforce Limits        │ ✗ no                ┃
┃ Suggested Action      │ OPTIMIZE            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Implementation Files

| File | Size | Purpose |
|------|------|---------|
| `verbosity-drift-suppressor.ts` | 280 lines | Core engine |
| `app/api/v1/verbosity/route.ts` | 110 lines | API endpoint |
| `cli/src/commands/verbosity.ts` | 100 lines | CLI command |
| `VERBOSITY_DRIFT_SPEC.md` | This file | Specification |

---

## Status: ✅ COMPLETE

Deterministic. Fast (<1ms). No network introspection. Runtime-ready.
