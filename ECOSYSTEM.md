# SKYNET ECOSYSTEM — Framework Integration Suite

**SDK wrappers and integration libraries for Skynet cognitive infrastructure.**

---

## Overview

Skynet is framework-agnostic. These SDKs make integration seamless across the agent ecosystem.

### Available Integrations

1. **LangChain SDK** (`langchain-integration/`)
   - Custom `PressureAwareAgent` class
   - Extends `BaseSingleActionAgent`
   - Automatic pressure gating
   - Production-ready

2. **Python Client Library** (`python-sdk/`)
   - Pure Python HTTP client
   - Works with any Python agent framework
   - Simple, Pythonic API
   - No dependencies

3. **OpenClaw Middleware** (Phase 2)
   - Agent initialization hooks
   - Automatic pressure checking
   - Decision gating
   - Coming soon

---

## LangChain Integration

### Installation

```bash
cd langchain-integration
npm install
npm run build
```

### Usage

```typescript
import { PressureAwareAgent } from '@skynet/langchain';
import { SerpAPITool } from 'langchain/tools';

const agent = new PressureAwareAgent(
  [new SerpAPITool()],
  {
    skynetEndpoint: 'https://skynetx.io/api/v1',
    tokenBudget: 100000,
    handlers: {
      onPressureChange: (level) => console.log(`Pressure: ${level}`),
      onCompressionNeeded: () => console.log('Compressing...'),
      onTerminationNeeded: () => console.log('Terminating gracefully'),
    },
  }
);
```

### How It Works

1. **Before Planning** → Evaluate pressure
   - If CRITICAL → Terminate gracefully
   - If HIGH → Filter tools, enable compression
   - If MODERATE → Enable optimization mode

2. **During Execution** → Adjust tool parameters
   - High pressure → Reduce search depth, max results
   - Monitor verbosity → Truncate output if needed

3. **After Action** → Check stability
   - Low stability → Prepare checkpoint
   - High drift → Suggest compression

---

## Python SDK

### Installation

```bash
pip install skynet-client
```

Or from source:

```bash
cd python-sdk
python setup.py install
```

### Usage

```python
from skynet_client import SkynetClient, PressureLevel

client = SkynetClient(endpoint="https://skynetx.io/api/v1")

# Check pressure before expensive operation
pressure = client.evaluate_pressure(
    memory_used_percent=55,
    token_burn_rate_per_min=38,
    context_drift_percent=25,
    session_age_seconds=900,
)

if pressure.level == PressureLevel.CRITICAL:
    save_state_and_exit()
elif pressure.level == PressureLevel.HIGH:
    compress_context()

# Monitor verbosity
verbosity = client.assess_verbosity([120, 135, 150, 165, 180])
if verbosity.state.value == "EXCESSIVE":
    reduce_output_detail()

# Estimate remaining lifetime
stability = client.estimate_half_life(
    session_age_minutes=30,
    memory_pressure_history=[40, 42, 44, 46, 48],
    context_drift_history=[20, 21, 23, 25, 26],
    token_burn_rate_history=[30, 32, 34, 35, 36],
)
if stability.should_checkpoint:
    save_checkpoint()
```

---

## OpenClaw Middleware (Coming Phase 2)

### Design

```typescript
// In agent initialization
agent.use(SkynetMiddleware({
  endpoint: 'https://skynetx.io/api/v1',
  checkInterval: 30,  // seconds
}));

// Middleware handles all gating automatically
// Agent doesn't need to call Skynet explicitly
```

### How It Works

1. **Periodic Checks** (every 30 seconds)
   - Evaluate pressure, verbosity, half-life
   - Update agent state
   - Log warnings

2. **Pre-Tool Hooks**
   - Check pressure before tool execution
   - Gate execution if risky
   - Adjust parameters if needed

3. **Auto-Actions**
   - Compress memory if HIGH pressure
   - Truncate output if EXCESSIVE verbosity
   - Save checkpoint if DECAYING stability

---

## API Reference (Across All Integrations)

All SDKs expose the same four operations:

### 1. Evaluate Pressure

**Purpose**: Check session survivability

**Inputs**:
- memoryUsedPercent (0-100)
- tokenBurnRatePerMin (0-200)
- contextDriftPercent (0-100)
- sessionAgeSeconds (0-∞)
- tokenBudgetTotal (1000-1M)
- tokenBudgetUsed (0-budgetTotal)

**Output**:
```
{
  level: LOW | MODERATE | HIGH | CRITICAL,
  sessionViability: 0-100,
  shouldCompress: bool,
  shouldOptimize: bool,
  shouldTerminate: bool
}
```

### 2. Assess Verbosity

**Purpose**: Detect output inflation

**Inputs**:
- recentOutputLengths (array of token counts)
- baselineOutputLength (expected length)
- tokenBudgetTotal
- tokenBudgetUsed

**Output**:
```
{
  state: OPTIMAL | DRIFTING | EXCESSIVE,
  tokenImpact: LOW | MODERATE | HIGH,
  truncateOutputAt: int,
  reduceDetailLevel: bool,
  skipMetaCommentary: bool
}
```

### 3. Estimate Half-Life

**Purpose**: Predict session decay

**Inputs**:
- sessionAgeMinutes (0-1440)
- memoryPressureHistory (array of %)
- contextDriftHistory (array of %)
- tokenBurnRateHistory (array of t/min)
- errorCountThisSession (int)

**Output**:
```
{
  stability: STABLE | DECAYING | FRAGILE,
  stabilityScore: 0-100,
  halfLifeMinutes: int,
  remainingUsefulLifeMinutes: int,
  shouldCheckpoint: bool,
  shouldCompress: bool,
  shouldTerminate: bool,
  minutesToCritical: int
}
```

### 4. Error Handling

All SDKs implement **graceful fallback**:
- Network failure → Return conservative MODERATE estimate
- API error → Log warning, continue with fallback
- Timeout → Use last known state

---

## Example Agents

### Research Agent (LangChain + TypeScript)

See: `langchain-integration/examples/research-agent.ts`

Demonstrates:
- Multi-step research with pressure gating
- Automatic tool filtering under high pressure
- Graceful degradation

### Research Agent (Python)

See: `python-sdk/examples/research_agent.py`

Demonstrates:
- Integration with any Python framework
- Simple, Pythonic API
- Memory and stability tracking

---

## Performance

All implementations:
- ✅ <2ms evaluation time (deterministic heuristics)
- ✅ <50ms network latency (Vercel global)
- ✅ Suitable for frequent polling (every 30s typical)
- ✅ No external dependencies (Python SDK)
- ✅ Minimal overhead (<5ms total per decision)

---

## Roadmap

### Phase 2 (March 2026)
- ✅ LangChain wrapper (done)
- ✅ Python client (done)
- ⏳ OpenClaw middleware
- ⏳ Go client

### Phase 3 (April 2026)
- Rust client
- Node.js native wrapper
- Java/Kotlin support

### Phase 4 (May 2026+)
- gRPC protocol option
- WebSocket streaming
- CLI SDK utilities

---

## Integration Checklist

### For LangChain Projects

- [ ] Install `@skynet/langchain`
- [ ] Create `PressureAwareAgent` instance
- [ ] Configure token budget and handlers
- [ ] Test with sample agent
- [ ] Measure token savings
- [ ] Publish case study

### For Python Projects

- [ ] Install `skynet-client`
- [ ] Create `SkynetClient` instance
- [ ] Add pressure checks before expensive ops
- [ ] Monitor verbosity and stability
- [ ] Save checkpoints when needed
- [ ] Document results

### For OpenClaw Projects

- [ ] (Phase 2) Import middleware
- [ ] Register with agent
- [ ] Configure check interval
- [ ] Monitor agent behavior
- [ ] Measure stability gains
- [ ] Share metrics

---

## Support & Examples

### LangChain
- Full custom agent example: `langchain-integration/examples/research-agent.ts`
- Integration guide: `AGENT_CONSUMPTION_PATTERNS.md`

### Python
- Research agent example: `python-sdk/examples/research_agent.py`
- Full API docs: `python-sdk/README.md`

### OpenClaw
- Middleware design spec: (Coming Phase 2)
- Example agents: (Coming Phase 2)

---

## Status

✅ **LangChain Integration**: Production-ready  
✅ **Python SDK**: Production-ready  
⏳ **OpenClaw Middleware**: Ready to build (Phase 2)  
🎯 **Additional SDKs**: Designed, awaiting demand

---

## Contributing

Skynet is open to ecosystem contributions:
1. New language bindings
2. Framework-specific wrappers
3. Integration examples
4. Performance optimizations

See `CONTRIBUTING.md` (coming Phase 3)

---

**Built for agents. Ready for adoption.**
