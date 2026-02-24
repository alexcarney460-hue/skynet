# OpenClaw Skynet Integration Architecture

**Minimal middleware layer for agent cognitive gating. Zero refactoring. Pure signal consumption.**

---

## Integration Architecture

```
OpenClaw Agent Loop
├─ Before Response Generation
│  └─ [GATE 1] Query Skynet verbosity + pressure
│     ├─ If EXCESSIVE → Truncate output
│     ├─ If HIGH pressure → Reduce detail
│     └─ Otherwise → Normal response
│
├─ Before Memory/Context Expansion
│  └─ [GATE 2] Query Skynet pressure + half-life
│     ├─ If CRITICAL → Abort expansion
│     ├─ If HIGH + DECAYING → Trigger compression
│     └─ Otherwise → Proceed with expansion
│
└─ Before Session Continuation
   └─ [GATE 3] Query Skynet drift + half-life
      ├─ If FRAGILE → Prepare checkpoint
      ├─ If DEGRADED → Log warning
      └─ Otherwise → Continue normally
```

---

## Hook Insertion Points (Minimal)

### Hook 1: Response Generation (POST-Planning, PRE-Output)

**Location**: Agent output handler (where responses are serialized)

```typescript
// In: agent.generateResponse(action)
// Existing code path:

const response = agent.plan(steps);
const output = agent.format(response);
// [NEW] Insert here:
const gatedOutput = await skynet.gateResponse(output);
return gatedOutput;
```

**Code insertion**: ~5 lines

### Hook 2: Memory Expansion (PRE-Write)

**Location**: Agent memory/context manager (where new context is committed)

```typescript
// In: memory.writeBlock(block)
// Existing code path:

if (shouldExpand) {
  // [NEW] Insert here:
  const pressure = await skynet.evalPressure();
  if (pressure.level === 'CRITICAL') {
    throw new Error('Cannot expand: critical pressure');
  }
  if (pressure.shouldCompress) {
    memory.compressFirst();
  }
  
  memory.write(block);
}
```

**Code insertion**: ~8 lines

### Hook 3: Session Continuation (PERIODIC, every 30s)

**Location**: Agent heartbeat/checkpoint handler

```typescript
// In: agent.heartbeat()
// Existing code path:

setInterval(async () => {
  // [NEW] Insert here:
  const health = await skynet.checkHealth();
  if (health.shouldTerminate) {
    agent.gracefulShutdown();
  } else if (health.shouldCheckpoint) {
    agent.saveCheckpoint();
  }
  
  // Existing heartbeat logic
  agent.continueSafely();
}, 30000);
```

**Code insertion**: ~10 lines

---

## Minimal Code Strategy

### Gateway Function (Single Source of Truth)

```typescript
// skynet-gateway.ts — Single file, ~80 lines total

import fetch from 'node-fetch';

const ENDPOINT = process.env.SKYNET_ENDPOINT || 'https://skynetx.io/api/v1';
const TIMEOUT = 2000;  // 2 second timeout
const FALLBACK = { safe: true };  // Conservative default

export interface SkynetSignals {
  pressure: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  verbosity: 'OPTIMAL' | 'DRIFTING' | 'EXCESSIVE';
  stability: 'STABLE' | 'DECAYING' | 'FRAGILE';
  
  // Decision signals
  shouldCompress: boolean;
  shouldTruncate: boolean;
  shouldTerminate: boolean;
  shouldCheckpoint: boolean;
}

/**
 * Query Skynet for cognitive signals.
 * Returns safely even if Skynet is unavailable.
 */
export async function getSignals(
  memoryPercent: number,
  tokenBurn: number,
  contextDrift: number,
  sessionAge: number
): Promise<SkynetSignals> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);
    
    const response = await fetch(
      `${ENDPOINT}/pressure`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryUsedPercent: memoryPercent,
          tokenBurnRatePerMin: tokenBurn,
          contextDriftPercent: contextDrift,
          sessionAgeSeconds: sessionAge,
        }),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeout);
    const data = await response.json();
    const p = data.pressure;
    
    return {
      pressure: p.level,
      verbosity: 'OPTIMAL',  // From separate call if needed
      stability: 'STABLE',   // From separate call if needed
      shouldCompress: p.recommendations.shouldCompress,
      shouldTruncate: false,
      shouldTerminate: p.recommendations.shouldTerminate,
      shouldCheckpoint: false,
    };
  } catch (error) {
    // Graceful degradation: continue normally
    console.warn('Skynet unavailable, proceeding safely');
    return {
      pressure: 'MODERATE',
      verbosity: 'OPTIMAL',
      stability: 'STABLE',
      shouldCompress: false,
      shouldTruncate: false,
      shouldTerminate: false,
      shouldCheckpoint: false,
    };
  }
}
```

**Total: 80 lines, single function, zero dependencies**

### Integration Hooks (Minimal Insertion)

**Hook 1: Response Gating (Before Output)**

```typescript
// In agent response handler
export async function gateResponse(
  output: string,
  signals: SkynetSignals
): Promise<string> {
  if (signals.shouldTruncate && output.length > 500) {
    return output.slice(0, 500) + '...';
  }
  return output;
}
```

**Hook 2: Memory Gating (Before Expansion)**

```typescript
// In memory manager
export async function gateMemoryExpansion(
  signals: SkynetSignals
): Promise<'allow' | 'compress' | 'deny'> {
  if (signals.shouldTerminate) return 'deny';
  if (signals.shouldCompress) return 'compress';
  return 'allow';
}
```

**Hook 3: Heartbeat Gating (Periodic)**

```typescript
// In session manager
export async function gateSessionContinuation(
  signals: SkynetSignals
): Promise<'continue' | 'checkpoint' | 'terminate'> {
  if (signals.shouldTerminate) return 'terminate';
  if (signals.shouldCheckpoint) return 'checkpoint';
  return 'continue';
}
```

**Total: 30 lines, three simple functions, pure logic**

---

## Failure Handling Logic

### Principle: Fail-Safe Always

```
Skynet Unavailable?        → Continue normally (MODERATE assumed)
Skynet Timeout (>2s)?      → Continue normally (skip gate)
Skynet Returns Error?      → Log warning, proceed
Network Unreachable?       → Assume MODERATE, proceed
```

### Implementation

```typescript
// Wrapper with automatic fallback

async function safeGate(
  operation: () => Promise<SkynetSignals>,
  fallback: SkynetSignals = { pressure: 'MODERATE', ... }
): Promise<SkynetSignals> {
  try {
    return await Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), TIMEOUT)
      ),
    ]);
  } catch (error) {
    console.warn('Gate failed safely:', error.message);
    return fallback;
  }
}
```

**Result**: Agent always proceeds. Skynet is advisory, never blocking.

---

## Implementation Checklist

### Week 1: Hook Insertion

- [ ] Insert Hook 1 (response gating) — 5 lines
- [ ] Insert Hook 2 (memory gating) — 8 lines
- [ ] Insert Hook 3 (heartbeat gating) — 10 lines
- [ ] Create skynet-gateway.ts — 80 lines
- [ ] Test each hook individually

### Week 1.5: Integration Testing

- [ ] Test with demo agent (no Skynet)
- [ ] Test with Skynet available
- [ ] Test with Skynet timeout
- [ ] Test with Skynet error
- [ ] Measure overhead (<5ms)

### Week 2: Measurement

- [ ] Run 5+ agents with middleware
- [ ] Measure token savings (target: 20%+)
- [ ] Measure stability improvement
- [ ] Measure latency impact (<5ms)
- [ ] Document results

### Week 2.5: Deployment

- [ ] Merge middleware
- [ ] Enable for beta agents
- [ ] Monitor in production
- [ ] Share metrics

---

## Code Organization

```
openclaw-skynet/
├─ middleware/
│  ├─ skynet-gateway.ts          (80 lines, core logic)
│  ├─ hooks/
│  │  ├─ response-gate.ts        (15 lines)
│  │  ├─ memory-gate.ts          (15 lines)
│  │  └─ heartbeat-gate.ts       (15 lines)
│  └─ index.ts                   (10 lines, exports)
├─ integration/
│  ├─ response-handler.patch     (hook insertion)
│  ├─ memory-manager.patch       (hook insertion)
│  └─ session-manager.patch      (hook insertion)
└─ examples/
   ├─ setup.ts                   (how to enable)
   └─ demo-agent.ts              (reference agent)

Total: ~150 lines of new code
Patch size: 23 insertions
Refactoring needed: 0
```

---

## Metrics to Track

### Performance
- Gate latency per call (target: <2ms)
- Total overhead per agent (target: <5ms/30s)
- Success rate (target: 99%+)
- Fallback rate (target: <1%)

### Agent Behavior
- Token savings (target: 20%+)
- Response quality (measure via existing metrics)
- Stability improvement (fewer crashes)
- Memory efficiency (compression triggers)

### Adoption
- Agents enabled
- Pressure signals observed
- Actions triggered (compress, terminate)
- User feedback

---

## Risk Mitigation

### Risk: Skynet Unavailable
**Mitigation**: Fallback to MODERATE + continue
**Impact**: Zero — agents unaffected

### Risk: Gating Too Aggressive
**Mitigation**: Start with MODERATE signals, not CRITICAL
**Impact**: Conservative — may under-gate initially

### Risk: Latency Spikes
**Mitigation**: 2s timeout, async gating
**Impact**: Gate completes in <2ms or skipped

### Risk: Token Waste from Over-Compression
**Mitigation**: Only compress on HIGH, not MODERATE
**Impact**: Intelligent compression, not excessive

---

## Success Definition

**Technical**:
- ✅ <5ms overhead per decision gate
- ✅ 99%+ fallback success rate
- ✅ <23 lines added to core agent code
- ✅ 0 architectural changes

**Operational**:
- ✅ 20%+ token savings on beta agents
- ✅ 80%+ fewer failure states
- ✅ Seamless agent experience (no user changes)
- ✅ Ready to deploy to production

**Business**:
- ✅ Proof of concept for Skynet value
- ✅ Case study for marketing
- ✅ Path to Agent Builder monetization

---

## Deployment Timeline

```
Week 1:     Hook insertion + gateway (150 lines)
Week 1.5:   Integration testing + measurement
Week 2:     Beta rollout (5+ agents)
Week 2.5:   Production deployment
Week 3:     Case study + metrics
Week 4:     Community launch
```

---

## Architecture Principle

**Skynet is a decision signal layer, not a control layer.**

- Agents decide whether to follow signals
- Skynet provides information, not commands
- Failure of Skynet = no impact (fail-safe)
- Success of Skynet = measurable improvements

This ensures OpenClaw stays in control while gaining cognitive intelligence.

---

## Status

✅ **Architecture**: Designed  
✅ **Code strategy**: Minimal (150 lines)  
✅ **Hooks**: 3 insertion points identified  
✅ **Failure handling**: Fail-safe specified  
⏳ **Implementation**: Ready to build (Week 1)  

**Ready for: Pull request → Review → Merge → Test**
