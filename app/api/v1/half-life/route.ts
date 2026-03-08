import { createMetricRoute } from '@/lib/route-factory';
import { evaluateHalfLife, HalfLifeInput } from '@/lib/metrics';

const numParam = (params: URLSearchParams, key: string, fallback: number) =>
  parseFloat(params.get(key) ?? String(fallback));

const { GET, POST } = createMetricRoute<HalfLifeInput, ReturnType<typeof evaluateHalfLife>>({
  metricType: 'half-life',
  parseQuery: (p) => ({
    sessionAgeMinutes: numParam(p, 'sessionAge', 30),
    memoryPressure: numParam(p, 'memoryPressure', 45),
    contextDrift: numParam(p, 'contextDrift', 25),
    tokenRemaining: numParam(p, 'tokenRemaining', 50000),
    tokenTotal: numParam(p, 'tokenTotal', 100000),
    errorCount: numParam(p, 'errors', 0),
  }),
  parseBody: (b) => ({
    sessionAgeMinutes: (b.sessionAgeMinutes ?? 30) as number,
    memoryPressure: (b.currentMemoryPressurePercent ?? b.memoryPressure ?? 45) as number,
    contextDrift: (b.currentContextDriftPercent ?? b.contextDrift ?? 25) as number,
    tokenRemaining: (b.tokenBudgetRemaining ?? b.tokenRemaining ?? 50000) as number,
    tokenTotal: (b.tokenBudgetTotal ?? b.tokenTotal ?? 100000) as number,
    errorCount: (b.errorCountThisSession ?? b.errorCount ?? 0) as number,
  }),
  evaluate: evaluateHalfLife,
});

export { GET, POST };
