# PHASE 2 — METRICS CAPTURE PROTOCOL

## Core Principle
**No ROI claims until we have real agent data. No features, SDKs, marketing until metrics prove value.**

---

## What We're Testing

We claim Skynet delivers:
- **30-50% token savings** ← Need proof
- **80%+ failure prevention** ← Need proof
- **Minimal latency overhead** ← Need proof

Without real data, these are just stories.

---

## Measurement Protocol

### 1. Per-Response Metrics

**Capture for EVERY agent response** (with/without Skynet):

```
timestamp,
agent_id,
session_id,
response_length_chars,
response_length_tokens,
token_burn_rate_per_min,
memory_used_percent,
context_drift_percent,
session_age_seconds,
pressure_level_observed,
verbosity_level_observed,
half_life_minutes_estimated,
response_was_truncated_by_skynet,
memory_was_compressed_by_skynet,
latency_ms_overhead_from_skynet
```

**Frequency**: Every response (no sampling, no aggregation yet).

**Storage**: CSV or JSON lines (immutable log).

---

### 2. Session-Level Metrics

**Capture when session ends**:

```
session_id,
agent_id,
session_start_time,
session_end_time,
session_length_minutes,
total_responses_generated,
total_tokens_generated,
avg_tokens_per_response,
max_response_tokens,
memory_expansions_blocked_by_skynet,
compressions_triggered_by_skynet,
drift_oscillations_observed,
agent_errors_count,
agent_hallucinations_count,
agent_confusion_states_count,
session_ended_naturally_or_crashed,
skynet_unavailable_periods,
skynet_timeouts_count
```

**Frequency**: End of every session.

---

### 3. Anomaly Detection

**Watch for oscillations & failures**:

```
timestamp,
agent_id,
anomaly_type,
context: {
  pressure_level,
  verbosity_level,
  half_life_minutes,
  token_burn_rate,
  memory_pressure,
  drift_rate
},
decision_skynet_made,
outcome
```

**Anomalies to track**:
- Pressure oscillating rapidly (LOW→CRITICAL→LOW)
- Verbosity bouncing (compress→expand→compress)
- Half-life ping-ponging (stable→fragile→stable)
- Agent becoming confused/looping
- Memory expansion blocked when needed
- Session ending prematurely
- Tokens per response spiking suddenly

---

## Test Harness

### Agent Selection

Run with **3-5 diverse OpenClaw agents**:
1. **Research Agent** (long context, deep reasoning)
2. **Planning Agent** (sequential decision-making)
3. **Coding Agent** (tool heavy, high token burn)
4. **Chat Agent** (high volume, low token/response)
5. **Autonomy Agent** (multi-step tasks, long sessions)

### Session Protocol

**For each agent, run 10 heavy sessions**:

| Session Type | Duration | Complexity | Metric Focus |
|--------------|----------|------------|--------------|
| Normal | 2-4 hours | Standard workload | Baseline (no Skynet) |
| With Skynet | 2-4 hours | Identical workload | Skynet impact |
| Stress | 4-8 hours | High complexity | Pressure handling |
| Degradation | 2-4 hours | Simulated errors | Failure robustness |

**Total test duration**: ~200-400 agent-hours.

---

## Baseline (No Skynet)

Run each agent WITHOUT Skynet middleware for 2-4 hours. Capture:
- Tokens per response
- Session length before reset
- Memory expansion frequency
- Drift state observed
- Errors/confusion events

Store as `baseline_<agent_id>_<run>.json`.

---

## With Skynet

Run IDENTICAL workload WITH Skynet middleware. Capture same metrics.

Store as `skynet_<agent_id>_<run>.json`.

---

## Comparison Methodology

### Token Savings Calculation

```
tokens_per_response_baseline = AVG(baseline responses)
tokens_per_response_skynet = AVG(skynet responses)

token_savings_percent = (
  (tokens_per_response_baseline - tokens_per_response_skynet) /
  tokens_per_response_baseline
) * 100

claim: "30-50% token savings"
result: If <10%, we have a problem
result: If 30-50%, we're on track
result: If >50%, something's broken (over-truncating?)
```

### Session Stability Calculation

```
baseline_session_length = AVG(baseline sessions before crash/reset)
skynet_session_length = AVG(skynet sessions before crash/reset)

stability_improvement_percent = (
  (skynet_session_length - baseline_session_length) /
  baseline_session_length
) * 100

error_rate_baseline = (baseline errors) / (baseline total responses)
error_rate_skynet = (skynet errors) / (skynet total responses)

failure_prevention_percent = (
  (error_rate_baseline - error_rate_skynet) /
  error_rate_baseline
) * 100

claim: "80%+ failure prevention"
result: If <20%, we have a problem
result: If 80%+, we're on track
```

### Latency Overhead

```
avg_skynet_gate_latency = MEAN(all gate latencies)
percentile_95_latency = PERCENTILE(all gate latencies, 95)
percentile_99_latency = PERCENTILE(all gate latencies, 99)

claim: "<50ms per gate"
result: If avg >30ms, problem
result: If p99 >50ms, problem
result: If avg <20ms, p99 <45ms, we're good
```

---

## Red Flags (Stop & Adjust)

If you observe ANY of these, **halt scaling and investigate**:

1. **Token savings <10%** → Heuristics not aggressive enough OR truncating wrong content
2. **Latency overhead >50ms p99** → Gate is too slow, need optimization
3. **Session length DECREASES with Skynet** → Middleware causing instability
4. **Error rate INCREASES with Skynet** → Blocking/compressing too aggressively
5. **Pressure oscillating rapidly** → Heuristic is bistable, causing churn
6. **Verbosity not converging** → Drift detector oversensitive
7. **Half-life estimate way off** → Model doesn't match reality
8. **Skynet unavailability causing cascades** → Bypass logic broken

---

## Green Lights (Ready to Scale)

Only proceed to Phase 3 if **ALL** are true:

- ✅ Token savings 30-50% consistently
- ✅ Session stability +15-30%
- ✅ Error rate down 80%+
- ✅ Latency overhead <30ms avg, <50ms p99
- ✅ No anomalies (no oscillations, no confusion)
- ✅ Middleware silent bypass works (Skynet down = agent continues)
- ✅ Metrics stable across all 5 agents
- ✅ Real-world workload tested (not synthetic)

**Only then**: Publish case study + launch viral demos.

---

## Data Collection Tools

### Minimal Logging (Agent-Side)

```typescript
// Add to agent loop
const metrics = {
  timestamp: new Date().toISOString(),
  agent_id: agent.id,
  session_id: session.id,
  response_length_tokens: response.tokens,
  response_length_chars: response.text.length,
  memory_used_percent: (agent.memory.used / agent.memory.total) * 100,
  pressure_level: skynetSignal?.pressure || 'N/A',
  verbosity_level: skynetSignal?.verbosity || 'N/A',
  half_life_minutes: skynetSignal?.halfLife || null,
  skynet_latency_ms: skynetGateLatency,
  error_occurred: false,
  confusion_detected: false,
};

// Append to immutable log
metrics_log.push(metrics);
```

### Analysis Tools (Post-Session)

```bash
# Generate comparison report
skynet analyze \
  --baseline baseline_chat_agent_run1.json \
  --skynet skynet_chat_agent_run1.json \
  --output report_chat_agent_run1.md

# Generate aggregate metrics across all runs
skynet aggregate \
  --agent chat_agent \
  --output aggregate_chat_agent.json

# Generate anomaly report
skynet anomalies \
  --session skynet_research_agent_run3.json \
  --output anomalies_research_agent_run3.md
```

---

## Reporting Structure

### Per-Session Report

```markdown
# Session Report: Research Agent, Run 1 (Skynet)

## Overview
- Duration: 3h 45m
- Total responses: 847
- Total tokens: 1,245,000
- Avg tokens/response: 1,470

## vs. Baseline
- Baseline avg tokens/response: 2,100
- Improvement: **30% token savings**
- Session length: +18% longer before reset
- Error rate: 15% baseline → 3% with Skynet (**80% failure prevention**)

## Latency Impact
- Avg gate latency: 23ms
- P95: 42ms
- P99: 48ms
- ✅ Within target

## Anomalies Detected
- 2 pressure oscillations (brief, recovered quickly)
- 1 verbosity drift spike (corrected in <2 responses)
- No session-ending failures

## Conclusion
✅ Green light — Metrics on target.
```

### Aggregate Report (All agents, all runs)

```markdown
# Aggregate Metrics: Skynet Phase 2 Testing

## Token Savings
- Research Agent: 32% (±5%)
- Planning Agent: 28% (±6%)
- Coding Agent: 45% (±8%)
- Chat Agent: 18% (±4%)
- Autonomy Agent: 41% (±7%)
- **Overall Average: 33% ± 6%** ✅ (Target: 30-50%)

## Failure Prevention
- Baseline error rate: 12.3%
- Skynet error rate: 2.1%
- **Prevention: 83%** ✅ (Target: 80%+)

## Latency Impact
- Avg gate latency: 24ms (±3ms)
- P99: 47ms (±2ms)
- **✅ Within target** (<50ms p99)

## Stability
- Baseline avg session: 2.1 hours
- Skynet avg session: 2.5 hours
- **Improvement: +19%** ✅

## Conclusion
✅ ALL METRICS GREEN. Ready to scale.
```

---

## Do NOT Do This (Hold Fire)

❌ **Do NOT publish case study** until metrics are complete.  
❌ **Do NOT launch viral demos** until we have hard evidence.  
❌ **Do NOT pitch investors** with theoretical ROI.  
❌ **Do NOT add SDKs** (Go, Rust, JS, etc.) until Phase 2 proves core value.  
❌ **Do NOT build fancy UI** until middleware is stable.  
❌ **Do NOT aggressive marketing** until we have real data.  

Why?
- If metrics don't match claims → credibility destroyed
- If we're overpromising → tech debt + support burden
- If Phase 2 fails → we need to pivot, not defend

---

## Success Criteria (Final Gate)

Before moving to Phase 3 (public launch), we need:

1. **Metrics** (hard numbers, not stories)
   - Token savings: 30-50% ✓
   - Failure prevention: 80%+ ✓
   - Latency: <50ms p99 ✓

2. **Reproducibility** (same results across all agents)
   - All 5 agents show improvement ✓
   - All 10 runs per agent consistent ✓
   - Edge cases understood ✓

3. **Safety** (Skynet failures don't break agents)
   - Silent bypass when Skynet down ✓
   - Agent continues normally ✓
   - No cascading failures ✓

4. **Real-World Validation** (not synthetic)
   - Heavy multi-hour sessions ✓
   - Diverse workloads ✓
   - Actual agent confusion/errors ✓

5. **Ready for Narrative**
   - Case study written (with data)
   - Demos scripted (with real metrics)
   - Launch plan (with dates)

---

## Timeline

**Week 1**: Set up logging + run baseline (3-5 agents, 10 runs each)  
**Week 2**: Insert Skynet middleware + run with Skynet (same workloads)  
**Week 3**: Analyze + adjust if needed (only if red flags)  
**Week 4**: Finalize metrics + write case study  

**Gate**: Only proceed to Phase 3 if **ALL** green lights ✅.

---

## Key Principle

**Real metrics > optimistic stories.**

If Skynet doesn't work as claimed, we pivot. If it does, the story tells itself.

No narrative until we have data.
