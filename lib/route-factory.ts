import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from './api-auth';
import { createServiceClient } from './supabase';
import { checkAndDecrement } from './usage';

type MetricType = 'drift' | 'pressure' | 'verbosity' | 'half-life';

interface RouteConfig<TInput, TResult> {
  metricType: MetricType;
  parseQuery: (params: URLSearchParams) => TInput;
  parseBody: (body: Record<string, unknown>) => TInput;
  evaluate: (input: TInput) => TResult;
}

export function createMetricRoute<TInput, TResult>(config: RouteConfig<TInput, TResult>) {
  async function handler(request: NextRequest, parseInput: () => TInput) {
    const auth = await authenticateApiKey(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check credits & rate limits
    const usage = await checkAndDecrement(auth.userId);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: usage.reason, credits: usage.credits },
        { status: 429 }
      );
    }

    try {
      const input = parseInput();
      const result = config.evaluate(input);

      // Log to Supabase (fire-and-forget)
      try {
        const supabase = createServiceClient();
        supabase.from('telemetry_events').insert({
          user_id: auth.userId,
          agent_id: request.headers.get('x-agent-id') || null,
          session_id: request.headers.get('x-session-id') || null,
          metric_type: config.metricType,
          input,
          result,
        }).then(({ error }) => {
          if (error) console.error(`Telemetry insert failed [${config.metricType}]:`, error.message);
        });
      } catch (e) {
        console.error('Telemetry setup error:', e);
      }

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        ...result as Record<string, unknown>,
        _credits: usage.credits,
      });
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to evaluate ${config.metricType}`, message: err instanceof Error ? err.message : 'Unknown' },
        { status: 400 }
      );
    }
  }

  return {
    GET: (req: NextRequest) => handler(req, () => config.parseQuery(req.nextUrl.searchParams)),
    POST: async (req: NextRequest) => {
      const body = await req.json();
      return handler(req, () => config.parseBody(body));
    },
  };
}
