# Drift Detection Layer

## Overview

The drift detection layer enhances `skynet status` with deterministic simulation of system drift conditions. No randomness. No API calls. Pure simulation based on current system mode, session age, and context utilization.

## State Model

### Four Drift States

| State | Coherence | Description | Color |
|-------|-----------|-------------|-------|
| **OPTIMAL** | 85-100 | System performing at baseline. All metrics green. | 🟢 Green |
| **STABLE** | 70-84 | Normal operation with moderate drift. Acceptable. | 🔵 Cyan |
| **DEGRADED** | 50-69 | Elevated drift. Optimization recommended. | 🟡 Yellow |
| **AT_RISK** | <50 | Critical drift. Immediate intervention required. | 🔴 Red |

## Metrics

Each drift detection returns five metrics:

### 1. Context Drift (0-100%)
- **Definition**: Deviation from optimal session coherence baseline
- **Formula**: `(sessionAge / 3600) * (contextUsage / 50) * modeAccel * 25`
- **Influenced by**:
  - Session age (longer = more drift)
  - Context window utilization (higher = faster drift)
  - System mode (demo < production < diagnostic)

### 2. Token Burn Rate (t/min)
- **Definition**: Simulated tokens consumed per minute
- **Base rates by mode**:
  - Demo: 15 t/min + drift acceleration
  - Production: 35 t/min + drift acceleration
  - Diagnostic: 80 t/min + drift acceleration
- **Critical threshold**: >80 t/min in production mode triggers warning

### 3. Coherence Score (0-100)
- **Definition**: Overall system coherence (inverse of drift + memory pressure)
- **Formula**: `100 - contextDrift - (memoryPressure * 0.3)`
- **Determines state**: Score thresholds map directly to drift states

### 4. Memory Pressure (0-100%)
- **Definition**: Context window utilization + drift impact
- **Formula**: `contextUsage + (contextDrift * 0.5)`
- **Critical threshold**: >80% triggers memory warning

### 5. System Mode
- **demo**: Slow drift (0.3x multiplier) — forgiving for testing
- **production**: Normal drift (1.0x multiplier) — standard operation
- **diagnostic**: Fast drift (1.5x multiplier) — intensive analysis mode

## Warnings System

### Automatic Warnings

Generated when thresholds are crossed:

1. **Memory Pressure Critical** (>80%)
   ```
   MEMORY PRESSURE CRITICAL — context window near saturation
   ```

2. **High Memory Pressure** (>65%)
   ```
   High memory pressure — consider compression
   ```

3. **Drift Detected** (>75%)
   ```
   DRIFT CONDITIONS DETECTED — session coherence degrading
   ```

4. **Elevated Drift** (>50%)
   ```
   Elevated drift — optimization recommended
   ```

5. **High Token Burn** (>80 t/min in production)
   ```
   Token burn rate elevated — check diagnostic intensity
   ```

6. **At Risk** (State = AT_RISK)
   ```
   ⚠️  SYSTEM AT RISK — immediate intervention required
   ```

## Output Examples

### Example 1: OPTIMAL State (Demo Mode)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ SYSTEM STATUS                                                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Registry State       │ INDEXED                                  ┃
┃ Artifacts Online    │ 6                                        ┃
┃ Auth State          │ AUTHENTICATED                            ┃
┃ User ID             │ a1b2c3d4...                             ┃
┃ Full Unlock         │ false                                    ┃
┃ Unlocked Artifacts  │ 2                                        ┃
┃ System State        │ OPTIMAL                                  ┃
┃ Context Drift       │ 5%                                       ┃
┃ Token Efficiency    │ 18.2 t/min                              ┃
┃ Coherence Score     │ 92/100                                   ┃
┃ Memory Pressure     │ 38%                                      ┃
┃ API Version         │ v1.0                                     ┃
┃ CLI Version         │ 1.0.0                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Example 2: STABLE State (Production Mode, 15min session)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ SYSTEM STATUS                                                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Registry State       │ INDEXED                                  ┃
┃ Artifacts Online    │ 6                                        ┃
┃ Auth State          │ AUTHENTICATED                            ┃
┃ User ID             │ x9y8z7w6...                             ┃
┃ Full Unlock         │ true                                     ┃
┃ Unlocked Artifacts  │ 6                                        ┃
┃ System State        │ STABLE                                   ┃
┃ Context Drift       │ 18%                                      ┃
┃ Token Efficiency    │ 38.5 t/min                              ┃
┃ Coherence Score     │ 74/100                                   ┃
┃ Memory Pressure     │ 54%                                      ┃
┃ API Version         │ v1.0                                     ┃
┃ CLI Version         │ 1.0.0                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ WARNINGS                                                         ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Count               │ 1                                        ┃
┃ →                   │ Elevated drift — optimization recommended ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Example 3: DEGRADED State (Production Mode, 45min session, 75% context used)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ SYSTEM STATUS                                                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Registry State       │ INDEXED                                  ┃
┃ Artifacts Online    │ 6                                        ┃
┃ Auth State          │ AUTHENTICATED                            ┃
┃ User ID             │ m5n4o3p2...                             ┃
┃ Full Unlock         │ true                                     ┃
┃ Unlocked Artifacts  │ 6                                        ┃
┃ System State        │ DEGRADED                                 ┃
┃ Context Drift       │ 56%                                      ┃
┃ Token Efficiency    │ 62.8 t/min                              ┃
┃ Coherence Score     │ 63/100                                   ┃
┃ Memory Pressure     │ 75%                                      ┃
┃ API Version         │ v1.0                                     ┃
┃ CLI Version         │ 1.0.0                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ WARNINGS                                                         ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Count               │ 2                                        ┃
┃ →                   │ High memory pressure — consider compression ┃
┃ →                   │ DRIFT CONDITIONS DETECTED — coherence degrading ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Example 4: AT_RISK State (Production Mode, 90min session, 85% context used)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ SYSTEM STATUS                                                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Registry State       │ INDEXED                                  ┃
┃ Artifacts Online    │ 6                                        ┃
┃ Auth State          │ AUTHENTICATED                            ┃
┃ User ID             │ q1r2s3t4...                             ┃
┃ Full Unlock         │ true                                     ┃
┃ Unlocked Artifacts  │ 6                                        ┃
┃ System State        │ AT_RISK                                  ┃
┃ Context Drift       │ 82%                                      ┃
┃ Token Efficiency    │ 95.3 t/min                              ┃
┃ Coherence Score     │ 38/100                                   ┃
┃ Memory Pressure     │ 89%                                      ┃
┃ API Version         │ v1.0                                     ┃
┃ CLI Version         │ 1.0.0                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ WARNINGS                                                         ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Count               │ 4                                        ┃
┃ →                   │ MEMORY PRESSURE CRITICAL — saturation   ┃
┃ →                   │ DRIFT CONDITIONS DETECTED — coherence    ┃
┃ →                   │ Token burn rate elevated                 ┃
┃ →                   │ ⚠️  SYSTEM AT RISK — intervention req.   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Integration

### In `skynet status`
```bash
$ skynet status
# Shows: System State, Context Drift, Token Efficiency, Coherence Score, Memory Pressure
# If warnings: Appends WARNINGS panel below
```

### In Other Commands
Drift detection can be integrated into:
- `skynet analyze session` — Include drift metrics in analysis
- `skynet optimize tokens` — Recommend optimizations based on state
- `skynet compress session` — Trigger auto-compression at DEGRADED threshold

## Implementation Details

### Deterministic Calculation
- No `Math.random()`
- Uses `Date.now()` for timestamp-based variation
- Same inputs → same outputs (reproducible)
- Progressive drift (longer sessions = higher drift)

### System Mode Impact
- **demo**: 0.3x drift multiplier (slow, forgiving)
- **production**: 1.0x drift multiplier (standard)
- **diagnostic**: 1.5x drift multiplier (aggressive)

### Files Modified
- `cli/src/output/drift-detector.ts` — Core detection engine
- `cli/src/commands/status.ts` — Integrated into status output

### No External Dependencies
- Pure TypeScript
- No npm packages required
- ANSI color codes only
