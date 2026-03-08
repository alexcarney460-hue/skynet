import { createMetricRoute } from '@/lib/route-factory';
import { evaluateDrift, DriftInput } from '@/lib/metrics';

const numParam = (params: URLSearchParams, key: string, fallback: number) =>
  parseFloat(params.get(key) ?? String(fallback));

const { GET, POST } = createMetricRoute<DriftInput, ReturnType<typeof evaluateDrift>>({
  metricType: 'drift',
  parseQuery: (p) => ({
    memoryUsedPercent: numParam(p, 'memoryUsedPercent', 45),
    tokenBurnRate: numParam(p, 'tokenBurnRate', 35),
    contextDriftPercent: numParam(p, 'contextDriftPercent', 20),
    sessionAgeMinutes: numParam(p, 'sessionAgeMinutes', 30),
  }),
  parseBody: (b) => ({
    memoryUsedPercent: b.memoryUsedPercent as number ?? 45,
    tokenBurnRate: b.tokenBurnRate as number ?? 35,
    contextDriftPercent: b.contextDriftPercent as number ?? 20,
    sessionAgeMinutes: b.sessionAgeMinutes as number ?? 30,
  }),
  evaluate: evaluateDrift,
});

export { GET, POST };
