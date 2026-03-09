import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Fetch all events from the last 7 days
  const { data: events, error } = await supabase
    .from('telemetry_events')
    .select('metric_type, result, created_at, agent_id')
    .eq('user_id', auth.userId)
    .gte('created_at', weekAgo)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  const allEvents = events ?? [];

  // Total calls
  const totalCalls = allEvents.length;
  const callsToday = allEvents.filter(e => e.created_at >= dayAgo).length;

  // Calls by metric type
  const byMetric: Record<string, number> = {};
  for (const e of allEvents) {
    byMetric[e.metric_type] = (byMetric[e.metric_type] ?? 0) + 1;
  }

  // Unique agents
  const agents = new Set(allEvents.map(e => e.agent_id).filter(Boolean));

  // Critical/warning events
  let criticalCount = 0;
  let warningCount = 0;
  for (const e of allEvents) {
    const r = e.result as Record<string, unknown>;
    const status = r.status ?? r.level ?? r.stability;
    if (status === 'CRITICAL' || status === 'FRAGILE') criticalCount++;
    else if (status === 'AT_RISK' || status === 'HIGH' || status === 'DECAYING' || status === 'WARNING' || status === 'EXCESSIVE') warningCount++;
  }

  // Compression savings (if any compress calls)
  let tokensSaved = 0;
  let compressCalls = 0;
  for (const e of allEvents) {
    if (e.metric_type === 'compress') {
      const r = e.result as Record<string, unknown>;
      const original = Number(r.original_tokens ?? 0);
      const compressed = Number(r.compressed_tokens ?? 0);
      if (original > compressed) {
        tokensSaved += original - compressed;
        compressCalls++;
      }
    }
  }

  // Circuit breaker halts
  let circuitBreaks = 0;
  for (const e of allEvents) {
    if (e.metric_type === 'circuit-breaker') {
      const r = e.result as Record<string, unknown>;
      if (r.action === 'HALT') circuitBreaks++;
    }
  }

  // Daily call volume (last 7 days)
  const dailyVolume: { date: string; calls: number }[] = [];
  const dayBuckets: Record<string, number> = {};
  for (const e of allEvents) {
    const day = e.created_at.slice(0, 10);
    dayBuckets[day] = (dayBuckets[day] ?? 0) + 1;
  }
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyVolume.push({ date: key, calls: dayBuckets[key] ?? 0 });
  }

  // Recent alerts (last 20 critical/warning events)
  const alerts = allEvents
    .filter(e => {
      const r = e.result as Record<string, unknown>;
      const status = r.status ?? r.level ?? r.stability;
      return status === 'CRITICAL' || status === 'FRAGILE' || status === 'AT_RISK' || status === 'HIGH' || status === 'DECAYING' || status === 'EXCESSIVE';
    })
    .reverse()
    .slice(0, 20)
    .map(e => {
      const r = e.result as Record<string, unknown>;
      return {
        metric: e.metric_type,
        status: r.status ?? r.level ?? r.stability,
        agent: e.agent_id,
        time: e.created_at,
        recommendations: r.recommendations ?? [],
      };
    });

  return NextResponse.json({
    totalCalls,
    callsToday,
    byMetric,
    uniqueAgents: agents.size,
    agentIds: [...agents],
    criticalCount,
    warningCount,
    tokensSaved,
    compressCalls,
    circuitBreaks,
    dailyVolume,
    alerts,
  });
}
