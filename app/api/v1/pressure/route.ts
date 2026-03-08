import { createMetricRoute } from '@/lib/route-factory';
import { evaluatePressure, PressureInput } from '@/lib/metrics';

const numParam = (params: URLSearchParams, key: string, fallback: number) =>
  parseFloat(params.get(key) ?? String(fallback));

const { GET, POST } = createMetricRoute<PressureInput, ReturnType<typeof evaluatePressure>>({
  metricType: 'pressure',
  parseQuery: (p) => ({
    memoryUsedPercent: numParam(p, 'memoryUsedPercent', 45),
    tokenBurnRatePerMin: numParam(p, 'tokenBurnRatePerMin', 35),
    contextDriftPercent: numParam(p, 'contextDriftPercent', 20),
    sessionAgeSeconds: numParam(p, 'sessionAgeSeconds', 600),
    tokenBudgetTotal: numParam(p, 'tokenBudgetTotal', 100000),
    tokenBudgetUsed: numParam(p, 'tokenBudgetUsed', 35000),
  }),
  parseBody: (b) => ({
    memoryUsedPercent: b.memoryUsedPercent as number ?? 45,
    tokenBurnRatePerMin: b.tokenBurnRatePerMin as number ?? 35,
    contextDriftPercent: b.contextDriftPercent as number ?? 20,
    sessionAgeSeconds: b.sessionAgeSeconds as number ?? 600,
    tokenBudgetTotal: b.tokenBudgetTotal as number ?? 100000,
    tokenBudgetUsed: b.tokenBudgetUsed as number ?? 35000,
  }),
  evaluate: evaluatePressure,
});

export { GET, POST };
