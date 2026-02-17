# SKYNET — Project Identity & Positioning

## Core Identity

**Name**: Skynet  
**Category**: Agent Cognitive Infrastructure  
**Primary Consumer**: OpenClaw agents  
**Secondary Use**: Performance artifact registry (optional monetization)

---

## Mission

Provide **decision-grade stability & efficiency signals** for autonomous agents operating under resource constraints.

Not a tool. Not a marketplace. **Cognitive infrastructure for agent runtime decisions.**

---

## What It Does

### Primary (Cognitive Infrastructure)
1. **Drift Detection** — Real-time system state health monitoring
2. **Pressure Evaluation** — Session survivability & token risk assessment
3. **Verbosity Control** — Output efficiency drift detection & correction
4. **Decay Prediction** — Session stability half-life estimation

→ **Agent decision gates**: compress? optimize? checkpoint? terminate?

### Secondary (Optional)
- Performance-optimized agent system artifacts ($8.99–$29.99)
- API-driven distribution
- Future monetization (Stripe, Crypto)

---

## Design Principles

### Technical
✅ **Deterministic** — Transparent heuristics, no ML, reproducible outputs  
✅ **Fast** — O(1) to O(n), suitable for frequent agent polling  
✅ **Safe** — No network introspection, pure math  
✅ **Lightweight** — No external dependencies, <1KB memory per eval  

### Strategic
✅ **Agent-centric** — Built for autonomous decision-making, not humans  
✅ **Framework-agnostic** — Works with OpenClaw, LangChain, custom frameworks  
✅ **OpenClaw-first** — Deep integration, but not vendor-locked  

### Brand
- **Minimal, dark, technical** — Zero marketing fluff
- **System-style output** — Infrastructure, not helper text
- **Cold, credible** — "Production-grade AI infrastructure"

---

## Positioning

### Messaging

**What we say:**
> Skynet is the cognitive runtime for autonomous agents. Real-time stability signals enable agents to make smart decisions under resource pressure: compress context, optimize parameters, or gracefully terminate.

**What we don't say:**
- "AI marketplace" (wrong layer)
- "Agent toolkit" (too broad)
- "Performance templates" (secondary feature)
- "Dashboard" (we don't have one, focus on API)

### Target Users
1. **OpenClaw agents** — Native integration via middleware
2. **LangChain builders** — Via SDK wrapper
3. **Custom agent frameworks** — Via HTTP API
4. **Enterprise AI ops** — Monitoring + metrics export

### Not Target
- "Low-code AI builders" (we're infrastructure, not UI)
- "AI learners" (requires understanding stability metrics)
- "General public" (infrastructure, not consumer product)

---

## Feature Positioning

| Feature | Positioning | Truth |
|---------|-------------|-------|
| Drift Detection | Monitor system health in real-time | Yes, deterministic |
| Pressure Eval | Know session survivability now | Yes, heuristic but transparent |
| Verbosity Control | Auto-reduce output bloat | Yes, trend-based |
| Half-Life | Predict stability decay | Yes, exponential model |
| Artifacts | Performance optimizations | Yes, but secondary |

---

## Repository & Deployment

**GitHub**: `alexcarney460-hue/skynet` (private, ready to go public)  
**Domain**: `skynetx.io`  
**API**: `https://skynetx.io/api/v1/*`  
**CLI**: `npm install -g @skynet/cli`  

---

## OpenClaw Integration (Next Phase)

### Proposed Middleware
```typescript
// In OpenClaw agent init
agent.use(createSkynetMiddleware({
  endpoint: 'https://skynetx.io/api/v1',
  checkInterval: 30, // Check pressure every 30 seconds
  handlers: {
    critical: () => agent.gracefulTerminate(),
    high: () => agent.compressContext(),
    moderate: () => agent.enableOptimizations(),
  },
}));
```

### Signals OpenClaw Can Use
- Compression gates (pressure + half-life)
- Parameter optimization flags (verbosity + pressure)
- Graceful termination hooks (fragile state)
- Checkpoint triggers (DECAYING state)

### Integration Points
- Pre-tool-execution checks
- Session lifecycle hooks
- Metrics export (Prometheus)
- Agent decision loops

---

## Messaging Templates

### For Developers
> Skynet gives your agents cognitive self-awareness. Before expensive operations, agents check stability, pressure, and decay signals. Use those decisions to optimize, compress, or gracefully exit.

### For DevOps/Monitoring
> Skynet exports real-time stability metrics for agent fleet monitoring. Know when agents are degrading before they fail. Export to Prometheus, dashboard in Grafana.

### For OpenClaw
> Native integration layer. Agents use Skynet's decision signals in their task loops. Middleware hooks, deterministic evals, no blocking calls.

---

## What We Are NOT

❌ **CLI tool** — API-first, CLI is optional interface  
❌ **Marketplace** — Artifact registry is secondary  
❌ **Dashboard** — No UI, metrics-focused  
❌ **ML system** — Transparent heuristics only  
❌ **Production monitoring** — We're agent-internal, not fleet-wide observer  

---

## Success Metrics

1. **OpenClaw integration** — Agents using Skynet signals for decisions
2. **Decision quality** — Agents compress/optimize at right times
3. **No false alarms** — Deterministic, reproducible signals
4. **Performance** — All evals <2ms, suitable for agent loops
5. **Adoption** — Used by LangChain builders, custom frameworks

---

## Roadmap

### Phase 1: Foundation ✅
- 4 cognitive capabilities (drift, pressure, verbosity, half-life)
- HTTP API + CLI
- Deterministic evaluation logic
- Full specification + integration guides

### Phase 2: Integration ⏳
- OpenClaw middleware
- LangChain SDK wrapper
- Prometheus metrics export
- Grafana dashboard template

### Phase 3: Ecosystem ⏳
- Community SDKs (Python, Go, Rust)
- Framework-specific integrations
- Open-source artifact registry
- Managed cloud option (optional)

### Phase 4: Monetization ⏳
- Enterprise support
- Custom cognitive capabilities
- Artifact distribution (if market exists)
- Managed Skynet service

---

## Status

**Positioning**: Agent Cognitive Infrastructure ✅  
**Core product**: Complete & ready ✅  
**OpenClaw integration**: Pending ⏳  
**Market validation**: To be determined  

---

## Key Quote

> Skynet isn't what you use to find agents. It's what agents use to know themselves.
