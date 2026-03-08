import { createMetricRoute } from '@/lib/route-factory';
import { evaluateVerbosity, VerbosityInput } from '@/lib/metrics';

const { GET, POST } = createMetricRoute<VerbosityInput, ReturnType<typeof evaluateVerbosity>>({
  metricType: 'verbosity',
  parseQuery: (p) => ({
    recentOutputLengths: (p.get('recentOutputLengths') || '150,160,170,165,180')
      .split(',')
      .map(Number),
    expectedBaseline: parseFloat(p.get('expectedBaseline') ?? '150'),
    tokenBudgetUsed: parseFloat(p.get('tokenBudgetUsed') ?? '50000'),
    tokenBudgetTotal: parseFloat(p.get('tokenBudgetTotal') ?? '100000'),
  }),
  parseBody: (b) => ({
    recentOutputLengths: (b.recentOutputLengths ?? b.recentOutputLengthsTokens ?? [150, 160, 170, 165, 180]) as number[],
    expectedBaseline: (b.expectedBaseline ?? b.expectedBaselineTokensPerOutput ?? 150) as number,
    tokenBudgetUsed: (b.tokenBudgetUsed ?? 50000) as number,
    tokenBudgetTotal: (b.tokenBudgetTotal ?? 100000) as number,
  }),
  evaluate: evaluateVerbosity,
});

export { GET, POST };
