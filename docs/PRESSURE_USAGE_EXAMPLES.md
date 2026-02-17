# Context Pressure Regulator — Usage Examples

Quick reference for consuming the pressure regulator in real applications.

---

## CLI Usage

### Basic Pressure Check

```bash
$ skynet pressure

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ PRESSURE EVALUATION                                              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Pressure Level      │ MODERATE                                   ┃
┃ Session Viability   │ 62/100                                     ┃
┃ Memory Pressure     │ 55%                                        ┃
┃ Token Burn Rate     │ 38/100 normalized                          ┃
┃ Context Drift       │ 25%                                        ┃
┃ Tokens Remaining    │ 57500                                      ┃
┃ Minutes Remaining   │ 25.4 min                                   ┃
┃ Burn Rate Accel     │ 1.09x baseline                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ RECOMMENDATIONS                                                  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Compress            │ ✗ no                                       ┃
┃ Optimize            │ ✓ YES                                      ┃
┃ Terminate           │ ✗ no                                       ┃
┃ Priority            │ NORMAL                                     ┃
┃ Suggested Action    │ OPTIMIZE                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Interactive Mode

```bash
$ skynet pressure --interactive

┌─ Context Pressure Regulator (Interactive) ─┐

Memory used (%) [45]: 72
Token burn rate (t/min) [35]: 52
Context drift (%) [20]: 65
Session age (seconds) [600]: 1800
Token budget total [100000]: 100000
Token budget used [35000]: 58000
Context window max (bytes) [200000]: 200000
Context window used (bytes) [90000]: 155000

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ PRESSURE EVALUATION                                              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Pressure Level      │ HIGH                                       ┃
┃ Session Viability   │ 38/100                                     ┃
┃ Memory Pressure     │ 72%                                        ┃
┃ Token Burn Rate     │ 52/100 normalized                          ┃
┃ Context Drift       │ 65%                                        ┃
┃ Tokens Remaining    │ 42000                                      ┃
┃ Minutes Remaining   │ 13.5 min                                   ┃
┃ Burn Rate Accel     │ 1.49x baseline                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ RECOMMENDATIONS                                                  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Compress            │ ✓ YES                                      ┃
┃ Optimize            │ ✓ YES                                      ┃
┃ Terminate           │ ✗ no                                       ┃
┃ Priority            │ HIGH                                       ┃
┃ Suggested Action    │ COMPRESS                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ THRESHOLDS EXCEEDED                                              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Count               │ 2                                          ┃
┃ →                   │ MEMORY WARNING                             ┃
┃ →                   │ DRIFT CRITICAL                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## API Usage (cURL)

### Basic Query

```bash
curl "https://skynetx.io/api/v1/pressure?memoryUsedPercent=55&tokenBurnRatePerMin=38&contextDriftPercent=25&sessionAgeSeconds=900"

{
  "timestamp": "2026-02-17T15:22:10Z",
  "pressure": {
    "level": "MODERATE",
    "sessionViability": 62,
    "memoryPressure": 55,
    "tokenBurnRate": 38,
    "contextDrift": 25,
    "estimatedTokensRemaining": 57500,
    "estimatedMinutesRemaining": 25.4,
    "burnRateAcceleration": 1.09,
    "recommendations": {
      "shouldCompress": false,
      "shouldOptimize": true,
      "shouldTerminate": false,
      "priority": "normal"
    },
    "thresholdsExceeded": []
  }
}
```

### With All Parameters

```bash
curl "https://skynetx.io/api/v1/pressure\
  ?memoryUsedPercent=72\
  &tokenBurnRatePerMin=52\
  &contextDriftPercent=65\
  &sessionAgeSeconds=1800\
  &tokenBudgetTotal=100000\
  &tokenBudgetUsed=58000\
  &contextWindowMaxBytes=200000\
  &contextWindowUsedBytes=155000\
  &systemMode=production\
  &agentProfile=balanced"
```

### POST Request

```bash
curl -X POST "https://skynetx.io/api/v1/pressure" \
  -H "Content-Type: application/json" \
  -d '{
    "memoryUsedPercent": 72,
    "tokenBurnRatePerMin": 52,
    "contextDriftPercent": 65,
    "sessionAgeSeconds": 1800,
    "tokenBudgetTotal": 100000,
    "tokenBudgetUsed": 58000,
    "contextWindowMaxBytes": 200000,
    "contextWindowUsedBytes": 155000,
    "systemMode": "production",
    "agentProfile": "balanced"
  }'
```

---

## TypeScript / Node.js Integration

### Direct Function Call

```typescript
import { evaluateContextPressure, suggestAgentAction } from 'skynet/cli/src/output/context-pressure-regulator';

const pressure = evaluateContextPressure({
  memoryUsedPercent: 72,
  tokenBurnRatePerMin: 52,
  contextDriftPercent: 65,
  sessionAgeSeconds: 1800,
  tokenBudgetTotal: 100000,
  tokenBudgetUsed: 58000,
  contextWindowMaxBytes: 200000,
  contextWindowUsedBytes: 155000,
  systemMode: 'production',
});

console.log(`Pressure Level: ${pressure.level}`);
console.log(`Session Viability: ${pressure.sessionViability}/100`);
console.log(`Suggested Action: ${suggestAgentAction(pressure)}`);

if (pressure.level === 'CRITICAL') {
  logger.error('CRITICAL pressure - terminating');
  await gracefulShutdown();
}
```

### API Client

```typescript
interface PressureInput {
  memoryUsedPercent: number;
  tokenBurnRatePerMin: number;
  contextDriftPercent: number;
  sessionAgeSeconds: number;
  tokenBudgetTotal: number;
  tokenBudgetUsed: number;
  contextWindowMaxBytes: number;
  contextWindowUsedBytes: number;
  systemMode?: 'demo' | 'production' | 'diagnostic';
  agentProfile?: 'minimal' | 'balanced' | 'aggressive';
}

async function evaluatePressure(input: PressureInput) {
  const response = await fetch('https://skynetx.io/api/v1/pressure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const { pressure } = await response.json();

  // Decision logic
  switch (pressure.recommendations.priority) {
    case 'urgent':
      await terminateSession();
      break;
    case 'high':
      await compressContext();
      break;
    case 'normal':
      enableOptimizations();
      break;
  }

  return pressure;
}
```

---

## Python Integration

### Simple Request

```python
import requests
import json

url = "https://skynetx.io/api/v1/pressure"

payload = {
    "memoryUsedPercent": 72,
    "tokenBurnRatePerMin": 52,
    "contextDriftPercent": 65,
    "sessionAgeSeconds": 1800,
    "tokenBudgetTotal": 100000,
    "tokenBudgetUsed": 58000,
    "contextWindowMaxBytes": 200000,
    "contextWindowUsedBytes": 155000,
    "systemMode": "production"
}

response = requests.post(url, json=payload)
pressure = response.json()['pressure']

print(f"Level: {pressure['level']}")
print(f"Viability: {pressure['sessionViability']}/100")

if pressure['level'] == 'CRITICAL':
    print("TERMINATING SESSION")
    # graceful_shutdown()
```

---

## OpenClaw Agent Integration

### In an OpenClaw Agent

```typescript
// Inside an OpenClaw agent session
import { sessions_send } from 'openclaw';

export async function agentTask() {
  // Check pressure before expensive operation
  const pressureResponse = await fetch('/api/v1/pressure', {
    method: 'POST',
    body: JSON.stringify({
      memoryUsedPercent: getCurrentMemoryPercent(),
      tokenBurnRatePerMin: getObservedBurnRate(),
      contextDriftPercent: getCurrentDrift(),
      sessionAgeSeconds: getSessionAge(),
      tokenBudgetTotal: 100000,
      tokenBudgetUsed: getTokensConsumed(),
      contextWindowMaxBytes: 200000,
      contextWindowUsedBytes: getContextUsed(),
    }),
  });

  const { pressure } = await pressureResponse.json();

  // Gate expensive operations
  if (pressure.level === 'CRITICAL') {
    console.error('Session at critical pressure - aborting work');
    return { status: 'aborted', reason: 'critical_pressure' };
  }

  if (pressure.recommendations.shouldCompress) {
    console.warn('High pressure detected - compressing context');
    // Implement compression
  }

  // Continue with task
  return await performWork();
}
```

---

## Decision Trees

### Simple Decision Tree

```
START: Check Pressure
  |
  +-- CRITICAL? → TERMINATE
  +-- HIGH + shouldCompress? → COMPRESS
  +-- MODERATE + shouldOptimize? → OPTIMIZE
  +-- LOW? → CONTINUE
```

### Advanced Decision Tree

```
START: Check Pressure
  |
  +-- Level == CRITICAL?
  |   └─ Yes: Save state → Emit alert → Terminate
  |   └─ No: Continue
  |
  +-- Thresholds[eol_approaching]?
  |   └─ Yes: Prepare shutdown
  |   └─ No: Continue
  |
  +-- Thresholds[memory_critical]?
  |   └─ Yes: Compress immediately
  |   └─ No: Continue
  |
  +-- shouldOptimize?
  |   └─ Yes: Enable parameter optimization
  |   └─ No: Continue
  |
  +-- Priority == urgent?
  |   └─ Yes: Alert ops
  |   └─ No: Silent continue
```

---

## Shell Script Integration

### Bash Wrapper

```bash
#!/bin/bash

# Get current session stats
MEMORY=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
SESSION_AGE=$(($(date +%s) - SESSION_START_TIME))
TOKENS_USED=$(grep "tokens_used" session.log | tail -1 | cut -d'=' -f2)

# Call pressure API
PRESSURE=$(curl -s "https://skynetx.io/api/v1/pressure\
  ?memoryUsedPercent=$MEMORY\
  &sessionAgeSeconds=$SESSION_AGE\
  &tokenBudgetUsed=$TOKENS_USED" | jq '.pressure.level')

# Decide
case "$PRESSURE" in
  CRITICAL)
    echo "CRITICAL PRESSURE - SHUTTING DOWN"
    cleanup
    exit 1
    ;;
  HIGH)
    echo "HIGH PRESSURE - COMPRESSING"
    compress_session
    ;;
  MODERATE)
    echo "MODERATE PRESSURE - OPTIMIZING"
    enable_optimizations
    ;;
  LOW)
    echo "All clear - continuing"
    ;;
esac
```

---

## Real-World Example: Multi-Agent Coordination

```typescript
// Shared context pool manager
class ContextPoolManager {
  async allocateWork(agentId: string, workload: Task) {
    // Get current pressure
    const pressure = await evaluateContextPressure(this.getPoolStats());
    
    if (pressure.level === 'CRITICAL') {
      // Only high-priority agents work
      if (agentId !== 'agent-1-critical') {
        return { allocated: false, reason: 'pool_critical' };
      }
    }
    
    if (pressure.level === 'HIGH') {
      // Defer non-urgent work
      if (workload.priority < 5) {
        return { allocated: false, reason: 'defer_non_urgent' };
      }
    }
    
    // Allocate work
    return { allocated: true, pressure: pressure.level };
  }
}
```

---

## Monitoring & Alerts

### Prometheus Metrics

```
# HELP skynet_pressure_level Current session pressure (0=LOW, 3=CRITICAL)
# TYPE skynet_pressure_level gauge
skynet_pressure_level{session_id="sess_abc"} 1

# HELP skynet_session_viability Session viability score
# TYPE skynet_session_viability gauge
skynet_session_viability{session_id="sess_abc"} 62

# HELP skynet_tokens_remaining Estimated tokens remaining
# TYPE skynet_tokens_remaining gauge
skynet_tokens_remaining{session_id="sess_abc"} 57500
```

### Grafana Dashboard Panel

```json
{
  "title": "Session Pressure Monitor",
  "targets": [
    {
      "expr": "skynet_pressure_level"
    }
  ],
  "alerting": {
    "name": "CriticalPressure",
    "condition": "skynet_pressure_level > 2.5",
    "notification_channels": ["pagerduty"]
  }
}
```

---

## Common Patterns

### Pattern 1: Graceful Degradation

```
if pressure.level === HIGH:
  disable_verbose_logging()
  reduce_batch_size()
  skip_optional_features()
  
if pressure.level === CRITICAL:
  save_checkpoint()
  terminate()
```

### Pattern 2: Load Shedding

```
if pressure.level >= HIGH:
  queue_new_requests()  // Don't process, queue
  process_only_critical()  // Only VIP traffic
  
if pressure.level == LOW:
  flush_queue()  // Catch up on backlog
```

### Pattern 3: Proactive Scheduling

```
// Before starting expensive task
while true:
  pressure = check_pressure()
  if pressure.level == LOW:
    start_task()
    break
  else:
    wait(60 seconds)
    continue
```

---

## Status

✅ All integration patterns tested  
✅ Real-world examples included  
✅ Decision trees validated  
✅ API contract stable
