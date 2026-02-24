import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { GlobalMapProps } from '@/app/components/GlobalMap';
import type { MetricTileProps } from '@/app/components/MetricTile';
import type { ThreatRadarProps } from '@/app/components/ThreatRadar';
import type { TopCommandBarProps } from '@/app/components/TopCommandBar';
import { getAppBaseUrl } from './env';

const DEFAULT_BASE_URL = 'http://localhost:3000';

type PressureResponse = {
  timestamp: string;
  pressure: {
    level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    sessionAgeSeconds: number;
    memoryUsedPercent: number;
    tokenBurnRatePerMin: number;
    contextDriftPercent: number;
    recommendations: string[];
  };
  metadata: {
    systemMode: string;
    agentProfile: string;
    tokenBudgetTotal: number;
    tokenBudgetUsed: number;
    contextWindowMaxBytes: number;
    contextWindowUsedBytes: number;
  };
};

type VerbosityResponse = {
  timestamp: string;
  assessment: {
    level: 'OPTIMAL' | 'DRIFTING' | 'EXCESSIVE';
    driftPercent: number;
    avgOutputLength: number;
    expectedBaseline: number;
    recommendations: string[];
  };
};

type HalfLifeResponse = {
  timestamp: string;
  halfLife: {
    estimatedHalfLifeMinutes: number;
    stability: 'STABLE' | 'DECAYING' | 'FRAGILE';
    sessionAgeMinutes: number;
    tokenBurnRatePerMin: number;
    minutesUntilExhaustion: number;
    recommendations: string[];
  };
};

type DriftResponse = {
  timestamp: string;
  drift: {
    score: number;
    status: 'OPTIMAL' | 'WARNING' | 'AT_RISK' | 'CRITICAL';
    memoryUsedPercent: number;
    tokenBurnRate: number;
    contextDriftPercent: number;
    sessionAgeMinutes: number;
    recommendations: string[];
  };
};

type ArtifactRecord = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  description: string | null;
  created_at: string;
};

export type DashboardData = {
  generatedAt: string;
  mission: {
    title: string;
    subtitle: string;
    time: string;
    date: string;
    operatorsOnline: number;
    signalStrength: number;
  };
  metrics: MetricTileProps[];
  commandQueue: TopCommandBarProps['commandQueue'];
  threats: ThreatRadarProps['threats'];
  nodes: GlobalMapProps['nodes'];
};

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = getAppBaseUrl() || DEFAULT_BASE_URL;
  const res = await fetch(`${baseUrl}${path}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'skynet-dashboard/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

function formatDateParts(date: Date) {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  const calendar = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);

  return { time, calendar };
}

function minutesToEta(minutes: number) {
  const whole = Math.max(0, Math.round(minutes));
  return `${String(whole).padStart(2, '0')}:00`;
}

function stringHash(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0; // keep 32bit
  }
  return hash;
}

function coordFromSlug(slug: string, index: number): [number, number] {
  const hash = Math.abs(stringHash(slug || `node-${index}`));
  const x = 20 + (hash % 60);
  const y = 25 + ((hash >> 3) % 55);
  return [x, y];
}

const REGION_SEQUENCE = ['EMEA', 'LATAM', 'APAC', 'NA'];
const STATUS_SEQUENCE: GlobalMapProps['nodes'][number]['status'][] = [
  'stable',
  'elevated',
  'critical',
  'stable',
];

function buildCommandQueue(records: ArtifactRecord[] | null | undefined) {
  const fallback: TopCommandBarProps['commandQueue'] = [
    {
      id: 'CMD-0001',
      label: 'Mission Control bootstrap',
      status: 'executing',
      eta: '00:45',
      channel: 'Ops',
    },
  ];

  if (!records || records.length === 0) {
    return fallback;
  }

  const statuses: TopCommandBarProps['commandQueue'][number]['status'][] = [
    'executing',
    'queued',
    'armed',
    'armed',
  ];

  return records.slice(0, 4).map((record, index) => ({
    id: record.slug?.slice(0, 7).toUpperCase() || `CMD-${index + 1}`,
    label: record.title,
    status: statuses[index] ?? 'queued',
    eta: minutesToEta(5 + index * 12),
    channel: record.category ?? 'General Ops',
  }));
}

function buildGlobalNodes(records: ArtifactRecord[] | null | undefined) {
  const fallback: GlobalMapProps['nodes'] = [
    {
      id: 'ARC-09',
      label: 'Aegean Crown',
      region: 'EMEA',
      status: 'stable',
      latency: 43,
      load: 58,
      coord: [35, 32],
    },
  ];

  if (!records || records.length === 0) {
    return fallback;
  }

  return records.slice(0, 4).map((record, index) => ({
    id: record.slug?.slice(0, 5).toUpperCase() || `NODE-${index}`,
    label: record.title,
    region: REGION_SEQUENCE[index % REGION_SEQUENCE.length],
    status: STATUS_SEQUENCE[index % STATUS_SEQUENCE.length],
    latency: 30 + index * 12,
    load: 45 + index * 15,
    coord: coordFromSlug(record.slug ?? `node-${index}`, index),
  }));
}

function buildThreats(
  pressure: PressureResponse,
  verbosity: VerbosityResponse,
  halfLife: HalfLifeResponse,
  drift: DriftResponse,
): ThreatRadarProps['threats'] {
  return [
    {
      id: 'VX-PRS',
      label: 'Memory Pressure',
      vector: 25 + pressure.pressure.memoryUsedPercent * 0.5,
      intensity: Math.min(1, pressure.pressure.memoryUsedPercent / 100),
      quadrant: 'Context',
      status: pressure.pressure.level,
      impact: `${pressure.pressure.memoryUsedPercent}% window utilization`,
    },
    {
      id: 'VX-VRB',
      label: 'Verbosity Drift',
      vector: 120,
      intensity: Math.min(1, Math.abs(verbosity.assessment.driftPercent) / 60),
      quadrant: 'Output',
      status: verbosity.assessment.level,
      impact: `${verbosity.assessment.driftPercent.toFixed(1)}% over baseline`,
    },
    {
      id: 'VX-HLF',
      label: 'Session Half-Life',
      vector: 220,
      intensity: Math.min(1, halfLife.halfLife.estimatedHalfLifeMinutes / 60),
      quadrant: 'Stability',
      status: halfLife.halfLife.stability,
      impact: `${halfLife.halfLife.estimatedHalfLifeMinutes} min remaining`,
    },
    {
      id: 'VX-DRF',
      label: 'Signal Drift',
      vector: 315,
      intensity: Math.min(1, drift.drift.score),
      quadrant: 'Spectrum',
      status: drift.drift.status,
      impact: `${(drift.drift.score * 100).toFixed(1)} drift score`,
    },
  ];
}

function buildMetrics(
  pressure: PressureResponse,
  verbosity: VerbosityResponse,
  halfLife: HalfLifeResponse,
  drift: DriftResponse,
): MetricTileProps[] {
  return [
    {
      label: 'Context Pressure',
      value: `${pressure.pressure.memoryUsedPercent}% util`,
      description: 'Active context window usage',
      accent: 'from-fuchsia-500/25 via-transparent to-sky-400/20',
      delta: {
        label: `Drift ${pressure.pressure.contextDriftPercent}%`,
        value: `${pressure.pressure.level}`,
        direction:
          pressure.pressure.level === 'CRITICAL'
            ? 'down'
            : pressure.pressure.level === 'LOW'
            ? 'up'
            : 'flat',
      },
    },
    {
      label: 'Verbosity Drift',
      value: `${verbosity.assessment.driftPercent.toFixed(1)}%`,
      description: 'Output length vs. baseline',
      accent: 'from-sky-500/20 via-transparent to-cyan-300/10',
      delta: {
        label: 'Avg tokens',
        value: `${Math.round(verbosity.assessment.avgOutputLength)} t`,
        direction:
          verbosity.assessment.level === 'EXCESSIVE'
            ? 'down'
            : verbosity.assessment.level === 'OPTIMAL'
            ? 'up'
            : 'flat',
      },
    },
    {
      label: 'Session Half-Life',
      value: `${halfLife.halfLife.estimatedHalfLifeMinutes} min`,
      description: 'Forecast before decay',
      accent: 'from-purple-500/25 via-transparent to-fuchsia-400/15',
      delta: {
        label: 'Burn rate',
        value: `${halfLife.halfLife.tokenBurnRatePerMin.toFixed(1)} tok/min`,
        direction:
          halfLife.halfLife.stability === 'FRAGILE'
            ? 'down'
            : halfLife.halfLife.stability === 'STABLE'
            ? 'up'
            : 'flat',
      },
    },
    {
      label: 'Drift Stability',
      value: drift.drift.status,
      description: 'Composite drift score',
      accent: 'from-cyan-400/20 via-transparent to-white/5',
      delta: {
        label: 'Score',
        value: drift.drift.score.toFixed(2),
        direction:
          drift.drift.status === 'OPTIMAL'
            ? 'up'
            : drift.drift.status === 'CRITICAL'
            ? 'down'
            : 'flat',
      },
    },
  ];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [pressure, verbosity, halfLife, drift] = await Promise.all([
    fetchJson<PressureResponse>(
      '/api/v1/pressure?memoryUsedPercent=62&tokenBurnRatePerMin=47&contextDriftPercent=28&sessionAgeSeconds=1200&tokenBudgetTotal=120000&tokenBudgetUsed=54000',
    ),
    fetchJson<VerbosityResponse>(
      '/api/v1/verbosity?recentOutputLengths=140,152,160,172,185&expectedBaseline=135&tokenBudgetUsed=52000&tokenBudgetTotal=120000',
    ),
    fetchJson<HalfLifeResponse>(
      '/api/v1/half-life?sessionAge=42&memoryPressure=58&contextDrift=36&tokenRemaining=42000&tokenTotal=120000&expectedLength=180&errors=1',
    ),
    fetchJson<DriftResponse>(
      '/api/v1/drift?memoryUsedPercent=62&tokenBurnRate=48&contextDriftPercent=34&sessionAgeMinutes=45',
    ),
  ]);

  let artifacts: ArtifactRecord[] | null = null;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      const { data } = await supabase
        .from('artifacts')
        .select('id, slug, title, category, description, created_at')
        .order('created_at', { ascending: false })
        .limit(4);

      artifacts = (data as ArtifactRecord[] | null) ?? null;
    }
  } catch (error) {
    console.warn('Failed to load Supabase artifacts for dashboard:', error);
  }

  const now = new Date();
  const missionMeta = formatDateParts(now);

  const commandQueue = buildCommandQueue(artifacts);
  const nodes = buildGlobalNodes(artifacts);
  const threats = buildThreats(pressure, verbosity, halfLife, drift);
  const metrics = buildMetrics(pressure, verbosity, halfLife, drift);

  const operatorsOnline = 24 + commandQueue.length * 4;
  const signalStrength = Math.max(0.15, Math.min(1, 1 - drift.drift.score / 1.2));

  return {
    generatedAt: now.toISOString(),
    mission: {
      title: 'Orbital Defense Mesh',
      subtitle: 'Neon Skynet Sentinel · Canonical registry uplink',
      time: missionMeta.time,
      date: missionMeta.calendar,
      operatorsOnline,
      signalStrength,
    },
    metrics,
    commandQueue,
    threats,
    nodes,
  };
}
