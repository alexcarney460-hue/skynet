# SKYNET — Agent Cognitive Infrastructure

**Cognitive runtime for autonomous agents. Deterministic stability & efficiency signals.**

---

## What It Is

Skynet is a **cognitive infrastructure layer** providing real-time stability, efficiency, and decay signals for agents running in production. Used by OpenClaw to make runtime decisions: compress, optimize, checkpoint, or gracefully terminate.

**Not an artifact marketplace. Not a CLI tool.**

Instead: **Decision-grade metrics** for agents operating under resource constraints.

---

## Core Capabilities

### 1. Drift Detection Layer
Monitors system state degradation in real-time.
- **States**: OPTIMAL → STABLE → DEGRADED → AT_RISK
- **Metrics**: Context drift, token efficiency, coherence score, memory pressure
- **Use case**: Agent monitors health before expensive operations

### 2. Context Pressure Regulator
Evaluates session survivability & token risk.
- **States**: LOW → MODERATE → HIGH → CRITICAL pressure
- **Signals**: shouldCompress, shouldOptimize, shouldTerminate
- **Use case**: Agent gates work based on resource pressure

### 3. Verbosity Drift Suppressor
Detects and corrects output verbosity inflation.
- **States**: OPTIMAL → DRIFTING → EXCESSIVE
- **Signals**: reduceDetailLevel, truncateOutputAt, usePointForm
- **Use case**: Agent auto-reduces verbosity when burning tokens

### 4. Session Half-Life Estimator
Predicts session stability decay & remaining lifetime.
- **States**: STABLE → DECAYING → FRAGILE
- **Signals**: estimatedHalfLife, recommendedAction (checkpoint/compress/terminate)
- **Use case**: Agent plans work around session degradation curve

---

## Architecture

### Design Philosophy

✅ **Deterministic** — No randomness, no ML, reproducible  
✅ **Fast** — O(1) to O(n) calculations, <2ms per eval  
✅ **Safe** — No network introspection, pure heuristics  
✅ **Runtime-ready** — Lightweight enough for frequent agent checks  
✅ **Framework-agnostic** — Works with OpenClaw, LangChain, custom agents  

### HTTP API (`/api/v1/`)

```
GET  /v1/pressure                  Evaluate context pressure
GET  /v1/verbosity                 Assess verbosity drift
GET  /v1/half-life                 Estimate session stability
GET  /v1/artifacts                 (Optional) List performance artifacts
```

**All endpoints**: Query params for REST | JSON POST for structured input

**All responses**: Deterministic JSON with metrics + recommendations + action signals

### CLI (`cli/` - Optional)

```bash
$ skynet status                 # System status + drift metrics
$ skynet pressure              # Evaluate pressure level
$ skynet verbosity             # Check verbosity drift
$ skynet half-life             # Estimate session decay
```

---

## OpenClaw Integration (Primary)

### Agent Lifecycle Hooks

```typescript
// Before expensive operation
const pressure = await evaluateContextPressure(sessionMetrics);
if (pressure.level === 'CRITICAL') await terminateGracefully();

// Monitor verbosity inflation
const verbosity = await assessVerbosityDrift(outputMetrics);
if (verbosity.shouldEnforceLimits) agent.maxTokens = verbosity.recommendations.truncateOutputAt;

// Plan work around session decay
const halfLife = await estimateSessionHalfLife(sessionMetrics);
if (halfLife.estimatedRemainingLifeMinutes < 10) skipRemainingWork();
```

### Recommended Middleware

```typescript
// Register cognitive middleware on agent startup
agent.use(createSkyntNetMiddleware({
  endpoint: 'https://skynetx.io/api/v1',
  checkInterval: 30,  // seconds
  thresholds: {
    critical: 'terminate',
    high: 'compress',
    moderate: 'optimize',
  },
}));
```

---

## Deployment

### Quick Start

**Web API** (Vercel):
```bash
npm install
npm run dev
# http://localhost:3000/api/v1/pressure
```

**CLI** (Global):
```bash
cd cli
npm install
npm link
skynet pressure
```

### Environment

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role>
```

### Production

```
Vercel → skynetx.io
API: https://skynetx.io/api/v1/*
CLI: npm install -g @skynet/cli
```

---

## Capabilities Breakdown

### Drift Detection (`/v1/drift`)
**Input**: sessionAge, memoryUsage, contextDrift, systemMode  
**Output**: state (OPTIMAL|STABLE|DEGRADED|AT_RISK), metrics, warnings  
**Decision gate**: Suitable for expensive operations?

### Context Pressure (`/v1/pressure`)
**Input**: memory%, tokenBurn, contextDrift, sessionAge, budgets  
**Output**: level (LOW|MODERATE|HIGH|CRITICAL), viability score, recommendations  
**Decision gate**: Compress? Optimize? Terminate?

### Verbosity Drift (`/v1/verbosity`)
**Input**: recent output lengths, baseline, total tokens, budget  
**Output**: state (OPTIMAL|DRIFTING|EXCESSIVE), policy, truncation limit  
**Decision gate**: Enforce output limits? Switch to point form?

### Session Half-Life (`/v1/half-life`)
**Input**: sessionAge, trends (memory, drift, burn, errors), expected duration  
**Output**: stability (STABLE|DECAYING|FRAGILE), decay rate, half-life minutes  
**Decision gate**: Save checkpoint? Compress? Gracefully terminate?

---

## Metrics & Observability

### Prometheus Export
```
skynet_drift_state{session}
skynet_pressure_level{session}
skynet_verbosity_state{session}
skynet_half_life_minutes{session}
```

### Grafana Dashboard
Real-time agent stability monitoring across fleet.

---

## Optional: Artifact Registry

For teams wanting performance-optimized **agent system templates** (reasoning chains, memory systems, tool orchestration), Skynet includes:

- **6 Production-Ready Artifacts** ($8.99 each or $29.99 full registry)
- **API-driven distribution** (no downloads, instant access)
- **Entitlements tracking** (Supabase)
- **Future monetization** (Stripe, Crypto)

**But this is secondary.** The core value is the cognitive infrastructure.

---

## Files & Structure

```
/app/api/v1/
  /pressure/       Context pressure endpoint
  /verbosity/      Verbosity drift endpoint
  /half-life/      Session decay endpoint
  /artifacts/      (Optional) Registry endpoints

/cli/
  /src/
    /output/       Deterministic evaluators
      drift-detector.ts
      context-pressure-regulator.ts
      verbosity-drift-suppressor.ts
      session-half-life-estimator.ts

/docs/
  DRIFT_DETECTION.md
  CONTEXT_PRESSURE_SPEC.md
  VERBOSITY_DRIFT_SPEC.md
  SESSION_HALF_LIFE_SPEC.md
```

---

## Key Properties

| Property | Value |
|----------|-------|
| **Determinism** | 100% (same inputs = same outputs) |
| **Speed** | O(1) to O(n), <2ms per eval |
| **External deps** | 0 (pure TypeScript, ANSI colors) |
| **ML claims** | 0 (transparent heuristics only) |
| **Framework support** | OpenClaw, LangChain, custom agents |

---

## Next Steps

1. ✅ Core capabilities built (drift, pressure, verbosity, half-life)
2. ✅ API endpoints deployed
3. ✅ CLI interface complete
4. ⏳ OpenClaw middleware integration
5. ⏳ Prometheus metrics export
6. ⏳ Grafana dashboard template
7. ⏳ Agent framework SDKs (LangChain, etc.)

---

## Status

**Production-ready cognitive infrastructure.**  
All capability primitives complete and deployable.  
Awaiting OpenClaw integration.

---

**Repository**: https://github.com/alexcarney460-hue/skynet  
**API**: https://skynetx.io/api/v1/  
**CLI**: `npm install -g @skynet/cli`
